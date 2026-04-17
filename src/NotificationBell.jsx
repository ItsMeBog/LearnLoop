import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteSelectedNotifications,
} from "./lib/notifications";

const formatTimeAgo = (dateString) => {
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
};

const NotificationBell = ({ userId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const readNotifications = useMemo(
    () => notifications.filter((item) => item.is_read),
    [notifications],
  );

  const allReadSelected =
    readNotifications.length > 0 &&
    readNotifications.every((item) => selectedIds.includes(item.id));

  const loadNotifications = async () => {
    if (!userId) return;

    const { data, error } = await fetchNotifications(userId);

    if (error) {
      console.error("Notification load error:", error.message);
      return;
    }

    setNotifications(data || []);
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".notification-bell-wrap")) {
        setOpen(false);
        setSelectionMode(false);
        setSelectedIds([]);
      }
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) =>
        notifications.some((item) => item.id === id && item.is_read),
      ),
    );
  }, [notifications]);

  const handleOpenNotification = async (notification) => {
    if (selectionMode) return;

    if (!notification.is_read) {
      await markNotificationAsRead(notification.id, userId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    }

    if (notification.related_type === "task") {
      navigate("/dashboard/tasks");
    } else if (notification.related_type === "exam") {
      navigate("/dashboard/exams");
    } else if (notification.related_type === "study_plan") {
      navigate("/dashboard/planner");
    } else {
      navigate("/dashboard/home");
    }

    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true })),
    );
  };

  const handleStartSelection = () => {
    setSelectionMode(true);
    setSelectedIds([]);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelectNotification = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAllRead = () => {
    if (allReadSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(readNotifications.map((item) => item.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);

    const { error } = await deleteSelectedNotifications(selectedIds, userId);

    if (error) {
      console.error("Delete notifications error:", error.message);
      setIsDeleting(false);
      return;
    }

    setNotifications((prev) =>
      prev.filter((item) => !selectedIds.includes(item.id)),
    );

    setSelectedIds([]);
    setSelectionMode(false);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  return (
    <>
      <div
        className="relative notification-bell-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className="relative p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-14 w-[24rem] max-w-[95vw] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Notifications
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!selectionMode ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllRead();
                      }}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700"
                    >
                      <CheckCheck size={14} />
                      Read all
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartSelection();
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete notifications"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelSelection();
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {selectionMode && notifications.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <label
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={allReadSelected}
                    onChange={handleSelectAllRead}
                    className="w-4 h-4 rounded border-slate-300 accent-teal-600"
                  />
                  Select all
                </label>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModalOpen(true);
                  }}
                  disabled={selectedIds.length === 0}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    selectedIds.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center text-slate-400 text-sm font-medium">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`px-5 py-4 border-b border-slate-50 transition-all ${
                      !item.is_read ? "bg-teal-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {selectionMode && (
                        <div
                          className="pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.is_read ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelectNotification(item.id)}
                              className="w-4 h-4 rounded border-slate-300 accent-teal-600 cursor-pointer"
                            />
                          ) : (
                            <div
                              className="w-4 h-4 rounded border border-slate-200 bg-slate-100 cursor-not-allowed"
                              title="Unread notifications cannot be deleted"
                            />
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNotification(item);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {item.message}
                            </p>
                          </div>

                          {!item.is_read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Delete Notifications
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModalOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-900">
                  {selectedIds.length}
                </span>{" "}
                selected notification{selectedIds.length === 1 ? "" : "s"}?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSelected();
                }}
                disabled={selectedIds.length === 0 || isDeleting}
                className={`px-4 py-2 rounded-xl font-semibold text-white ${
                  selectedIds.length === 0 || isDeleting
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
