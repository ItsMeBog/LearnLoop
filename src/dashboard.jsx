import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { LogOut, HelpCircle, X } from "lucide-react";
import logo from "./Images/Hams.png";
import profileImg from "./Images/Hams1.png";
import { supabase } from "./lib/supabase";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const navigate = useNavigate();

  const navLinks = [
    { name: "Dashboard", path: "/dashboard/home", icon: "📊" },
    { name: "Tasks", path: "/dashboard/tasks", icon: "📝" },
    { name: "Subjects", path: "/dashboard/subjects", icon: "📚" },
    { name: "Notes", path: "/dashboard/notes", icon: "📄" },
    { name: "Study AI", path: "/dashboard/study", icon: "✨" },
    { name: "Resources", path: "/dashboard/resources", icon: "💡" },
    { name: "Exam Countdown", path: "/dashboard/exams", icon: "⏰" },
    { name: "Focus Mode", path: "/dashboard/focus", icon: "🎯" },
    { name: "Study Planner", path: "/dashboard/planner", icon: "🗓️" },
  ];

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error.message);
      return;
    }

    setProfile(data || null);
  }, []);

  const loadTasks = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Tasks load error:", error.message);
      return;
    }

    setTasks(data || []);
  }, []);

  const loadSubjects = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Subjects load error:", error.message);
      return;
    }

    setSubjects(data || []);
  }, []);

  const loadExams = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Exams load error:", error.message);
      return;
    }

    setExams(data || []);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      await Promise.all([
        loadProfile(currentUser.id),
        loadTasks(currentUser.id),
        loadSubjects(currentUser.id),
        loadExams(currentUser.id),
      ]);
    } catch (error) {
      console.error("Dashboard load error:", error.message);
    }
  }, [loadExams, loadProfile, loadSubjects, loadTasks, navigate]);

  useEffect(() => {
    loadDashboardData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(session.user);
      loadDashboardData();
    });

    return () => subscription.unsubscribe();
  }, [loadDashboardData, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
      : user?.email || "Active User";

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-left">
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col p-5 z-40 transition-transform duration-300 md:translate-x-0 md:static shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-10 px-2 shrink-0">
          <div className="flex items-center gap-3 cursor-default">
            <div className="w-11 h-11 rounded-full  bg-teal-50 flex items-center justify-center shadow-sm">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>

            <h1 className="text-xl font-bold text-teal-600 tracking-tight">
              LearnLoop
            </h1>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 p-1 hover:bg-gray-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-700/20"
                    : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                }`
              }
              onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            >
              <span className="text-xl shrink-0">{link.icon}</span>
              <span className="text-sm">{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-5 border-t border-gray-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex items-center p-4 bg-white border-b border-gray-100 justify-between shrink-0 h-16 md:h-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-2xl text-teal-600"
          >
            ☰
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-gray-400 leading-none mb-1 uppercase tracking-widest">
                Student
              </p>
              <p className="text-sm font-black text-gray-800 leading-none">
                {displayName}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet
              context={{
                user,
                profile,
                tasks,
                setTasks,
                refreshTasks: () => loadTasks(user?.id),
                subjects,
                setSubjects,
                refreshSubjects: () => loadSubjects(user?.id),
                exams,
                setExams,
                refreshExams: () => loadExams(user?.id),
              }}
            />
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-100 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-4">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                End Session?
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Are you sure you want to log out of LearnLoop?
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3.5 px-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors text-[10px] uppercase tracking-widest"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="py-3.5 px-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 shadow-lg transition-all text-[10px] uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
