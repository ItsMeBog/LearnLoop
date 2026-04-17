import { supabaseAdmin } from "./supabaseAdmin.js";
import { sendReminderEmail } from "./emailService.js";

const todayString = () => new Date().toISOString().slice(0, 10);

const tomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const ensureEmailSettings = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from("email_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("email_notification_settings")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return inserted;
};

const createInAppNotification = async ({
  userId,
  title,
  message,
  type = "task",
  relatedType = "task",
  relatedId = null,
}) => {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    related_type: relatedType,
    related_id: relatedId ? String(relatedId) : null,
  });

  if (error) {
    console.error("Failed to insert in-app notification:", error.message);
  }
};

const createEmailLog = async ({
  userId,
  email,
  subject,
  category,
  status,
  errorMessage = null,
}) => {
  const { error } = await supabaseAdmin.from("email_logs").insert({
    user_id: userId,
    email,
    subject,
    category,
    status,
    error_message: errorMessage,
  });

  if (error) {
    console.error("Failed to save email log:", error.message);
  }
};

const buildTaskEmailHtml = ({
  studentName,
  title,
  subject,
  deadline,
  urgency,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #0f766e;">LearnLoop Reminder</h2>
      <p>Hello ${studentName || "Student"},</p>
      <p>You have a task <strong>${urgency}</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p><strong>Task:</strong> ${title}</p>
        <p><strong>Subject:</strong> ${subject || "General"}</p>
        <p><strong>Deadline:</strong> ${deadline}</p>
      </div>
      <p>Please open LearnLoop to review your academic schedule.</p>
      <p style="margin-top: 24px;">— LearnLoop</p>
    </div>
  `;
};

const buildExamEmailHtml = ({
  studentName,
  subject,
  date,
  time,
  urgency,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #0f766e;">LearnLoop Exam Reminder</h2>
      <p>Hello ${studentName || "Student"},</p>
      <p>You have an exam <strong>${urgency}</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p><strong>Exam:</strong> ${subject}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
      </div>
      <p>Please open LearnLoop to prepare and review your schedule.</p>
      <p style="margin-top: 24px;">— LearnLoop</p>
    </div>
  `;
};

export const checkEmailReminders = async () => {
  console.log("Checking background email reminders...");

  const today = todayString();
  const tomorrow = tomorrowString();

  const { data: tasks, error: tasksError } = await supabaseAdmin
    .from("tasks")
    .select(`
      id,
      user_id,
      title,
      subject,
      deadline,
      status,
      emailed_today,
      emailed_tomorrow
    `)
    .neq("status", "Completed")
    .in("deadline", [today, tomorrow]);

  if (tasksError) {
    console.error("Task reminder fetch error:", tasksError.message);
    return;
  }

  for (const task of tasks || []) {
    try {
      const settings = await ensureEmailSettings(task.user_id);

      if (!settings.enable_task_emails) continue;

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", task.user_id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError.message);
        continue;
      }

      if (!profile?.email) {
        console.error(`No profile email found for user ${task.user_id}`);
        continue;
      }

      const fullName =
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
          : "Student";

      if (task.deadline === today && !task.emailed_today) {
        const subjectLine = "Task Due Today - LearnLoop";
        const html = buildTaskEmailHtml({
          studentName: fullName,
          title: task.title,
          subject: task.subject,
          deadline: task.deadline,
          urgency: "due today",
        });

        await sendReminderEmail({
          to: profile.email,
          subject: subjectLine,
          html,
        });

        await supabaseAdmin
          .from("tasks")
          .update({ emailed_today: true })
          .eq("id", task.id)
          .eq("user_id", task.user_id);

        await createInAppNotification({
          userId: task.user_id,
          title: "Task Due Today",
          message: `${task.title} for ${task.subject} is due today.`,
          type: "task",
          relatedType: "task",
          relatedId: task.id,
        });

        await createEmailLog({
          userId: task.user_id,
          email: profile.email,
          subject: subjectLine,
          category: "task_due_today",
          status: "sent",
        });

        console.log(`Sent today reminder for task: ${task.title}`);
      }

      if (task.deadline === tomorrow && !task.emailed_tomorrow) {
        const subjectLine = "Task Due Tomorrow - LearnLoop";
        const html = buildTaskEmailHtml({
          studentName: fullName,
          title: task.title,
          subject: task.subject,
          deadline: task.deadline,
          urgency: "due tomorrow",
        });

        await sendReminderEmail({
          to: profile.email,
          subject: subjectLine,
          html,
        });

        await supabaseAdmin
          .from("tasks")
          .update({ emailed_tomorrow: true })
          .eq("id", task.id)
          .eq("user_id", task.user_id);

        await createInAppNotification({
          userId: task.user_id,
          title: "Task Due Tomorrow",
          message: `${task.title} for ${task.subject} is due tomorrow.`,
          type: "task",
          relatedType: "task",
          relatedId: task.id,
        });

        await createEmailLog({
          userId: task.user_id,
          email: profile.email,
          subject: subjectLine,
          category: "task_due_tomorrow",
          status: "sent",
        });

        console.log(`Sent tomorrow reminder for task: ${task.title}`);
      }
    } catch (error) {
      console.error("Task reminder send error:", error.message);

      await createEmailLog({
        userId: task.user_id,
        email: null,
        subject: "Task Reminder Failed",
        category: "task_reminder_error",
        status: "failed",
        errorMessage: error.message,
      });
    }
  }

  const { data: exams, error: examsError } = await supabaseAdmin
    .from("exams")
    .select(`
      id,
      user_id,
      subject,
      date,
      time,
      emailed_one_day,
      emailed_one_hour
    `);

  if (examsError) {
    console.error("Exam reminder fetch error:", examsError.message);
    return;
  }

  for (const exam of exams || []) {
    try {
      const settings = await ensureEmailSettings(exam.user_id);

      if (!settings.enable_exam_emails) continue;
      if (!exam.date || !exam.time) continue;

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", exam.user_id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError.message);
        continue;
      }

      if (!profile?.email) {
        console.error(`No profile email found for user ${exam.user_id}`);
        continue;
      }

      const fullName =
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
          : "Student";

      const now = new Date();
      const examDateTime = new Date(`${exam.date}T${exam.time}`);
      const diffMs = examDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours > 23 && diffHours <= 24 && !exam.emailed_one_day) {
        const subjectLine = "Exam Tomorrow - LearnLoop";
        const html = buildExamEmailHtml({
          studentName: fullName,
          subject: exam.subject,
          date: exam.date,
          time: exam.time,
          urgency: "tomorrow",
        });

        await sendReminderEmail({
          to: profile.email,
          subject: subjectLine,
          html,
        });

        await supabaseAdmin
          .from("exams")
          .update({ emailed_one_day: true })
          .eq("id", exam.id)
          .eq("user_id", exam.user_id);

        await createInAppNotification({
          userId: exam.user_id,
          title: "Exam Tomorrow",
          message: `${exam.subject} is scheduled tomorrow at ${exam.time}.`,
          type: "exam",
          relatedType: "exam",
          relatedId: exam.id,
        });

        await createEmailLog({
          userId: exam.user_id,
          email: profile.email,
          subject: subjectLine,
          category: "exam_one_day",
          status: "sent",
        });

        console.log(`Sent tomorrow exam reminder for: ${exam.subject}`);
      }

      if (diffHours > 0 && diffHours <= 1 && !exam.emailed_one_hour) {
        const subjectLine = "Exam Starting Soon - LearnLoop";
        const html = buildExamEmailHtml({
          studentName: fullName,
          subject: exam.subject,
          date: exam.date,
          time: exam.time,
          urgency: "starting within 1 hour",
        });

        await sendReminderEmail({
          to: profile.email,
          subject: subjectLine,
          html,
        });

        await supabaseAdmin
          .from("exams")
          .update({ emailed_one_hour: true })
          .eq("id", exam.id)
          .eq("user_id", exam.user_id);

        await createInAppNotification({
          userId: exam.user_id,
          title: "Exam Starting Soon",
          message: `${exam.subject} starts within 1 hour at ${exam.time}.`,
          type: "exam",
          relatedType: "exam",
          relatedId: exam.id,
        });

        await createEmailLog({
          userId: exam.user_id,
          email: profile.email,
          subject: subjectLine,
          category: "exam_one_hour",
          status: "sent",
        });

        console.log(`Sent 1-hour exam reminder for: ${exam.subject}`);
      }
    } catch (error) {
      console.error("Exam reminder send error:", error.message);

      await createEmailLog({
        userId: exam.user_id,
        email: null,
        subject: "Exam Reminder Failed",
        category: "exam_reminder_error",
        status: "failed",
        errorMessage: error.message,
      });
    }
  }

  console.log("Background email reminder check complete.");
};