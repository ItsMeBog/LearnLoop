import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "./lib/supabase";

const emptySubject = {
  name: "",
  professor: "",
  schedule: "",
  description: "",
  color: "bg-blue-500",
  files: [],
};

const SubjectLayout = () => {
  const { user, subjects, setSubjects } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState(emptySubject);
  const [isSaving, setIsSaving] = useState(false);

  const colorChoices = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files || []).map((file) => ({
      name: file.name,
      type: file.name.split(".").pop() || "file",
      size: file.size,
      rawFile: file,
    }));

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...uploadedFiles],
    }));
  };

  const removeFilePreAdd = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove),
    }));
  };

  const openEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || "",
      professor: subject.professor || "",
      schedule: subject.schedule || "",
      description: subject.description || "",
      color: subject.color || "bg-blue-500",
      files: Array.isArray(subject.files) ? subject.files : [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setFormData(emptySubject);
    setIsSaving(false);
  };

  const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadSubjectFiles = async (filesToUpload) => {
    if (!user) return [];

    const uploaded = [];

    for (const file of filesToUpload) {
      if (!file.rawFile) {
        uploaded.push(file);
        continue;
      }

      const safeName = sanitizeFileName(file.name);
      const filePath = `${user.id}/subjects/${Date.now()}-${Math.random()
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);

    try {
      const uploadedFiles = await uploadSubjectFiles(formData.files);

      if (editingSubject) {
        const oldFiles = Array.isArray(editingSubject.files)
          ? editingSubject.files
          : [];
        const oldPaths = oldFiles
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        const newPaths = uploadedFiles
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        const removedPaths = oldPaths.filter(
          (path) => !newPaths.includes(path),
        );

        for (const path of removedPaths) {
          await supabase.storage.from("study-resources").remove([path]);
        }

        const { data, error } = await supabase
          .from("subjects")
          .update({
            name: formData.name,
            professor: formData.professor,
            schedule: formData.schedule,
            description: formData.description,
            color: formData.color,
            files: uploadedFiles,
          })
          .eq("id", editingSubject.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setSubjects(
          subjects.map((subject) =>
            subject.id === editingSubject.id ? data : subject,
          ),
        );

        if (selectedSubject?.id === editingSubject.id) {
          setSelectedSubject(data);
        }
      } else {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            user_id: user.id,
            name: formData.name,
            professor: formData.professor,
            schedule: formData.schedule,
            description: formData.description,
            color: formData.color,
            files: uploadedFiles,
          })
          .select()
          .single();

        if (error) throw error;

        setSubjects([data, ...subjects]);
      }

      closeModal();
    } catch (error) {
      alert(error.message || "Failed to save subject.");
      setIsSaving(false);
    }
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

  const formatDisplayTime = (time) => {
    if (!time) return "No schedule";
    const [hours, minutes] = time.split(":");
    const hour = Number(hours);
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${suffix}`;
  };

  const openSubjectFile = async (file) => {
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

  const handleDelete = async () => {
    if (!user || !subjectToDelete) return;

    try {
      const subject = subjects.find((item) => item.id === subjectToDelete);

      if (subject?.files?.length) {
        const paths = subject.files
          .filter((file) => file.storage_path)
          .map((file) => file.storage_path);

        if (paths.length > 0) {
          await supabase.storage.from("study-resources").remove(paths);
        }
      }

      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectToDelete)
        .eq("user_id", user.id);

      if (error) throw error;

      setSubjects(subjects.filter((subject) => subject.id !== subjectToDelete));

      if (selectedSubject?.id === subjectToDelete) {
        setSelectedSubject(null);
      }

      setSubjectToDelete(null);
    } catch (error) {
      alert(error.message || "Failed to delete subject.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6 md:mb-8 gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
            Subject Organization
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">
            Manage your courses
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 text-white px-3 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold hover:bg-teal-800 transition-all active:scale-95 flex items-center gap-1 md:gap-2 shadow-sm shrink-0"
        >
          <span className="text-base md:text-xl">＋</span>
          <span className="text-[10px] md:text-sm uppercase tracking-wider">
            Add Subject
          </span>
        </button>
      </div>

      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className={`h-1 w-full ${sub.color}`}></div>
              <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div
                      className={`${sub.color} w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-white text-xs md:text-sm shrink-0`}
                    >
                      📖
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base truncate leading-tight">
                        {sub.name}
                      </h3>
                      <p className="text-[9px] md:text-[11px] text-gray-400 font-bold uppercase truncate">
                        {sub.professor}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-1 text-gray-300 hover:text-teal-600 transition-colors text-sm md:text-base"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setSubjectToDelete(sub.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors text-sm md:text-base"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="text-[9px] md:text-[11px] text-gray-500 flex items-center gap-1.5 mb-2 md:mb-3 font-semibold truncate">
                  <span>📅</span> {formatDisplayTime(sub.schedule)}
                </div>

                <p className="text-[10px] md:text-xs text-gray-400 mb-4 line-clamp-2 h-7 md:h-8 leading-relaxed">
                  {sub.description || "No description provided."}
                </p>

                <div className="mb-4">
                  <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    📎 Materials ({sub.files?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1 min-h-5">
                    {sub.files?.map((file, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 text-[8px] md:text-[9px] font-black rounded border uppercase tracking-tighter truncate max-w-32 ${getFileColor(
                          file.type,
                        )}`}
                      >
                        {file.name}
                      </span>
                    ))}
                    {(!sub.files || sub.files.length === 0) && (
                      <span className="text-[8px] md:text-[10px] text-gray-300 italic">
                        No files
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubject(sub)}
                  className="w-full mt-auto py-2 md:py-2.5 border border-gray-100 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black text-gray-500 hover:bg-gray-50 hover:text-teal-600 transition-all uppercase tracking-wide"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 md:py-24 flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-2xl md:rounded-3xl text-center px-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4">
            📚
          </div>
          <p className="text-gray-400 font-bold text-sm md:text-base">
            Empty Subject Library
          </p>
        </div>
      )}

      {selectedSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-120 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div
              className={`h-2 w-full ${selectedSubject.color || "bg-blue-500"}`}
            ></div>

            <div className="p-5 md:p-8 overflow-y-auto">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                    {selectedSubject.name}
                  </h2>
                  <p className="text-sm md:text-base text-gray-500 font-semibold mt-1">
                    {selectedSubject.professor || "No professor"}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Schedule
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDisplayTime(selectedSubject.schedule)}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Materials Count
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedSubject.files?.length || 0} file(s)
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Description
                </p>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed">
                  {selectedSubject.description || "No description provided."}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Uploaded Materials
                </p>

                {selectedSubject.files && selectedSubject.files.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSubject.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400 uppercase font-bold mt-1">
                            {file.type || "file"} • {formatFileSize(file.size)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase ${getFileColor(
                              file.type,
                            )}`}
                          >
                            {file.type || "file"}
                          </span>

                          <button
                            type="button"
                            onClick={() => openSubjectFile(file)}
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-teal-700"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center text-sm text-slate-400 italic">
                    No uploaded materials yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 md:mb-6">
              {editingSubject ? "Edit Subject" : "New Subject"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <input
                required
                className="w-full px-4 py-3 md:px-5 md:py-3.5 bg-gray-50 rounded-xl outline-none text-sm"
                placeholder="Subject Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                  Theme
                </label>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {colorChoices.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`${color} w-7 h-7 md:w-9 md:h-9 rounded-lg transition-all ${
                        formData.color === color
                          ? "ring-2 ring-offset-2 ring-gray-200"
                          : "opacity-40 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <input
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm"
                  placeholder="Professor"
                  value={formData.professor}
                  onChange={(e) =>
                    setFormData({ ...formData, professor: e.target.value })
                  }
                />
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                  Materials
                </label>

                <div className="relative group mb-2 md:mb-3">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <div className="w-full py-3 px-4 border-2 border-dashed border-gray-100 rounded-xl text-center bg-white group-hover:bg-gray-50 transition-colors">
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Browse Files
                    </span>
                  </div>
                </div>

                {formData.files.length > 0 && (
                  <div className="bg-gray-50 p-2 md:p-3 rounded-xl space-y-1 md:space-y-2 border border-gray-100 max-h-32 overflow-y-auto">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-1.5 md:p-2 rounded-lg border text-[8px] md:text-[10px] font-bold ${getFileColor(
                          file.type,
                        )}`}
                      >
                        <span className="truncate pr-2">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFilePreAdd(index)}
                          className="text-gray-400 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows="2"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none text-sm"
                placeholder="Description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <div className="flex gap-2 md:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 font-bold text-gray-400 uppercase text-[9px] md:text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingSubject ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl md:rounded-4xl p-6 md:p-8 text-center animate-in scale-95 duration-200">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl md:text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-base md:text-lg font-black text-gray-900 mb-1 leading-tight">
              Remove Subject?
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-6 md:mb-8 text-center">
              Permanent Action
            </p>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 py-2.5 border border-gray-100 rounded-xl font-bold text-gray-400 uppercase text-[9px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold uppercase text-[9px]"
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

export default SubjectLayout;
