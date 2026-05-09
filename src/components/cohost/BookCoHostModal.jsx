import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineBolt,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import Button from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { bookCoHost, fetchBookedSlots } from '../../services/cohostApi';

// Generate 30-min time slots from 09:00 to 22:00
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 9; h <= 21; h++) {
    slots.push({ h, m: 0 });
    slots.push({ h, m: 30 });
  }
  return slots;
})();

const pad = (n) => String(n).padStart(2, '0');
const fmtSlot = (h, m) => `${pad(h)}:${pad(m)}`;
const fmtSlot12 = (h, m) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${period}`;
};

// Returns next 14 days
const next14Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const toDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export default function BookCoHostModal({ open, onClose, coHost, onBooked }) {
  const days = useMemo(() => next14Days(), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null); // {h, m}
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]); // [{start: Date, end: Date}]
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open / cohost change
  useEffect(() => {
    if (open) {
      setSelectedDate(days[0]);
      setSelectedSlot(null);
      setDuration(60);
      setNotes('');
    }
  }, [open, coHost?._id, days]);

  // Fetch booked slots whenever date/cohost changes
  useEffect(() => {
    if (!open || !coHost?._id) return;
    const dateKey = toDateKey(selectedDate);
    setLoadingSlots(true);
    fetchBookedSlots(coHost._id, dateKey)
      .then((ranges) =>
        setBookedRanges(
          ranges.map((r) => ({ start: new Date(r.start), end: new Date(r.end) }))
        )
      )
      .catch(() => setBookedRanges([]))
      .finally(() => setLoadingSlots(false));
    setSelectedSlot(null); // clear slot selection on date change
  }, [open, coHost?._id, selectedDate]);

  // Build slot status: 'free' | 'booked' | 'past' | 'overflow'
  const slotStatus = useMemo(() => {
    const map = {};
    const now = new Date();
    TIME_SLOTS.forEach(({ h, m }) => {
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);

      // Past?
      if (start <= now) {
        map[fmtSlot(h, m)] = 'past';
        return;
      }

      // Overlaps with any booked range?
      const clash = bookedRanges.some(
        (r) => start < r.end && end > r.start
      );
      if (clash) {
        map[fmtSlot(h, m)] = 'booked';
        return;
      }

      // Slot's end exceeds working hours (22:00)?
      const endHour = end.getHours() + end.getMinutes() / 60;
      const sameDay = end.toDateString() === start.toDateString();
      if (!sameDay || endHour > 22) {
        map[fmtSlot(h, m)] = 'overflow';
        return;
      }

      map[fmtSlot(h, m)] = 'free';
    });
    return map;
  }, [selectedDate, duration, bookedRanges]);

  const totalAmount = useMemo(
    () => Math.round((coHost?.perStreamRate || 0) * (duration / 60)),
    [coHost?.perStreamRate, duration]
  );

  const handleConfirm = async () => {
    if (!selectedSlot) {
      toast.error('Pick a time slot first');
      return;
    }
    const start = new Date(selectedDate);
    start.setHours(selectedSlot.h, selectedSlot.m, 0, 0);

    setSubmitting(true);
    try {
      const booking = await bookCoHost(coHost._id, {
        scheduledAt: start.toISOString(),
        duration,
        notes: notes.trim(),
      });
      toast.success('Co-host booked! Check My Bookings.');
      onBooked?.(booking);
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Booking failed, try again';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!coHost) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-cream rounded-3xl border border-ink/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-ink/10 grid place-items-center transition"
              aria-label="Close"
            >
              <HiOutlineXMark className="text-ink" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-ink/5">
              <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
                Book a co-host
              </div>
              <div className="flex items-start gap-4">
                <Avatar
                  src={coHost.profileImage}
                  name={coHost.name}
                  size="lg"
                  aura={Math.round((coHost.rating || 4) * 18)}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-fraunces text-xl text-ink tracking-tight truncate">
                    {coHost.name}
                  </h2>
                  <div className="text-xs text-ink/55 font-jakarta flex items-center gap-1 mt-1">
                    <HiOutlineMapPin className="text-xs" />
                    <span>{coHost?.location?.city}</span>
                    <span className="mx-2 text-ink/20">•</span>
                    <span className="font-semibold text-ink/70">
                      {coHost.specialty}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-ink/50 font-jakarta">
                    Base rate ·{' '}
                    <span className="font-semibold text-ink tabular-nums">
                      ₹{coHost.perStreamRate?.toLocaleString('en-IN')}
                    </span>{' '}
                    / hour
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Date strip */}
              <section>
                <Label icon={<HiOutlineCalendarDays />}>Pick a date</Label>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {days.map((d) => {
                    const key = toDateKey(d);
                    const active = toDateKey(selectedDate) === key;
                    const dayName = d.toLocaleDateString('en-US', {
                      weekday: 'short',
                    });
                    const dayNum = d.getDate();
                    const monthShort = d.toLocaleDateString('en-US', {
                      month: 'short',
                    });
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(d)}
                        className={`shrink-0 w-16 py-3 rounded-2xl border transition text-center ${
                          active
                            ? 'bg-ink text-cream border-ink shadow-md'
                            : 'bg-white/70 border-ink/10 text-ink hover:border-ink/30'
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider font-jakarta font-semibold opacity-70">
                          {dayName}
                        </div>
                        <div className="font-fraunces text-xl tabular-nums leading-none mt-0.5">
                          {dayNum}
                        </div>
                        <div className="text-[9px] font-jakarta opacity-70 mt-0.5">
                          {monthShort}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Duration */}
              <section>
                <Label icon={<HiOutlineBolt />}>Stream length</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURATIONS.map((d) => {
                    const active = duration === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => {
                          setDuration(d.value);
                          setSelectedSlot(null);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-jakarta font-semibold transition border ${
                          active
                            ? 'bg-mauve text-cream border-mauve'
                            : 'bg-white/70 border-ink/10 text-ink/70 hover:border-ink/30'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Time slots */}
              <section>
                <Label icon={<HiOutlineClock />}>
                  Available slots
                  {loadingSlots && (
                    <span className="ml-2 text-ink/40 text-[10px]">
                      checking…
                    </span>
                  )}
                </Label>

                {loadingSlots ? (
                  <div className="mt-3 py-8 grid place-items-center">
                    <Spinner size={28} />
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(({ h, m }) => {
                      const key = fmtSlot(h, m);
                      const status = slotStatus[key];
                      const active =
                        selectedSlot?.h === h && selectedSlot?.m === m;
                      const disabled = status !== 'free';

                      return (
                        <button
                          key={key}
                          disabled={disabled}
                          onClick={() => setSelectedSlot({ h, m })}
                          className={`relative py-2 rounded-xl text-xs font-jakarta font-semibold transition border tabular-nums ${
                            active
                              ? 'bg-ink text-cream border-ink shadow-md'
                              : status === 'free'
                              ? 'bg-white/70 border-ink/10 text-ink hover:border-ink/30 hover:bg-white'
                              : status === 'booked'
                              ? 'bg-coral/10 border-coral/20 text-coral/60 line-through cursor-not-allowed'
                              : 'bg-ink/5 border-transparent text-ink/30 cursor-not-allowed'
                          }`}
                          title={
                            status === 'booked'
                              ? 'Already booked'
                              : status === 'past'
                              ? 'Past time'
                              : status === 'overflow'
                              ? 'Exceeds working hours (22:00)'
                              : ''
                          }
                        >
                          {fmtSlot12(h, m)}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-[10px] text-ink/45 font-jakarta">
                  <Legend dot="bg-white border border-ink/15" label="Free" />
                  <Legend dot="bg-ink" label="Selected" />
                  <Legend dot="bg-coral/30 border border-coral/40" label="Booked" />
                </div>
              </section>

              {/* Notes */}
              <section>
                <Label>Notes for the co-host (optional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Tell them about the products, audience, vibe…"
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm font-jakarta text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 resize-none"
                />
                <div className="text-[10px] text-ink/40 font-jakarta text-right mt-1">
                  {notes.length}/500
                </div>
              </section>
            </div>

            {/* Footer / Summary */}
            <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-ink/5 p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                  Total
                </div>
                <div className="font-fraunces text-2xl text-ink tracking-tight tabular-nums">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
                {selectedSlot && (
                  <div className="text-[11px] text-ink/55 font-jakarta mt-0.5">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {fmtSlot12(selectedSlot.h, selectedSlot.m)} · {duration}m
                  </div>
                )}
              </div>
              <Button
                onClick={handleConfirm}
                disabled={!selectedSlot || submitting}
                leftIcon={<HiOutlineVideoCamera />}
              >
                {submitting ? 'Booking…' : 'Confirm booking'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Label({ children, icon }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/55 flex items-center gap-1.5">
      {icon}
      {children}
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-sm ${dot}`} />
      <span>{label}</span>
    </span>
  );
}