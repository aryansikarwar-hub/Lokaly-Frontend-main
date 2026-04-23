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
        <Badge tone="mint">{LABELS[order.status] || order.status}</Badge>
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
