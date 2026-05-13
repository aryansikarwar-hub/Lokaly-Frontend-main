import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  HiOutlineXMark,
  HiOutlineVideoCamera,
  HiOutlineCalendarDays,
  HiOutlineNoSymbol,
  HiOutlineArrowDownTray,
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

// ── Professional PDF Bill Generator ─────────────────────────────────────────
async function downloadBookingBill(b) {
  // Dynamically load jsPDF from CDN
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;

  // ── Colors ────────────────────────────────────────────────────────────────
  const coral   = [255, 107, 74];
  const ink     = [43,  36,  56];
  const light   = [255, 248, 240];
  const muted   = [120, 110, 135];
  const white   = [255, 255, 255];
  const success = [81,  207, 102];

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...coral);
  doc.rect(0, 0, W, 42, 'F');

  // Logo circle
  doc.setFillColor(...white);
  doc.circle(margin + 7, 16, 7, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...coral);
  doc.setFont('helvetica', 'bold');
  doc.text('L', margin + 4.5, 19.5);

  // Brand name
  doc.setFontSize(18);
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.text('Lokaly', margin + 18, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 220, 200);
  doc.text('LOCAL LOVE, LIVE', margin + 18, 23.5);

  // INVOICE label — right side
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('INVOICE', W - margin, 20, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 220, 200);
  const billNo = `LKL-${String(b._id || '').slice(-8).toUpperCase()}`;
  doc.text(`Bill No: ${billNo}`, W - margin, 27, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - margin, 33, { align: 'right' });

  // ── Booking Summary box ──────────────────────────────────────────────────
  let y = 55;
  doc.setFillColor(...light);
  doc.roundedRect(margin, y, contentW, 38, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('BOOKING DETAILS', margin + 5, y + 8);

  // Co-host name
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ink);
  doc.text(b.coHost?.name || 'Co-host', margin + 5, y + 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(b.coHost?.specialty || '', margin + 5, y + 24);

  // Status badge
  const statusColor = b.status === 'completed' ? success : b.status === 'cancelled' ? [180, 80, 60] : coral;
  doc.setFillColor(...statusColor);
  doc.roundedRect(W - margin - 30, y + 10, 30, 9, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text(String(b.status || '').toUpperCase(), W - margin - 15, y + 16.5, { align: 'center' });

  y += 48;

  // ── Date / Time / Duration row ──────────────────────────────────────────
  const start = new Date(b.scheduledAt);
  const dateStr = start.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const durationHr = b.duration ? `${Math.round(b.duration / 60)} hr${b.duration >= 120 ? 's' : ''}` : '—';

  const colW = contentW / 3;
  const infoBoxes = [
    { label: 'DATE', value: dateStr },
    { label: 'TIME', value: timeStr },
    { label: 'DURATION', value: durationHr },
  ];

  infoBoxes.forEach((box, idx) => {
    const x = margin + idx * colW;
    doc.setFillColor(245, 240, 250);
    doc.roundedRect(x, y, colW - 2, 22, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...muted);
    doc.text(box.label, x + 4, y + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ink);
    doc.text(box.value, x + 4, y + 15, { maxWidth: colW - 8 });
  });

  y += 32;

  // ── Line items table ─────────────────────────────────────────────────────
  doc.setFillColor(...ink);
  doc.rect(margin, y, contentW, 9, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('DESCRIPTION', margin + 4, y + 6);
  doc.text('RATE/HR', margin + contentW * 0.55, y + 6);
  doc.text('HOURS', margin + contentW * 0.72, y + 6);
  doc.text('AMOUNT', margin + contentW - 4, y + 6, { align: 'right' });

  y += 9;

  const rate = b.coHost?.perStreamRate || 0;
  const hours = b.duration ? b.duration / 60 : 1;
  const subtotal = b.amount || rate * hours;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  // Row 1 — Co-host service
  doc.setFillColor(252, 250, 255);
  doc.rect(margin, y, contentW, 10, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ink);
  doc.text(`Co-host Service — ${b.coHost?.specialty || 'Live Stream'}`, margin + 4, y + 6.5);
  doc.text(`Rs.${rate.toLocaleString('en-IN')}`, margin + contentW * 0.55, y + 6.5);
  doc.text(`${hours.toFixed(1)}`, margin + contentW * 0.72, y + 6.5);
  doc.text(`Rs.${subtotal.toLocaleString('en-IN')}`, margin + contentW - 4, y + 6.5, { align: 'right' });

  y += 10;

  // Row 2 — Platform fee (if any)
  doc.setFillColor(...white);
  doc.rect(margin, y, contentW, 10, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ink);
  doc.text('Platform Fee', margin + 4, y + 6.5);
  doc.text('—', margin + contentW * 0.55, y + 6.5);
  doc.text('—', margin + contentW * 0.72, y + 6.5);
  doc.text('Rs.0', margin + contentW - 4, y + 6.5, { align: 'right' });

  y += 10;

  // Bottom divider
  doc.setDrawColor(...muted);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // Subtotal / GST / Total
  const summaryRows = [
    { label: 'Subtotal', value: `Rs.${subtotal.toLocaleString('en-IN')}` },
    { label: 'GST (18%)', value: `Rs.${gst.toLocaleString('en-IN')}` },
  ];

  summaryRows.forEach((row) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text(row.label, W - margin - 50, y + 5);
    doc.setTextColor(...ink);
    doc.text(row.value, W - margin, y + 5, { align: 'right' });
    y += 8;
  });

  // Total band
  doc.setFillColor(...coral);
  doc.roundedRect(W - margin - 60, y, 60, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('TOTAL', W - margin - 45, y + 8);
  doc.text(`Rs.${total.toLocaleString('en-IN')}`, W - margin - 3, y + 8, { align: 'right' });

  y += 22;

  // ── Payment status strip ─────────────────────────────────────────────────
  const paid = ['confirmed', 'completed', 'in-progress'].includes(b.status);
  doc.setFillColor(...(paid ? success : [255, 200, 100]));
  doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text(paid ? '✓  PAYMENT CONFIRMED' : '⏳  PAYMENT PENDING', W / 2, y + 6.5, { align: 'center' });

  y += 18;

  // ── Notes ────────────────────────────────────────────────────────────────
  if (b.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...muted);
    doc.text('NOTES', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ink);
    const lines = doc.splitTextToSize(b.notes, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = 278;
  doc.setDrawColor(...coral);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, W - margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text('Lokaly — Social commerce platform for India\'s artisans & local sellers', W / 2, footerY + 5, { align: 'center' });
  doc.text('support@lokaly.in  |  lokaly.app', W / 2, footerY + 10, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W / 2, footerY + 15, { align: 'center' });

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(`Lokaly_Bill_${billNo}.pdf`);
}

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
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {/* Download Bill button — har booking pe dikhega */}
                        <button
                          onClick={() => {
                            toast.promise(
                              downloadBookingBill(b),
                              {
                                loading: 'Generating bill...',
                                success: 'Bill downloaded!',
                                error: 'Could not generate bill',
                              }
                            );
                          }}
                          className="text-[11px] font-jakarta font-semibold text-ink/60 hover:text-coral border border-ink/10 hover:border-coral/30 rounded-full px-3 py-1.5 flex items-center gap-1 transition"
                        >
                          <HiOutlineArrowDownTray className="text-xs" />
                          Download Bill
                        </button>

                        <div className="flex items-center gap-2">
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