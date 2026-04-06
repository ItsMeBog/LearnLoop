import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "./Images/Hams.png";
import { supabase } from "./lib/supabase";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const navItemStyles = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
      isActive
        ? "bg-teal-600 text-white shadow-md shadow-teal-200"
        : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
    }`;

  const navLinks = [
    { name: "Dashboard", path: "/dashboard/home", icon: "📊" },
    { name: "Tasks", path: "/dashboard/tasks", icon: "📝" },
    { name: "Subjects", path: "/dashboard/subjects", icon: "📚" },
    { name: "Notes", path: "/dashboard/notes", icon: "📄" },
    { name: "Resources", path: "/dashboard/resources", icon: "💡" },
    { name: "Exam Countdown", path: "/dashboard/exams", icon: "⏰" },
    { name: "Focus Mode", path: "/dashboard/focus", icon: "🎯" },
    { name: "Study Planner", path: "/dashboard/planner", icon: "🗓️" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col p-6 gap-2 z-40 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:block`}
    >
      <div className="flex items-center justify-between mb-10 px-2">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-teal-50 flex items-center justify-center shadow-sm">
            <img
              src={logo}
              alt="Logo"
              className="w-15 h-15 md:w-12 md:h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-teal-600">LearnLoop</h1>
        </div>

        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-400 hover:text-teal-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-2 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={navItemStyles}
            onClick={() => window.innerWidth < 768 && toggleSidebar()}
          >
            <span>{link.icon}</span> {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-gray-100"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
