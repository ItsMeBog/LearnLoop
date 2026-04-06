import React, { useEffect, useState } from "react";

const defaultFormData = {
  title: "",
  subject: "",
  deadline: "",
  priority: "Medium",
  status: "Pending",
};

const AddTaskModal = ({ onClose, onAdd, initialData }) => {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        subject: initialData.subject || "",
        deadline: initialData.deadline || "",
        priority: initialData.priority || "Medium",
        status: initialData.status || "Pending",
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300 font-sans max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 md:right-6 md:top-6 text-gray-400 hover:text-gray-600 text-lg md:text-xl transition-colors"
        >
          ✕
        </button>

        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            {initialData ? "Edit Task" : "Add New Task"}
          </h2>
          <p className="text-gray-500 text-[11px] md:text-sm mt-1">
            Fill in the details for your assignment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Task Title
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300"
              placeholder="e.g. Physics Lab Report"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Subject
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="e.g. Science"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Deadline
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Priority
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none appearance-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                  ▼
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Status
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none appearance-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                  ▼
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 md:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 md:py-4 border border-gray-200 rounded-xl md:rounded-2xl font-bold text-gray-500 text-sm md:text-base hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 md:py-4 bg-teal-600 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-[0.98]"
            >
              {initialData ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
