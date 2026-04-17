import React from "react";

const TaskManager = ({
  tasks,
  onOpenAdd,
  onOpenEdit,
  onConfirmDelete,
  onToggleComplete,
  onOpenMaterial,
}) => {
  const priorityStyles = (priority) => {
    const styles = {
      High: "bg-red-50 text-red-600 border-red-100",
      Medium: "bg-yellow-50 text-yellow-600 border-yellow-100",
      Low: "bg-teal-50 text-teal-600 border-teal-100",
    };
    return styles[priority] || styles.Low;
  };

  const getFileColor = (type) => {
    switch ((type || "").toLowerCase()) {
      case "pdf":
        return "border-red-100 bg-red-50 text-red-600";
      case "ppt":
      case "pptx":
        return "border-orange-100 bg-orange-50 text-orange-600";
      case "doc":
      case "docx":
        return "border-blue-100 bg-blue-50 text-blue-600";
      case "jpg":
      case "jpeg":
      case "png":
      case "webp":
        return "border-purple-100 bg-purple-50 text-purple-600";
      default:
        return "border-gray-100 bg-gray-50 text-gray-500";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              const materials = Array.isArray(task.materials)
                ? task.materials
                : [];

              return (
                <div
                  key={task.id}
                  className={`bg-white border p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm transition-all hover:shadow-md ${
                    isCompleted
                      ? "border-gray-200 opacity-60"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 md:gap-4 w-full min-w-0">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => onToggleComplete(task.id)}
                        className="mt-1 h-4 w-4 md:h-5 md:w-5 rounded border-gray-300 text-teal-600 cursor-pointer shrink-0"
                      />

                      <div className="min-w-0 w-full">
                        <h3
                          className={`text-sm md:text-lg font-bold truncate ${
                            isCompleted
                              ? "line-through text-gray-400"
                              : "text-gray-800"
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
                              task.priority,
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

                          <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 whitespace-nowrap">
                            📎 {materials.length} material
                            {materials.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                            Materials
                          </p>

                          {materials.length > 0 ? (
                            <div className="space-y-2">
                              {materials.map((file, index) => (
                                <div
                                  key={`${file.name}-${index}`}
                                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-100 bg-gray-50"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs font-bold text-gray-800 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                                      {file.type || "file"} •{" "}
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span
                                      className={`px-2 py-1 text-[8px] md:text-[9px] font-black rounded-full border uppercase ${getFileColor(
                                        file.type,
                                      )}`}
                                    >
                                      {file.type || "file"}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => onOpenMaterial(file)}
                                      className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[8px] md:text-[10px] font-black uppercase hover:bg-teal-700"
                                    >
                                      Open
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] md:text-xs text-gray-300 italic">
                              No materials attached.
                            </p>
                          )}
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
            <h3 className="text-base md:text-xl font-bold text-gray-800">
              No tasks yet
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-xs">
              Your task list is empty. Tap the button above to create your first
              assignment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
