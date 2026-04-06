import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Timer,
  Plus,
  X,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const emptyForm = {
  subject: "",
  date: "",
  time: "",
  location: "",
  notes: "",
};

const ExamCountdown = () => {
  const { user, exams = [], setExams } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState(emptyForm);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const first = new Date(`${a.date}T${a.time}`);
        const second = new Date(`${b.date}T${b.time}`);
        return first - second;
      }),
    [exams]
  );

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("exams")
        .insert({
          user_id: user.id,
          subject: formData.subject,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          notes: formData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      setExams([...exams, data]);
      setFormData(emptyForm);
      setIsModalOpen(false);
    } catch (error) {
      alert(error.message || "Failed to add exam.");
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteModal.id) return;

    try {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", deleteModal.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setExams(exams.filter((exam) => exam.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      alert(error.message || "Failed to delete exam.");
    }
  };

  const getTimeParts = (examDate, examTime) => {
    const target = new Date(`${examDate}T${examTime}`);
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      total: diff,
    };
  };

  const getProgress = (createdAt, examDate, examTime) => {
    const start = new Date(createdAt).getTime();
    const end = new Date(`${examDate}T${examTime}`).getTime();
    const current = now.getTime();
    const progress = ((current - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100).toFixed(0);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10">
        <div className="text-left">
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
            Exam Deadlines
          </h1>
          <p className="text-[11px] md:text-sm text-gray-500 font-medium italic">
            Precision tracking for your assessments
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl hover:bg-teal-700 shadow-md active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span className="font-bold text-[11px] md:text-sm uppercase tracking-wider">
            Add Deadline
          </span>
        </button>
      </div>

      {sortedExams.length === 0 ? (
        <div className="py-16 md:py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2.5rem] bg-white/40">
          <Timer className="text-slate-200 mx-auto mb-4" size={32} />
          <h3 className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-tight">
            No deadlines set
          </h3>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {sortedExams.map((exam) => {
            const timeLeft = getTimeParts(exam.date, exam.time);
            const progress = getProgress(exam.created_at, exam.date, exam.time);
            const isUrgent = timeLeft.total > 0 && timeLeft.total < 3 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={exam.id}
                className="bg-teal border border-teal-100 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-sm relative overflow-hidden text-left hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div>
                    <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">
                      {exam.subject}
                    </h2>
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 md:px-3 rounded-lg">
                        <Calendar size={12} />{" "}
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 md:px-3 rounded-lg">
                        <Clock size={12} /> {exam.time}
                      </span>
                      {exam.location && (
                        <span className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 md:px-3 rounded-lg">
                          <MapPin size={12} /> {exam.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteModal({ isOpen: true, id: exam.id })}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                  {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hrs", value: timeLeft.hours },
                    { label: "Min", value: timeLeft.minutes },
                    { label: "Sec", value: timeLeft.seconds },
                  ].map((unit) => (
                    <div key={unit.label} className="bg-teal-50/50 rounded-xl py-2 md:py-4 text-center">
                      <div className="text-xl md:text-4xl font-black text-teal-600 leading-none">
                        {unit.value}
                      </div>
                      <div className="text-[8px] md:text-[10px] font-black text-teal-300 uppercase tracking-widest mt-1">
                        {unit.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 md:mb-6">
                  <div className="flex justify-between text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    <span>Study Timeline</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-teal-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {isUrgent && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 mb-4 md:mb-6">
                    <AlertCircle className="text-teal-500" size={14} />
                    <p className="text-[10px] md:text-xs font-bold text-teal-600 italic uppercase">
                      Crunch time: Under 72 hours left!
                    </p>
                  </div>
                )}

                {exam.notes && (
                  <div className="pt-3 md:pt-4 border-t border-slate-50">
                    <h4 className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">
                      Note
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {exam.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                New Deadline
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4 text-left">
              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Subject / Title
                </label>
                <input
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-xs md:text-sm font-medium focus:bg-white focus:border-teal-500/20 outline-none"
                  placeholder="e.g., ITN Midterms"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-xs md:text-sm font-medium outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Time
                  </label>
                  <input
                    required
                    type="time"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-xs md:text-sm font-medium outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Location
                </label>
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-xs md:text-sm font-medium outline-none"
                  placeholder="e.g., CCS Lab"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Notes
                </label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 h-20 resize-none text-xs md:text-sm font-medium outline-none"
                  placeholder="Requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-900 text-white font-black py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-[0.98] mt-2 uppercase text-[10px] md:text-xs tracking-widest"
              >
                Confirm Deadline
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-1001">
          <div className="bg-white rounded-4xl w-full max-w-sm shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-teal-500 mb-4">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Remove Deadline?
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Are you sure you want to delete this exam? This action cannot be undone.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: null })}
                  className="py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-3 px-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 shadow-lg shadow-teal-200 transition-all text-xs uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCountdown;
