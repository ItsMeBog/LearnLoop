import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  X,
  Upload,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const emptyForm = {
  title: "",
  type: "PDF Document",
  subject: "",
  url: "",
  fileName: "",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const sanitizeFileName = (fileName) =>
  fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");

const Resource = () => {
  const [userId, setUserId] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, storagePath: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadResources = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      if (mounted) setUserId(user.id);

      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && mounted) {
        setResources(data || []);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadResources();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setPendingFile(file);
      setFormData((prev) => ({
        ...prev,
        title: file.name.split(".").slice(0, -1).join(".") || file.name,
        fileName: file.name,
      }));
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();

    if (!userId) return;

    try {
      if (formData.type === "PDF Document") {
        if (!pendingFile) {
          alert("Please upload a PDF file first.");
          return;
        }

        const filePath = `${userId}/${Date.now()}-${sanitizeFileName(pendingFile.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("study-resources")
          .upload(filePath, pendingFile, {
            contentType: pendingFile.type || "application/pdf",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from("resources")
          .insert({
            user_id: userId,
            title: formData.title,
            type: formData.type,
            subject: formData.subject,
            file_name: pendingFile.name,
            storage_path: filePath,
            url: null,
          })
          .select()
          .single();

        if (error) throw error;

        setResources([data, ...resources]);
      } else {
        const { data, error } = await supabase
          .from("resources")
          .insert({
            user_id: userId,
            title: formData.title,
            type: formData.type,
            subject: formData.subject,
            url: formData.url,
            file_name: null,
            storage_path: null,
          })
          .select()
          .single();

        if (error) throw error;

        setResources([data, ...resources]);
      }

      setFormData(emptyForm);
      setPendingFile(null);
      setIsModalOpen(false);
    } catch (error) {
      alert(error.message || "Failed to save resource.");
    }
  };

  const confirmDelete = async () => {
    if (!userId || !deleteModal.id) return;

    try {
      if (deleteModal.storagePath) {
        const { error: storageError } = await supabase.storage
          .from("study-resources")
          .remove([deleteModal.storagePath]);

        if (storageError) {
          console.error("Storage delete error:", storageError.message);
        }
      }

      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", deleteModal.id)
        .eq("user_id", userId);

      if (error) throw error;

      setResources(resources.filter((resource) => resource.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, storagePath: null });
    } catch (error) {
      alert(error.message || "Failed to delete resource.");
    }
  };

  const openResource = async (resource) => {
    try {
      if (resource.type === "Link" && resource.url) {
        window.open(resource.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (resource.storage_path) {
        const { data, error } = await supabase.storage
          .from("study-resources")
          .createSignedUrl(resource.storage_path, 60);

        if (error) throw error;

        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      alert(error.message || "Failed to open resource.");
    }
  };

  const filteredResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.subject.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [resources, searchQuery]
  );

  

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10 text-left">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
            Resource Repository
          </h1>
          <p className="text-[11px] md:text-sm text-slate-500 font-medium italic">
            Your library for notes and study guides
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl hover:bg-teal-700 transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          <span className="font-bold text-[11px] md:text-sm uppercase tracking-wider">
            Add Resource
          </span>
        </button>
      </div>

      <div className="relative mb-6 md:mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search materials..."
          className="w-full pl-11 pr-4 py-2.5 md:py-3.5 bg-white border border-slate-200 rounded-xl md:rounded-2xl outline-none shadow-sm focus:ring-4 focus:ring-teal-500/10 text-xs md:text-sm font-medium transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredResources.length === 0 ? (
        <div className="py-16 md:py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2.5rem] bg-white/40">
          <Upload className="text-slate-200 mx-auto mb-4" size={32} />
          <h3 className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-tight">
            Repository is empty
          </h3>
          <p className="text-[10px] md:text-sm text-slate-400 font-medium">
            Click "Add Resource" to upload materials
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all border-b-4 hover:border-b-teal-500 group"
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div
                  className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${
                    resource.type === "Link"
                      ? "bg-blue-50 text-blue-500"
                      : "bg-rose-50 text-rose-500"
                  }`}
                >
                  {resource.type === "Link" ? <LinkIcon size={18} /> : <FileText size={18} />}
                </div>

                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      id: resource.id,
                      storagePath: resource.storage_path || null,
                    })
                  }
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-sm md:text-lg font-bold text-slate-800 text-left line-clamp-1 leading-tight">
                {resource.title}
              </h3>
              <p className="text-[9px] md:text-[10px] text-teal-600 font-black mb-4 text-left uppercase tracking-[0.15em] opacity-80">
                {resource.subject}
              </p>

              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-50">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                  {formatDate(resource.created_at)}
                </span>
                <button
                  onClick={() => openResource(resource)}
                  className="flex items-center gap-1.5 text-slate-900 font-black text-[10px] md:text-xs hover:text-teal-600 uppercase tracking-wide"
                >
                  Open <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 md:mb-8">
              <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                New Material
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData(emptyForm);
                  setPendingFile(null);
                }}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4 md:space-y-6">
              <div className="text-left">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Type
                </label>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1.5 outline-none text-xs md:text-sm font-bold focus:bg-white focus:border-teal-500/20 transition-all"
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      type: e.target.value,
                      url: "",
                      fileName: "",
                    });
                    setPendingFile(null);
                  }}
                >
                  <option value="PDF Document">PDF Document</option>
                  <option value="Link">Web Link</option>
                </select>
              </div>

              {formData.type === "PDF Document" ? (
                <label className="flex flex-col items-center justify-center w-full h-28 md:h-36 border-2 border-dashed border-slate-200 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group">
                  <Upload
                    className="text-slate-300 mb-2 group-hover:text-teal-500 transition-colors"
                    size={20}
                  />
                  <span className="text-[10px] md:text-sm text-slate-500 font-bold px-4 text-center line-clamp-1">
                    {formData.fileName || "Upload PDF"}
                  </span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="text-left">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    URL
                  </label>
                  <input
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1.5 text-xs md:text-sm font-medium focus:bg-white focus:border-teal-500/20 outline-none"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Title
                  </label>
                  <input
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1.5 text-xs md:text-sm font-medium focus:bg-white focus:border-teal-500/20 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Subject
                  </label>
                  <input
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1.5 text-xs md:text-sm font-medium focus:bg-white focus:border-teal-500/20 outline-none"
                    placeholder="e.g. ITN101"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl md:rounded-2xl hover:bg-teal-700 shadow-xl transition-all active:scale-[0.98] mt-2 uppercase text-[10px] md:text-xs tracking-widest"
              >
                Save Resource
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-1001">
          <div className="bg-white rounded-4xl w-full max-w-sm shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Delete Resource?
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                This material will be permanently removed from your repository.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: null, storagePath: null })}
                  className="py-3.5 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-3.5 px-4 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all text-[10px] uppercase tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resource;
