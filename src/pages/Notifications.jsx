import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useContext, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationContext } from "../context/NotificationContext";
import { motion } from "framer-motion";
import { getNotificationRoute } from "../utils/notificationRoutes";

dayjs.extend(relativeTime);

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "chat_message", label: "Chat" },
  { value: "order", label: "Payment" },
  { value: "order_status", label: "Order updates" },
  { value: "live_started", label: "Live" },
  { value: "post_comment", label: "Comments" },
  { value: "comment_reply", label: "Replies" },
];

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markOneAsRead,
    markAllAsRead,
    clearAllNotifications,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
    activeTypeFilter,
    setTypeFilter,
  } = useContext(NotificationContext);
  const navigate = useNavigate();
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasNextPage) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "120px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadMore]);

  const groups = useMemo(() => {
    return notifications.reduce((acc, item) => {
      const date = dayjs(item.createdAt);
      const key = date.isSame(dayjs(), "day")
        ? "Today"
        : date.isSame(dayjs().subtract(1, "day"), "day")
        ? "Yesterday"
        : "Earlier";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [notifications]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-4 md:mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-ink/60">{unreadCount} unread</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
            className="rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
          <button
            type="button"
            disabled={notifications.length === 0}
            onClick={clearAllNotifications}
            className="rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {TYPE_OPTIONS.map((option) => {
          const active = option.value === activeTypeFilter;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => setTypeFilter(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${
                active ? "bg-ink text-cream border-ink" : "bg-white text-ink border-ink/15"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-16 rounded-xl bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-center">
          <p className="text-base font-semibold">All clear</p>
          <p className="text-sm text-ink/60 mt-1">You have no notifications in this filter.</p>
        </div>
      ) : (
        <>
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-5">
              <h2 className="text-xs uppercase tracking-wide text-ink/50 mb-2">{dateLabel}</h2>
              <div className="space-y-2">
                {items.map((n) => (
                  <motion.button
                    key={n._id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (!n.isRead) markOneAsRead(n._id);
                      navigate(getNotificationRoute(n));
                    }}
                    className={`w-full text-left p-3 md:p-4 border rounded-xl bg-white shadow-sm transition-all duration-150 ${
                      n.isRead ? "opacity-85 border-ink/10 hover:border-ink/20" : "border-blue-400 bg-blue-50/40 hover:bg-blue-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">{n.message}</p>
                        <p className="text-xs text-ink/60 mt-1">
                          {dayjs(n.createdAt).fromNow()} • {n.type?.replaceAll("_", " ")}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </div>
                    {!n.isRead && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markOneAsRead(n._id);
                          }}
                          className="rounded-lg border px-2.5 py-1 text-xs hover:bg-ink/5"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && <div className="h-12 rounded-xl bg-ink/5 animate-pulse" />}
        </>
      )}
    </div>
  );
};

export default Notifications;