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

  const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadTaskFiles = async (filesToUpload) => {
    if (!user) return [];

    const uploaded = [];

    for (const file of filesToUpload) {
      if (!file.rawFile) {
        uploaded.push(file);
        continue;
      }

      const safeName = sanitizeFileName(file.name);
      const filePath = `${user.id}/tasks/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeName}`;

      const { error } = await supabase.storage
        .from("study-resources")
        .upload(filePath, file.rawFile, {
          upsert: false,
        });

      if (error) throw error;

      uploaded.push({
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: filePath,
      });
    }

    return uploaded;
  };

  const handleOpenMaterial = async (file) => {
    try {
      if (!file.storage_path) {
        alert(
          "This file was saved before real uploads were enabled, so it cannot be opened yet.",
        );
        return;
      }

      const { data, error } = await supabase.storage
        .from("study-resources")
        .createSignedUrl(file.storage_path, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Unable to open file.");
      }
    } catch (error) {
      alert(error.message || "Failed to open file.");
    }
  };

  const handleAddTask = async (newTask) => {
    if (!user) return;

    try {
      const uploadedMaterials = await uploadTaskFiles(newTask.materials || []);

      if (editingTask) {
        const oldMaterials = Array.isArray(editingTask.materials)
          ? editingTask.materials
          : [];

        const oldPaths = oldMaterials
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        const newPaths = uploadedMaterials
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        const removedPaths = oldPaths.filter(
          (path) => !newPaths.includes(path),
        );

        if (removedPaths.length > 0) {
          await supabase.storage.from("study-resources").remove(removedPaths);
        }

        const updatePayload = {
          title: newTask.title,
          subject: newTask.subject,
          deadline: newTask.deadline,
          priority: newTask.priority,
          status: newTask.status,
          materials: uploadedMaterials,
        };

        if (newTask.status === "Completed") {
          updatePayload.completed_at =
            editingTask.status === "Completed"
              ? editingTask.completed_at || new Date().toISOString()
              : new Date().toISOString();
        } else {
          updatePayload.completed_at = null;
        }

        const { data, error } = await supabase
          .from("tasks")
          .update(updatePayload)
          .eq("id", editingTask.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setTasks(
          tasks.map((task) => (task.id === editingTask.id ? data : task)),
        );
      } else {
        const insertPayload = {
          user_id: user.id,
          title: newTask.title,
          subject: newTask.subject,
          deadline: newTask.deadline,
          priority: newTask.priority,
          status: newTask.status,
          materials: uploadedMaterials,
          completed_at:
            newTask.status === "Completed" ? new Date().toISOString() : null,
        };

        const { data, error } = await supabase
          .from("tasks")
          .insert(insertPayload)
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
      const task = tasks.find((item) => item.id === taskToDelete);

      if (task?.materials?.length) {
        const paths = task.materials
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        if (paths.length > 0) {
          await supabase.storage.from("study-resources").remove(paths);
        }
      }

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

  const updateTaskStreak = async () => {
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    let { data: streakRow, error: streakError } = await supabase
      .from("task_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (streakError) throw streakError;

    if (!streakRow) {
      const { error: insertError } = await supabase
        .from("task_streaks")
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_completed_date: today,
        });

      if (insertError) throw insertError;
      return;
    }

    if (streakRow.last_completed_date === today) {
      return;
    }

    let nextCurrentStreak = 1;

    if (streakRow.last_completed_date === yesterday) {
      nextCurrentStreak = streakRow.current_streak + 1;
    }

    const nextLongestStreak = Math.max(
      streakRow.longest_streak || 0,
      nextCurrentStreak,
    );

    const { error: updateError } = await supabase
      .from("task_streaks")
      .update({
        current_streak: nextCurrentStreak,
        longest_streak: nextLongestStreak,
        last_completed_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;
  };

  const handleToggleComplete = async (id) => {
    if (!user) return;

    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;

    const nextStatus =
      currentTask.status === "Completed" ? "Pending" : "Completed";
    const completedAt =
      nextStatus === "Completed" ? new Date().toISOString() : null;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: nextStatus,
          completed_at: completedAt,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setTasks(tasks.map((task) => (task.id === id ? data : task)));

      if (nextStatus === "Completed") {
        await updateTaskStreak();
      }
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
        onOpenMaterial={handleOpenMaterial}
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
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Delete Task?
            </h3>
            <p className="text-gray-500 text-sm mb-8">
              This action cannot be undone. Are you sure you want to remove this
              task?
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
