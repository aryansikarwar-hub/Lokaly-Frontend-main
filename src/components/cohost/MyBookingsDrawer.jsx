import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  HiOutlineXMark,
  HiOutlineVideoCamera,
  HiOutlineCalendarDays,
  HiOutlineNoSymbol,
} from 'react-icons/hi2';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { fetchMyBookings, cancelBooking } from '../../services/cohostApi';

const STATUS_STYLES = {
  pending: 'bg-butter/30 text-ink',
  confirmed: 'bg-leaf/20 text-leaf',
  'in-progress': 'bg-coral/20 text-coral animate-pulse',
  completed: 'bg-ink/10 text-ink/70',
  cancelled: 'bg-ink/5 text-ink/40 line-through',
  'no-show': 'bg-ink/5 text-ink/40',
};

export default function MyBookingsDrawer({ open, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancel failed');
    }
  };

  const isJoinable = (b) => {
    if (!['pending', 'confirmed', 'in-progress'].includes(b.status)) return false;
    const start = new Date(b.scheduledAt);
    const end = new Date(start.getTime() + b.duration * 60_000);
    const now = new Date();
    // Joinable from 10 min before start to end
    return now >= new Date(start.getTime() - 10 * 60_000) && now <= end;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-md bg-cream border-l border-ink/10 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-ink/5 p-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral">
                  Your bookings
                </div>
                <h3 className="font-fraunces text-xl text-ink mt-1">
                  My co-host bookings
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-ink/10 grid place-items-center"
              >
                <HiOutlineXMark className="text-ink" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              {loading && (
                <div className="py-12 grid place-items-center">
                  <Spinner size={32} />
                </div>
              )}

              {!loading && bookings.length === 0 && (
                <div className="py-12 text-center">
                  <HiOutlineCalendarDays className="text-4xl text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/55 font-jakarta">
                    No bookings yet.
                  </p>
                  <p className="text-xs text-ink/40 font-jakarta mt-1">
                    Browse the marketplace to book your first co-host.
                  </p>
                </div>
              )}

              {!loading &&
                bookings.map((b) => {
                  const start = new Date(b.scheduledAt);
                  const dateStr = start.toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  const timeStr = start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  const canCancel = ['pending', 'confirmed'].includes(b.status);

                  return (
                    <div
                      key={b._id}
                      className="rounded-2xl bg-white/70 border border-ink/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={b.coHost?.profileImage}
                          name={b.coHost?.name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-fraunces text-base text-ink truncate">
                            {b.coHost?.name || 'Co-host'}
                          </div>
                          <div className="text-[11px] text-ink/55 font-jakarta">
                            {b.coHost?.specialty}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-jakarta font-bold px-2 py-1 rounded-full ${
                            STATUS_STYLES[b.status] || 'bg-ink/10'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-ink/5 grid grid-cols-3 gap-2 text-[11px] font-jakarta">
                        <Stat label="Date" value={dateStr} />
                        <Stat label="Time" value={timeStr} />
                        <Stat
                          label="Total"
                          value={`₹${b.amount?.toLocaleString('en-IN')}`}
                        />
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {isJoinable(b) && (
                          <Link
                            to={`/live/${b.streamRoomId || b._id}`}
                            className="text-[11px] font-jakarta font-bold text-cream bg-leaf hover:bg-leaf/90 rounded-full px-3 py-1.5 flex items-center gap-1"
                          >
                            <HiOutlineVideoCamera />
                            Join stream
                          </Link>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b._id)}
                            className="text-[11px] font-jakarta font-semibold text-coral/80 hover:text-coral flex items-center gap-1"
                          >
                            <HiOutlineNoSymbol />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-ink/40 font-semibold">
        {label}
      </div>
      <div className="text-ink/80 font-semibold tabular-nums truncate">
        {value}
      </div>
    </div>
  );
}