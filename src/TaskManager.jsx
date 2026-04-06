import React from "react";

const TaskManager = ({ tasks, onOpenAdd, onOpenEdit, onConfirmDelete, onToggleComplete }) => {
  const priorityStyles = (priority) => {
    const styles = {
      High: "bg-red-50 text-red-600 border-red-100",
      Medium: "bg-yellow-50 text-yellow-600 border-yellow-100",
      Low: "bg-teal-50 text-teal-600 border-teal-100",
    };
    return styles[priority] || styles.Low;
  };

  return (
    <div className="flex flex-col font-sans max-w-full">
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
            Task Management
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">
            Track your academic progress
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="bg-teal-600 text-white px-3 py-2 md:px-6 md:py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 active:scale-95 flex items-center gap-2 shrink-0"
        >
          <span className="text-sm md:text-xl">＋</span>
          <span className="text-[10px] sm:text-xs md:text-base tracking-wide uppercase">
            Add Task
          </span>
        </button>
      </div>

      <div className="grow">
        {tasks.length > 0 ? (
          <div className="grid gap-3 md:gap-4">
            {tasks.map((task) => {
              const isCompleted = task.status === "Completed";
              return (
                <div
                  key={task.id}
                  className={`bg-white border p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm transition-all hover:shadow-md ${
                    isCompleted ? "border-gray-200 opacity-60" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 md:gap-4">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => onToggleComplete(task.id)}
                        className="mt-1 h-4 w-4 md:h-5 md:w-5 rounded border-gray-300 text-teal-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h3
                          className={`text-sm md:text-lg font-bold truncate ${
                            isCompleted ? "line-through text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p
                          className={`text-[10px] md:text-sm font-medium ${
                            isCompleted ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {task.subject}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold border uppercase ${priorityStyles(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold border uppercase ${
                              isCompleted
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
                            📅 {task.deadline}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onOpenEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 text-sm md:text-base transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onConfirmDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 text-sm md:text-base transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 md:py-20 flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-2xl md:rounded-3xl text-center px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-4">
              📝
            </div>
            <h3 className="text-base md:text-xl font-bold text-gray-800">No tasks yet</h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-xs">
              Your task list is empty. Tap the button above to create your first assignment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
