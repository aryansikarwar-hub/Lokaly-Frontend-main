import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import {
  HiOutlineCheckCircle,
  HiOutlineGift,
  HiOutlineTruck,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import Button from "../components/ui/Button";

export default function OrderSuccess() {
  const { id } = useParams();
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    const t = setTimeout(() => setSize({ width: 0, height: 0 }), 6500);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="min-h-[80vh] relative grid place-items-center overflow-hidden px-4">
      {size.width > 0 && (
        <Confetti
          width={size.width}
          height={size.height}
          numberOfPieces={220}
          colors={[
            "#FF6B6B",
            "#FFA94D",
            "#51CF66",
            "#FFD6BA",
            "#E4D4F4",
            "#FFF3B0",
          ]}
          recycle={false}
        />
      )}

      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-mint/20 via-transparent to-peach/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="relative text-center max-w-sm w-full"
      >
        {/* Eyebrow */}
        <div className="text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-leaf mb-4">
          Order confirmed
        </div>

        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 16,
            delay: 0.15,
          }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-leaf to-mint grid place-items-center text-white shadow-lg"
        >
          <HiOutlineCheckCircle className="text-4xl" />
        </motion.div>

        <h1 className="mt-5 font-fraunces text-3xl md:text-4xl text-ink tracking-tight">
          Order placed
        </h1>
        <p className="mt-2 text-xs text-ink/60 font-jakarta leading-relaxed max-w-xs mx-auto">
          Thank you — we've notified the seller and they're preparing your order
          now.
        </p>

        {/* Order meta strip */}
        {id && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-ink/5 text-[10px] font-jakarta text-ink/60">
            <span className="text-ink/40">Order</span>
            <span className="font-mono font-semibold text-ink">
              #{String(id).slice(-8).toUpperCase()}
            </span>
          </div>
        )}

        {/* Status rows */}
        <div className="mt-6 rounded-2xl bg-white/80 border border-ink/5 p-4 text-left space-y-2.5">
          <Row
            icon={<HiOutlineTruck />}
            tone="text-mauve"
            label="Expected delivery"
            value="3–5 business days"
          />
          <Row
            icon={<HiOutlineGift />}
            tone="text-coral"
            label="Rewards"
            value="Coins earned on this order"
          />
          <Row
            icon={<HiOutlineShieldCheck />}
            tone="text-leaf"
            label="Protected"
            value="7-day easy returns available"
          />
        </div>

        {/* CTAs */}
        <div className="mt-5 flex gap-2 justify-center flex-wrap">
          <Button as={Link} to={`/order/${id}`} size="md">
            Track order
          </Button>
          <Button as={Link} to="/feed" variant="outline" size="md">
            Keep browsing
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon, tone, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`w-7 h-7 rounded-lg bg-cream/80 grid place-items-center ${tone} shrink-0`}
      >
        <span className="text-sm">{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
          {label}
        </div>
        <div className="text-xs font-jakarta text-ink/75 truncate">{value}</div>
      </div>
    </div>
  );
}
