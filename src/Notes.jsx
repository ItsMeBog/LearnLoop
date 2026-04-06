import React, { useEffect, useMemo, useState } from "react";
import { Search, Calendar, Trash2, Edit3, X } from "lucide-react";
import { supabase } from "./lib/supabase";

const emptyNote = {
  id: null,
  title: "",
  subject: "",
  content: "",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Notes = () => {
  const [userId, setUserId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [currentNote, setCurrentNote] = useState(emptyNote);

  useEffect(() => {
    let mounted = true;

    const loadNotes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      if (mounted) setUserId(user.id);

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && mounted) {
        setNotes(data || []);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadNotes();

    return () => {
      mounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setCurrentNote(emptyNote);
    setIsPreviewMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setCurrentNote({
      id: note.id,
      title: note.title,
      subject: note.subject,
      content: note.content,
    });
    setIsPreviewMode(true);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!userId || !currentNote.title.trim() || !currentNote.subject.trim() || !currentNote.content.trim()) {
      return;
    }

    try {
      if (currentNote.id) {
        const { data, error } = await supabase
          .from("notes")
          .update({
            title: currentNote.title,
            subject: currentNote.subject,
            content: currentNote.content,
          })
          .eq("id", currentNote.id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;

        setNotes(notes.map((note) => (note.id === currentNote.id ? data : note)));
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert({
            user_id: userId,
            title: currentNote.title,
            subject: currentNote.subject,
            content: currentNote.content,
          })
          .select()
          .single();

        if (error) throw error;

        setNotes([data, ...notes]);
      }

      setIsModalOpen(false);
      setCurrentNote(emptyNote);
    } catch (error) {
      alert(error.message || "Failed to save note.");
    }
  };

  const confirmDelete = async () => {
    if (!userId || !noteToDelete) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteToDelete)
        .eq("user_id", userId);

      if (error) throw error;

      setNotes(notes.filter((note) => note.id !== noteToDelete));
      setNoteToDelete(null);
    } catch (error) {
      alert(error.message || "Failed to delete note.");
    }
  };

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSubject =
          selectedSubject === "All Subjects" || note.subject === selectedSubject;

        return matchesSearch && matchesSubject;
      }),
    [notes, searchTerm, selectedSubject]
  );

  const uniqueSubjects = useMemo(
    () => ["All Subjects", ...new Set(notes.map((note) => note.subject))],
    [notes]
  );

  

  return (
    <div className="p-6 lg:p-10 bg-transparent min-h-full font-sans text-left animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8 gap-2">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
              Note Taking
            </h1>
            <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">
              Organize your study references
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-teal-600 text-white px-3 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold hover:bg-teal-800 transition-all active:scale-95 flex items-center gap-1 md:gap-2 shadow-sm shrink-0"
          >
            <span className="text-base md:text-xl">＋</span>
            <span className="text-[10px] md:text-sm uppercase tracking-wider">New Note</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-50 bg-white transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2.5 border border-gray-100 rounded-xl bg-white text-gray-600 outline-none focus:ring-4 focus:ring-gray-50 font-bold text-xs"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => openEditModal(note)}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="h-1 w-full bg-teal-500"></div>

                <div className="p-4 md:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base truncate leading-tight group-hover:text-teal-600 transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-[9px] md:text-[11px] text-gray-400 font-bold uppercase truncate">
                        {note.subject}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete(note.id);
                      }}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-[10px] md:text-xs text-gray-400 mb-6 line-clamp-4 leading-relaxed grow">
                    {note.content}
                  </p>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-teal-500" />
                      {formatDate(note.created_at)}
                    </div>
                    <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 md:py-24 flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-2xl md:rounded-3xl text-center px-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-2xl md:text-3xl mb-4">
              📝
            </div>
            <p className="text-gray-400 font-bold text-sm md:text-base">No notes found</p>
          </div>
        )}
      </div>

      {noteToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-center animate-in scale-95 duration-200 shadow-2xl">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl md:text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-base md:text-lg font-black text-gray-900 mb-1 leading-tight">
              Remove Note?
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-6 md:mb-8">
              Permanent Action
            </p>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setNoteToDelete(null)}
                className="flex-1 py-2.5 border border-gray-100 rounded-xl font-bold text-gray-400 uppercase text-[9px] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold uppercase text-[9px] active:scale-95 transition-all shadow-sm shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl md:text-2xl font-black text-gray-900">
                  {currentNote.id ? (isPreviewMode ? "Preview Note" : "Edit Note") : "New Note"}
                </h2>
                {currentNote.id && (
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:text-teal-600 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    {isPreviewMode ? "✎ Edit" : "👁 Preview"}
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-300 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {isPreviewMode ? (
                <div className="text-left">
                  <span className="inline-block bg-teal-50 text-teal-700 text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-2">
                    {currentNote.subject || "Uncategorized"}
                  </span>
                  <h1 className="text-3xl font-black text-gray-900 mb-4">{currentNote.title}</h1>
                  <p className="text-gray-500 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentNote.content}
                  </p>
                </div>
              ) : (
                <form id="note-form" onSubmit={handleSaveNote} className="space-y-4">
                  <input
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-bold border border-transparent focus:border-teal-500/20 transition-all"
                    placeholder="Note Title"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                  />
                  <input
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-bold border border-transparent focus:border-teal-500/20 transition-all"
                    placeholder="Subject Name"
                    value={currentNote.subject}
                    onChange={(e) => setCurrentNote({ ...currentNote, subject: e.target.value })}
                  />
                  <textarea
                    required
                    rows="10"
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-xl outline-none text-sm resize-none leading-relaxed border border-transparent focus:border-teal-500/20 transition-all"
                    placeholder="Write your notes here..."
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                  />
                </form>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-widest"
              >
                Cancel
              </button>
              {!isPreviewMode && (
                <button
                  type="submit"
                  form="note-form"
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
                >
                  {currentNote.id ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
