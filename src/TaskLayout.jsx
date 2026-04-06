import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import TaskManager from "./TaskManager";
import AddTaskModal from "./AddTaskModal";
import { supabase } from "./lib/supabase";

const TaskLayout = () => {
  const { user, tasks, setTasks } = useOutletContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleAddTask = async (newTask) => {
    if (!user) return;

    try {
      if (editingTask) {
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title: newTask.title,
            subject: newTask.subject,
            deadline: newTask.deadline,
            priority: newTask.priority,
            status: newTask.status,
          })
          .eq("id", editingTask.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setTasks(tasks.map((task) => (task.id === editingTask.id ? data : task)));
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            title: newTask.title,
            subject: newTask.subject,
            deadline: newTask.deadline,
            priority: newTask.priority,
            status: newTask.status,
          })
          .select()
          .single();

        if (error) throw error;

        setTasks([data, ...tasks]);
      }

      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      alert(error.message || "Failed to save task.");
    }
  };

  const confirmDelete = async () => {
    if (!user || !taskToDelete) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks(tasks.filter((task) => task.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (error) {
      alert(error.message || "Failed to delete task.");
    }
  };

  const handleToggleComplete = async (id) => {
    if (!user) return;

    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;

    const nextStatus = currentTask.status === "Completed" ? "Pending" : "Completed";

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: nextStatus })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setTasks(tasks.map((task) => (task.id === id ? data : task)));
    } catch (error) {
      alert(error.message || "Failed to update task.");
    }
  };

  return (
    <>
      <TaskManager
        tasks={tasks}
        onOpenAdd={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
        onOpenEdit={(task) => {
          setEditingTask(task);
          setIsModalOpen(true);
        }}
        onConfirmDelete={(id) => setTaskToDelete(id)}
        onToggleComplete={handleToggleComplete}
      />

      {isModalOpen && (
        <AddTaskModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onAdd={handleAddTask}
          initialData={editingTask}
        />
      )}

      {taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              🗑️
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-gray-500 text-sm mb-8">
              This action cannot be undone. Are you sure you want to remove this task?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-3 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskLayout;
