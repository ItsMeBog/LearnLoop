import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

import Landing from "./Landing.jsx";
import Login from "./Login.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
import Dashboard from "./dashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Home from "./Home.jsx";
import TaskLayout from "./TaskLayout.jsx";
import SubjectLayout from "./SubjectLayout.jsx";
import Notes from "./Notes.jsx";
import StudyMaterial from "./StudyMaterial.jsx";
import Resource from "./Resource.jsx";
import ExamCountdown from "./ExamCountdown.jsx";
import FocusMode from "./FocusMode.jsx";
import StudyPlanner from "./StudyPlanner.jsx";

registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="tasks" element={<TaskLayout />} />
          <Route path="subjects" element={<SubjectLayout />} />
          <Route path="notes" element={<Notes />} />
          <Route path="study" element={<StudyMaterial />} />
          <Route path="resources" element={<Resource />} />
          <Route path="exams" element={<ExamCountdown />} />
          <Route path="focus" element={<FocusMode />} />
          <Route path="planner" element={<StudyPlanner />} />

          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center h-full text-slate-400 font-medium bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 m-6">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  ✨
                </div>
                <p className="italic">
                  This feature is currently under development...
                </p>
              </div>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
