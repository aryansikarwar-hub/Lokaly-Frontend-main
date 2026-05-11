import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import {
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineArchiveBox,
  HiOutlineTruck,
  HiOutlineCheckBadge,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import api from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";

const ICONS = {
  pending: HiOutlineClock,
  paid: HiOutlineCurrencyRupee,
  packed: HiOutlineArchiveBox,
  shipped: HiOutlineTruck,
  out_for_delivery: HiOutlineTruck,
  delivered: HiOutlineCheckBadge,
  cancelled: HiOutlineXCircle,
  refunded: HiOutlineArrowPath,
};

const LABELS = {
  pending: "Order placed",
  paid: "Payment received",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// ✅ Generate and download invoice PDF using browser's print dialog
function downloadInvoice(order) {
  const orderId = String(order._id).slice(-8).toUpperCase();
  const placedOn = dayjs(order.createdAt).format("D MMM YYYY, h:mm A");

  const itemsHtml = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f0ece6;">${it.title}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0ece6;text-align:center;">${it.quantity}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0ece6;text-align:right;">₹${(it.price).toLocaleString("en-IN")}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0ece6;text-align:right;">₹${(it.price * it.quantity).toLocaleString("en-IN")}</td>
      </tr>
    `
    )
    .join("");

  const { address } = order;
  const addressLines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.phone,
  ]
    .filter(Boolean)
    .join("<br/>");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invoice #${orderId} — Lokaly</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .brand { font-size: 22px; font-weight: 700; color: #FF6B6B; letter-spacing: -0.5px; }
        .brand span { display: block; font-size: 10px; font-weight: 400; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 20px; font-weight: 600; color: #333; }
        .invoice-title p { font-size: 11px; color: #999; margin-top: 3px; }
        .divider { border: none; border-top: 2px solid #f0ece6; margin: 20px 0; }
        .two-col { display: flex; gap: 40px; margin-bottom: 28px; }
        .two-col > div { flex: 1; }
        .section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #aaa; margin-bottom: 6px; }
        .section-value { font-size: 13px; color: #333; line-height: 1.7; }
        .section-value strong { color: #1a1a1a; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead { background: #fff8f5; }
        thead th { padding: 9px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; text-align: left; border-bottom: 2px solid #f0ece6; }
        thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
        thead th:nth-child(2) { text-align: center; }
        .total-row td { padding: 10px 6px; font-weight: 600; font-size: 14px; border-top: 2px solid #f0ece6; }
        .total-row td:last-child { color: #FF6B6B; text-align: right; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #bbb; }
        .status-badge { display: inline-block; background: #e6f9f0; color: #1a7a4a; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; margin-top: 4px; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          Lokaly
          <span>Local Love, Live</span>
        </div>
        <div class="invoice-title">
          <h2>Invoice</h2>
          <p>#${orderId}</p>
          <p style="margin-top:6px;">${placedOn}</p>
          <div class="status-badge">${LABELS[order.status] || order.status}</div>
        </div>
      </div>

      <hr class="divider" />

      <div class="two-col">
        <div>
          <div class="section-label">Bill To</div>
          <div class="section-value">
            <strong>${address.fullName}</strong><br/>
            ${addressLines}
          </div>
        </div>
        <div>
          <div class="section-label">Order Details</div>
          <div class="section-value">
            Order ID: <strong>#${orderId}</strong><br/>
            Date: ${dayjs(order.createdAt).format("D MMM YYYY")}<br/>
            Payment: <strong>Razorpay</strong>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total Paid</td>
            <td>₹${order.total.toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        Thank you for shopping with Lokaly — India's social commerce hub for artisans, home-kitchens &amp; neighbourhood shops.<br/>
        For support, visit lokaly.in/support
      </div>
    </body>
    </html>
  `;

  // Open in new window and trigger print (Save as PDF)
  const win = window.open("", "_blank", "width=800,height=900");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

export default function OrderTrack() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Spinner />
      </div>
    );
  if (!order)
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Error
        </div>
        <h1 className="font-fraunces text-2xl text-ink tracking-tight">
          Order not found
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block text-xs text-coral font-jakarta font-semibold hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );

  const timeline = order.timeline || [];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
            Tracking
          </div>
          <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
            Order{" "}
            <span className="font-mono text-ink/60">
              #{String(order._id).slice(-8).toUpperCase()}
            </span>
          </h1>
          <div className="text-[11px] text-ink/55 mt-1 font-jakarta">
            Placed on {dayjs(order.createdAt).format("D MMM YYYY, h:mm A")}
          </div>
        </div>

        {/* ✅ Right side: Status badge + Download Invoice button */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge tone="mint">{LABELS[order.status] || order.status}</Badge>
          <button
            onClick={() => downloadInvoice(order)}
            className="inline-flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/70 hover:text-coral border border-ink/15 hover:border-coral/40 rounded-lg px-3 py-1.5 transition-all bg-white/60 hover:bg-white"
          >
            <HiOutlineArrowDownTray className="text-base" />
            Download Invoice
          </button>
        </div>
      </div>

      {/* Timeline */}
      <section className="mt-7 rounded-2xl bg-white/80 border border-ink/5 p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
          Progress
        </div>
        <h3 className="font-fraunces text-lg text-ink tracking-tight mb-5">
          Timeline
        </h3>
        <ol className="relative">
          {timeline.map((t, i) => {
            const Icon = ICONS[t.status] || HiOutlineClock;
            const isLast = i === timeline.length - 1;
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative pl-10 ${!isLast ? "pb-5" : ""} ${
                  !isLast ? "border-l-2 border-coral/20" : ""
                } ml-3`}
              >
                <span className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-coral text-white grid place-items-center shadow-sm">
                  <Icon className="text-sm" />
                </span>
                <div className="font-jakarta font-semibold text-xs text-ink">
                  {LABELS[t.status] || t.status}
                </div>
                {t.note && (
                  <div className="text-[11px] text-ink/60 mt-0.5">{t.note}</div>
                )}
                <div className="text-[10px] text-ink/45 mt-1 font-jakarta">
                  {dayjs(t.at).format("D MMM · h:mm A")}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {/* Items + Shipping */}
      <section className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/70 border border-ink/5 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
            What's in this order
          </div>
          <h4 className="font-fraunces text-base text-ink tracking-tight mb-3">
            Items
          </h4>
          <div className="space-y-2.5">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex gap-3">
                <img
                  src={it.image}
                  alt={it.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${it.product}`}
                    className="text-xs font-jakarta font-semibold text-ink line-clamp-1 hover:text-coral transition"
                  >
                    {it.title}
                  </Link>
                  <div className="text-[10px] text-ink/55 mt-0.5 font-jakarta">
                    Qty {it.quantity} · ₹
                    {(it.price * it.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-ink/5 flex justify-between items-baseline">
            <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
              Total paid
            </span>
            <span className="font-fraunces text-xl text-ink tracking-tight">
              ₹{order.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 border border-ink/5 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
            Delivery
          </div>
          <h4 className="font-fraunces text-base text-ink tracking-tight mb-3">
            Shipping to
          </h4>
          <div className="text-xs text-ink/75 font-jakarta leading-relaxed space-y-0.5">
            <div className="font-semibold text-ink text-[13px]">
              {order.address.fullName}
            </div>
            <div>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
            </div>
            <div>
              {order.address.city}, {order.address.state}{" "}
              {order.address.pincode}
            </div>
            <div className="text-ink/55 mt-2">{order.address.phone}</div>
          </div>
        </div>
      </section>
    </div>
  );
}