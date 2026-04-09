import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  BookOpen,
  CheckCircle,
  ArrowUpRight,
  Bell,
  TrendingUp,
  Timer,
  Layout,
  Sparkles,
  AlertCircle,
  CalendarDays,
  Flame,
} from "lucide-react";

const Home = () => {
  const {
    user,
    tasks = [],
    subjects = [],
    exams = [],
    profile = null,
  } = useOutletContext();

  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studyReminders, setStudyReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [taskStreak, setTaskStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadStudyReminders = async () => {
      if (!user) {
        setLoadingReminders(false);
        return;
      }

      setLoadingReminders(true);

      const today = new Date();
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startDate = monday.toISOString().slice(0, 10);
      const endDate = sunday.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .gte("plan_date", startDate)
        .lte("plan_date", endDate)
        .order("plan_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Failed to load study reminders:", error.message);
        setStudyReminders([]);
      } else {
        setStudyReminders(data || []);
      }

      setLoadingReminders(false);
    };

    loadStudyReminders();
  }, [user]);

  useEffect(() => {
    const loadTaskStreak = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("task_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load task streak:", error.message);
        return;
      }

      if (data) {
        setTaskStreak(data);
      }
    };

    loadTaskStreak();
  }, [user, tasks]);

  const pendingTasks = tasks.filter((task) => task.status !== "Completed");
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;
  const progress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const hour = currentTime.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const studentName = profile?.first_name || "Scholar";

  const upcomingExams = useMemo(
    () =>
      exams.filter((exam) => {
        const examDate = new Date(`${exam.date}T${exam.time}`);
        return examDate > new Date();
      }),
    [exams],
  );

  const urgentExam = useMemo(() => {
    if (upcomingExams.length === 0) return null;

    return [...upcomingExams].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`),
    )[0];
  }, [upcomingExams]);

  const nextStudyBlocks = useMemo(
    () => studyReminders.slice(0, 3),
    [studyReminders],
  );

  const formatPlanDate = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto text-slate-900">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-teal-600 p-8 md:p-12 text-white shadow-xl shadow-teal-900/10 border-b-4 border-teal-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <Sparkles size={12} className="text-teal-100" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Student Workspace
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                {greeting},{" "}
                <span className="text-teal-200">{studentName}.</span>
              </h1>
              <p className="text-teal-50 text-sm md:text-base font-medium max-w-lg leading-relaxed opacity-90">
                Welcome to your digital study hub. You currently have{" "}
                <span className="text-white font-bold underline decoration-teal-300 underline-offset-4">
                  {pendingTasks.length} tasks
                </span>{" "}
                requiring attention.
              </p>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-teal-700/40 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-right shadow-lg">
              <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1 text-center">
                System Time
              </p>
              <p className="text-4xl font-black tabular-nums tracking-tighter text-center text-white">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-white w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full -mr-20 -mt-20 opacity-50"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          {
            label: "Active Tasks",
            val: pendingTasks.length,
            icon: <CheckCircle />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            path: "/dashboard/tasks",
          },
          {
            label: "Task Streak",
            val: `${taskStreak.current_streak || 0} day${taskStreak.current_streak === 1 ? "" : "s"}`,
            icon: <Flame />,
            color: "text-orange-600",
            bg: "bg-orange-50",
            path: "/dashboard/tasks",
          },
          {
            label: "Total Subjects",
            val: subjects.length,
            icon: <BookOpen />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            path: "/dashboard/subjects",
          },
          {
            label: "Exam Count",
            val: upcomingExams.length,
            icon: <Timer />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            path: "/dashboard/exams",
          },
          {
            label: "Completion",
            val: `${progress}%`,
            icon: <TrendingUp />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            path: "/dashboard/home",
          },
          {
            label: "Study Planner",
            val: "Open",
            icon: <CalendarDays />,
            color: "text-teal-600",
            bg: "bg-teal-50",
            path: "/dashboard/planner",
          },
        ].map((stat, index) => (
          <div
            key={index}
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all active:scale-95 group"
          >
            <div className="min-w-0">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter truncate">
                {stat.val}
              </p>
            </div>
            <div
              className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0`}
            >
              {React.cloneElement(stat.icon, { size: 22 })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              Upcoming Deadlines{" "}
              <ArrowUpRight size={16} className="text-teal-500" />
            </h3>
            <button
              onClick={() => navigate("/dashboard/tasks")}
              className="text-[10px] font-black uppercase text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-all border border-teal-100"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/dashboard/tasks")}
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-teal-200 hover:bg-teal-50/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                        {task.subject || "Study General"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-[9px] font-black rounded-lg uppercase tracking-tighter border border-teal-200">
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <Layout size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
                  No Active Tasks
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {urgentExam && (
            <div
              onClick={() => navigate("/dashboard/exams")}
              className="bg-teal-500 rounded-[2.5rem] p-8 text-white shadow-lg cursor-pointer hover:bg-teal-600 transition-all active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle
                    size={18}
                    className="text-rose-100 animate-pulse"
                  />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Urgent Assessment
                  </h3>
                </div>

                <h2 className="text-2xl font-black tracking-tight mb-1">
                  {urgentExam.subject}
                </h2>
                <p className="text-rose-100 text-xs font-bold uppercase tracking-widest">
                  {new Date(urgentExam.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  @ {urgentExam.time}
                </p>

                <div className="mt-6 flex justify-between items-center">
                  <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase">
                    Go to Countdown
                  </span>
                  <ArrowUpRight
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">
              Course Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tasks Completed
                </p>
                <span className="text-teal-600 font-black text-xl leading-none">
                  {progress}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/dashboard/planner")}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={18} className="text-teal-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">
                Weekly Plan
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-teal-50 border border-indigo-100 rounded-2xl">
                <div className="p-2 bg-teal-600 text-white rounded-lg">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-teal-900 uppercase tracking-wide leading-tight">
                    Schedule Sessions
                  </p>
                  <p className="text-[10px] text-teal-700 font-bold italic">
                    Organize your weekly study blocks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/dashboard/planner")}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm cursor-pointer hover:border-teal-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 mb-6">
              <Bell size={18} className="text-teal-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">
                Study Reminders
              </h3>
            </div>

            <div className="space-y-3">
              {loadingReminders ? (
                <div className="flex items-center gap-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                  <div className="p-2 bg-teal-600 text-white rounded-lg">
                    <span className="animate-pulse">
                      <Timer size={16} />
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-teal-900 uppercase tracking-wide leading-tight">
                      Loading
                    </p>
                    <p className="text-[10px] text-teal-700 font-bold italic">
                      Getting your schedule...
                    </p>
                  </div>
                </div>
              ) : nextStudyBlocks.length > 0 ? (
                nextStudyBlocks.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 bg-teal-600 text-white rounded-lg shrink-0">
                        <CalendarDays size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-teal-900 uppercase tracking-wide leading-tight truncate">
                          {item.subject}
                        </p>
                        <p className="text-[10px] text-teal-700 font-bold italic truncate">
                          {item.activity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-slate-700">
                        {item.start_time}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">
                        {formatPlanDate(item.plan_date)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="p-2 bg-slate-300 text-white rounded-lg">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide leading-tight">
                      No Schedule Yet
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold italic">
                      Add your study plan for this week.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-teal-600 font-black uppercase tracking-wider">
                Open full study planner
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
