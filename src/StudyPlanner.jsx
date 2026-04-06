import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "./lib/supabase";

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeOptions = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const durationOptions = ["30 mins", "1 hour", "1.5 hours", "2 hours", "3 hours"];

const emptyForm = {
  day_name: "Monday",
  start_time: "09:00",
  subject: "",
  activity: "",
  duration: "1 hour",
};

const getMonday = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const formatWeekRange = (monday) => {
  const sunday = addDays(monday, 6);
  return `${monday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })} - ${sunday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
};

const StudyPlanner = () => {
  const { user } = useOutletContext();

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const weekDates = useMemo(() => {
    return dayNames.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        day,
        fullDate: date,
        dateLabel: formatDateLabel(date),
        isoDate: date.toISOString().slice(0, 10),
      };
    });
  }, [weekStart]);

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = addDays(weekStart, 6).toISOString().slice(0, 10);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .gte("plan_date", weekStartStr)
        .lte("plan_date", weekEndStr)
        .order("plan_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Study planner load error:", error.message);
      } else {
        setSchedules(data || []);
      }

      setLoading(false);
    };

    loadSchedules();
  }, [user, weekStartStr, weekEndStr]);

  const groupedSchedules = useMemo(() => {
    const groups = {};
    for (const day of weekDates) {
      groups[day.day] = [];
    }

    schedules.forEach((item) => {
      if (!groups[item.day_name]) groups[item.day_name] = [];
      groups[item.day_name].push(item);
    });

    return groups;
  }, [schedules, weekDates]);

  const totalSessions = schedules.length;
  const uniqueSubjects = new Set(
    schedules.map((item) => item.subject.trim()).filter(Boolean)
  ).size;

  const totalHours = schedules.reduce((sum, item) => {
    const text = item.duration.toLowerCase();
    if (text.includes("30")) return sum + 0.5;
    if (text.includes("1.5")) return sum + 1.5;
    if (text.includes("2")) return sum + 2;
    if (text.includes("3")) return sum + 3;
    return sum + 1;
  }, 0);

  const activeDays = weekDates.filter((day) => (groupedSchedules[day.day] || []).length > 0).length;

  const openModal = () => {
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setFormData(emptyForm);
    setIsModalOpen(false);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!user) return;

    const selectedDay = weekDates.find((d) => d.day === formData.day_name);
    if (!selectedDay) return;

    const payload = {
      user_id: user.id,
      plan_date: selectedDay.isoDate,
      day_name: formData.day_name,
      start_time: formData.start_time,
      subject: formData.subject,
      activity: formData.activity,
      duration: formData.duration,
    };

    const { data, error } = await supabase
      .from("study_plans")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message || "Failed to save study block.");
      return;
    }

    setSchedules((prev) =>
      [...prev, data].sort((a, b) => {
        if (a.plan_date === b.plan_date) {
          return a.start_time.localeCompare(b.start_time);
        }
        return a.plan_date.localeCompare(b.plan_date);
      })
    );

    closeModal();
  };

  const handleDeleteSchedule = async () => {
    if (!user || !scheduleToDelete) return;

    const { error } = await supabase
      .from("study_plans")
      .delete()
      .eq("id", scheduleToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      alert(error.message || "Failed to delete study block.");
      return;
    }

    setSchedules((prev) => prev.filter((item) => item.id !== scheduleToDelete.id));
    setScheduleToDelete(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10">
        <div className="text-left">
          <h1 className="text-xl md:text-3xl font-black text-black-600 tracking-tight">
            Study Planner
          </h1>
          <p className="text-[11px] md:text-sm text-gray-500 font-medium italic">
            Plan your weekly study schedule
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl hover:bg-teal-800 shadow-md active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span className="font-bold text-[11px] md:text-sm">Add Schedule</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-4xl p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center">
            <h2 className="text-lg md:text-2xl font-bold text-slate-900">
              {formatWeekRange(weekStart)}
            </h2>
            <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-slate-100 rounded-full">
              Current Week
            </span>
          </div>

          <button
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-semibold">
          Loading study planner...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-4 mb-6">
            {weekDates.map((day) => {
              const daySchedules = groupedSchedules[day.day] || [];

              return (
                <div
                  key={day.day}
                  className="bg-white border border-slate-200 rounded-2xl p-4 min-h-55"
                >
                  <h3 className="text-lg font-bold text-slate-900">{day.day}</h3>
                  <p className="text-slate-400 text-sm mb-4">{day.dateLabel}</p>

                  {daySchedules.length === 0 ? (
                    <div className="h-30 flex items-center justify-center text-slate-300 text-sm">
                      No schedule
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySchedules.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-slate-50 border border-slate-100 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                {item.start_time}
                              </p>
                              <h4 className="font-bold text-slate-900">{item.subject}</h4>
                              <p className="text-sm text-slate-600">{item.activity}</p>
                              <p className="text-xs text-slate-400 mt-1">{item.duration}</p>
                            </div>

                            <button
                              onClick={() => setScheduleToDelete(item)}
                              className="text-slate-300 hover:text-red-500 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl md:rounded-4xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={20} />
              <h3 className="text-2xl font-bold text-slate-900">Weekly Summary</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-2xl p-6 text-center">
                <p className="text-4xl font-black text-blue-600">{totalSessions}</p>
                <p className="text-slate-600 mt-2">Total Sessions</p>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <p className="text-4xl font-black text-green-600">{uniqueSubjects}</p>
                <p className="text-slate-600 mt-2">Subjects</p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 text-center">
                <p className="text-4xl font-black text-purple-600">{totalHours.toFixed(1)}h</p>
                <p className="text-slate-600 mt-2">Study Hours</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-6 text-center">
                <p className="text-4xl font-black text-orange-600">{activeDays}</p>
                <p className="text-slate-600 mt-2">Active Days</p>
              </div>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Add Study Block</h2>
                <p className="text-slate-500 mt-1">Schedule a new study session</p>
              </div>

              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="p-6 space-y-5">
              <div>
                <label className="block font-semibold mb-2">Day *</label>
                <select
                  value={formData.day_name}
                  onChange={(e) => setFormData({ ...formData, day_name: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl outline-none"
                >
                  {dayNames.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Time *</label>
                <select
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl outline-none"
                >
                  {timeOptions.map((time) => (
                    <option key={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Subject *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Activity *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Study Session, Lecture, Lab"
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl outline-none"
                >
                  {durationOptions.map((duration) => (
                    <option key={duration}>{duration}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-800"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl">
              🗑️
            </div>
            <h3 className="text-xl font-black text-slate-900">Delete Study Block?</h3>
            <p className="text-slate-500 text-sm mt-2 mb-8">
              This schedule item will be removed permanently.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setScheduleToDelete(null)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSchedule}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;