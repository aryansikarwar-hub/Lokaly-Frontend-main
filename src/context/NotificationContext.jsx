import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { bindSocketEvent, getSocket } from "../services/socket";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotifications,
} from "../services/notificationService";
import { useAuthStore } from "../store/authStore";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState("");
  const pageRef = useRef(1);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const mergeUniqueNotifications = useCallback((incoming, replace = false) => {
    setNotifications((prev) => {
      const source = replace ? [] : prev;
      const map = new Map(source.map((item) => [item._id, item]));
      for (const item of incoming || []) {
        if (!item?._id) continue;
        map.set(item._id, { ...map.get(item._id), ...item });
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    });
  }, []);

  const fetchPage = useCallback(
    async ({ page = 1, append = false, type = activeTypeFilter } = {}) => {
      const payload = await getNotifications({ page, limit: 20, type: type || undefined });
      const items = payload?.data || [];
      mergeUniqueNotifications(items, !append);
      setHasNextPage(Boolean(payload?.pagination?.hasNextPage));
      pageRef.current = page;
      return items;
    },
    [activeTypeFilter, mergeUniqueNotifications]
  );

  useEffect(() => {
    if (!token || !user?._id) {
      setNotifications([]);
      setHasNextPage(false);
      pageRef.current = 1;
      return undefined;
    }

    let mounted = true;
    setLoading(true);
    console.log("[NotificationContext] Fetching notifications...");
    getNotifications({
      page: 1,
      limit: 20,
      type: activeTypeFilter || undefined,
    })
      .then((payload) => {
        console.log("[NotificationContext] ✅ Notifications fetched:", payload?.data?.length, "items");
        if (!mounted) return;
        mergeUniqueNotifications(payload?.data || [], true);
        setHasNextPage(Boolean(payload?.pagination?.hasNextPage));
        pageRef.current = 1;
      })
      .catch((err) => {
        console.error("[NotificationContext] ❌ Failed to fetch notifications:", err);
        if (mounted) setNotifications([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const socket = getSocket();
    console.log("[NotificationContext] Socket connected:", socket.connected, "ID:", socket.id);
    socket.emit("register", user._id);
    console.log("[NotificationContext] Registered user:", user._id);

    const unbind = bindSocketEvent("new_notification", (data) => {
      console.log("[NotificationContext] 🔔 New notification received:", data);
      if (!data?._id) {
        console.warn("[NotificationContext] Notification missing _id, skipping");
        return;
      }
      mergeUniqueNotifications([data], false);
      if (!data?.isRead) {
        console.log("[NotificationContext] Showing toast:", data.message);
        toast(data.message || "New notification");
      }
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(15);
      }
    });

    return () => {
      mounted = false;
      unbind();
    };
  }, [activeTypeFilter, mergeUniqueNotifications, token, user?._id]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const markOneAsRead = async (id) => {
    if (!id) return;
    console.log("[NotificationContext] Marking notification as read:", id);
    setNotifications((prev) =>
      prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
    );
    try {
      await markNotificationRead(id);
      console.log("[NotificationContext] ✅ Successfully marked as read:", id);
    } catch (err) {
      console.error("[NotificationContext] ❌ Failed to mark as read:", err);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: false } : item))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item._id);
    console.log("[NotificationContext] Marking all as read. Count:", unreadIds.length);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsRead();
      console.log("[NotificationContext] ✅ All marked as read");
    } catch (err) {
      console.error("[NotificationContext] ❌ Failed to mark all as read:", err);
      setNotifications((prev) =>
        prev.map((item) =>
          unreadIds.includes(item._id) ? { ...item, isRead: false } : item
        )
      );
    }
  };

  const clearAllNotifications = async () => {
    console.log("[NotificationContext] Clearing all notifications");
    try {
      await clearNotifications();
      setNotifications([]);
      setHasNextPage(false);
      pageRef.current = 1;
    } catch (err) {
      console.error("[NotificationContext] ❌ Failed to clear all notifications:", err);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    try {
      await fetchPage({ page: pageRef.current + 1, append: true });
    } finally {
      setLoadingMore(false);
    }
  };

  const setTypeFilter = (type) => {
    setActiveTypeFilter(type || "");
    pageRef.current = 1;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasNextPage,
        activeTypeFilter,
        markOneAsRead,
        markAllAsRead,
        clearAllNotifications,
        loadMore,
        setTypeFilter,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};