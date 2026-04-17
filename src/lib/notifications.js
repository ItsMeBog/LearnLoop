import { supabase } from "./supabase";

export const ensureNotificationSettings = async (userId) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: inserted, error: insertError } = await supabase
    .from("notification_settings")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return inserted;
};

export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  relatedType = null,
  relatedId = null,
}) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      related_type: relatedType,
      related_id: relatedId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchNotifications = async (userId) => {
  return await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
};

export const markNotificationAsRead = async (id, userId) => {
  return await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);
};

export const markAllNotificationsAsRead = async (userId) => {
  return await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
};

export const deleteNotification = async (id, userId) => {
  return await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_read", true);
};

export const deleteSelectedNotifications = async (ids, userId) => {
  if (!ids || ids.length === 0) {
    return { data: [], error: null };
  }

  return await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("is_read", true)
    .in("id", ids);
};

export const requestBrowserNotificationPermission = async () => {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendBrowserNotification = ({ title, body }) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/icons/icon-192.png",
  });
};