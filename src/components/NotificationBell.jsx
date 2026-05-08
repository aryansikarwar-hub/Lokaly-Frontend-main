import { AnimatePresence, motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { NotificationContext } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { getNotificationRoute } from "../utils/notificationRoutes";
import { HiOutlineBell } from "react-icons/hi2";

dayjs.extend(relativeTime);

const NotificationBell = () => {
  const { unreadCount, notifications, markOneAsRead, markAllAsRead } =
    useContext(NotificationContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const recent = useMemo(() => notifications.slice(0, 6), [notifications]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-peach/60 text-ink shrink-0 touch-manipulation"
        aria-label="Open notifications"
      >
        <HiOutlineBell className="text-base" />
      </button>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-coral text-white text-[10px] px-1 rounded-full grid place-items-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[92vw] max-w-sm rounded-2xl border border-ink/10 bg-cream dark:bg-ink shadow-xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-ink/10 flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-ink/60 hover:text-ink"
              >
                Mark all
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {recent.length === 0 ? (
                <div className="p-4 text-sm text-ink/60">No notifications yet</div>
              ) : (
                recent.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      if (!item.isRead) markOneAsRead(item._id);
                      setOpen(false);
                      navigate(getNotificationRoute(item));
                    }}
                    className={`w-full text-left px-3 py-2 border-b border-ink/5 hover:bg-peach/40 ${
                      item.isRead ? "opacity-80" : "bg-blue-50/60"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{item.message}</p>
                    <p className="text-xs text-ink/60 mt-1">
                      {dayjs(item.createdAt).fromNow()}
                    </p>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="w-full px-3 py-2 text-sm font-semibold hover:bg-peach/40"
            >
              View all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;