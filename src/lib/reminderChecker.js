import { supabase } from "./supabase";
import {
  createNotification,
  ensureNotificationSettings,
  sendBrowserNotification,
} from "./notifications";

const sameDateString = (date) => date.toISOString().slice(0, 10);

const combineDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}`);
};

const minutesDiff = (target, now) => {
  return Math.floor((target.getTime() - now.getTime()) / 60000);
};

const hoursDiff = (target, now) => {
  return (target.getTime() - now.getTime()) / 3600000;
};

const daysDiff = (target, now) => {
  return Math.floor(
    (new Date(target.toDateString()).getTime() -
      new Date(now.toDateString()).getTime()) /
      86400000,
  );
};

const pushIfAllowed = (settings, title, message) => {
  if (settings?.enable_browser_notifications) {
    sendBrowserNotification({
      title,
      body: message,
    });
  }
};

export const checkReminders = async ({ userId, tasks = [], exams = [] }) => {
  if (!userId) return;

  const settings = await ensureNotificationSettings(userId);
  const now = new Date();

  if (settings.enable_task_reminders) {
    for (const task of tasks) {
      if (task.status === "Completed") continue;
      if (!task.deadline) continue;

      const dueDate = new Date(`${task.deadline}T00:00:00`);
      const dayGap = daysDiff(dueDate, now);

      if (dayGap === 1 && !task.reminded_tomorrow) {
        const title = "Task Due Tomorrow";
        const message = `${task.title} for ${task.subject} is due tomorrow.`;

        await createNotification({
          userId,
          title,
          message,
          type: "task",
          relatedType: "task",
          relatedId: task.id,
        });

        await supabase
          .from("tasks")
          .update({ reminded_tomorrow: true })
          .eq("id", task.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }

      if (dayGap === 0 && !task.reminded_today) {
        const title = "Task Due Today";
        const message = `${task.title} for ${task.subject} is due today.`;

        await createNotification({
          userId,
          title,
          message,
          type: "task",
          relatedType: "task",
          relatedId: task.id,
        });

        await supabase
          .from("tasks")
          .update({ reminded_today: true })
          .eq("id", task.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }
    }
  }

  if (settings.enable_exam_reminders) {
    for (const exam of exams) {
      if (!exam.date || !exam.time) continue;

      const examDateTime = combineDateTime(exam.date, exam.time);
      const totalHours = hoursDiff(examDateTime, now);

      if (totalHours > 23 && totalHours <= 24 && !exam.reminded_one_day) {
        const title = "Exam Tomorrow";
        const message = `${exam.subject} is scheduled tomorrow at ${exam.time}.`;

        await createNotification({
          userId,
          title,
          message,
          type: "exam",
          relatedType: "exam",
          relatedId: exam.id,
        });

        await supabase
          .from("exams")
          .update({ reminded_one_day: true })
          .eq("id", exam.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }

      if (totalHours > 0 && totalHours <= 1 && !exam.reminded_one_hour) {
        const title = "Exam Starting Soon";
        const message = `${exam.subject} starts within 1 hour at ${exam.time}.`;

        await createNotification({
          userId,
          title,
          message,
          type: "exam",
          relatedType: "exam",
          relatedId: exam.id,
        });

        await supabase
          .from("exams")
          .update({ reminded_one_hour: true })
          .eq("id", exam.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }
    }
  }

  if (settings.enable_study_reminders) {
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { data: plans, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", userId)
      .gte("plan_date", sameDateString(weekStart))
      .lte("plan_date", sameDateString(weekEnd))
      .order("plan_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Study reminder check error:", error.message);
      return;
    }

    for (const plan of plans || []) {
      if (!plan.plan_date || !plan.start_time) continue;

      const startDateTime = combineDateTime(plan.plan_date, plan.start_time);
      const mins = minutesDiff(startDateTime, now);

      if (mins >= 0 && mins <= 15 && !plan.reminded_15min) {
        const title = "Study Session Soon";
        const message = `${plan.subject} - ${plan.activity} starts in ${mins} minute${mins === 1 ? "" : "s"}.`;

        await createNotification({
          userId,
          title,
          message,
          type: "study",
          relatedType: "study_plan",
          relatedId: plan.id,
        });

        await supabase
          .from("study_plans")
          .update({ reminded_15min: true })
          .eq("id", plan.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }

      if (mins === 0 && !plan.reminded_start) {
        const title = "Study Session Started";
        const message = `${plan.subject} - ${plan.activity} is starting now.`;

        await createNotification({
          userId,
          title,
          message,
          type: "study",
          relatedType: "study_plan",
          relatedId: plan.id,
        });

        await supabase
          .from("study_plans")
          .update({ reminded_start: true })
          .eq("id", plan.id)
          .eq("user_id", userId);

        pushIfAllowed(settings, title, message);
      }
    }
  }
};