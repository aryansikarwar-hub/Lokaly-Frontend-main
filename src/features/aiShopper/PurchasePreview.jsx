/**
 * PurchasePreview — last-mile confirmation card shown after a voice "buy now"
 * (or tap on Buy now). Surfaces exactly what we're about to add + checkout
 * with so the user can confirm before being redirected to /checkout.
 *
 * Behaviour:
 *   - Animated countdown ring (default 4s) → auto-confirms when it elapses.
 *   - Confirm button → adds to cart + navigates to /checkout immediately.
 *   - Cancel button → just closes the preview, leaves cart untouched.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbBolt, TbX } from "react-icons/tb";

const COUNTDOWN_MS = 4000;

export default function PurchasePreview({ product, onConfirm, onCancel, autoMs = COUNTDOWN_MS }) {
  const [remaining, setRemaining] = useState(autoMs);
  const tickRef = useRef(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!product) return;
    startRef.current = Date.now();
    setRemaining(autoMs);
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, autoMs - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(tickRef.current);
        onConfirm?.();
      }
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [product, autoMs, onConfirm]);

  if (!product) return null;

  const pct = Math.max(0, Math.min(100, (remaining / autoMs) * 100));
  const seconds = Math.ceil(remaining / 1000);
  const img = product.images?.[0]?.url || product.image;

  return (
    <AnimatePresence>
      <motion.div
        key="purchase-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-md grid place-items-center p-4"
        onClick={onCancel}
      >
        <motion.div
          key="purchase-card"
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl bg-cream dark:bg-[#2A2438] shadow-2xl overflow-hidden"
        >
          {/* Top: product image */}
          <div className="relative w-full aspect-square bg-ink">
            {img ? (
              <img
                src={img}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-cream/60 font-fraunces text-lg">
                {product.title}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-coral text-white text-[10px] font-jakarta font-bold uppercase tracking-wider flex items-center gap-1">
              <TbBolt className="text-xs" /> Confirm purchase
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 grid place-items-center text-ink hover:bg-white"
            >
              <TbX />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="font-jakarta text-sm line-clamp-2">{product.title}</div>
              <div className="font-fraunces text-3xl mt-0.5">
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </div>
              {product.shop_name || product.seller?.shopName ? (
                <div className="text-[11px] opacity-80 mt-0.5">
                  from {product.shop_name || product.seller?.shopName}
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom: countdown + actions */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[11px] uppercase tracking-wider font-jakarta text-ink/60 dark:text-cream/60 flex-1">
                Auto-checkout in {seconds}s
              </div>
              <span className="text-[11px] font-jakarta text-ink/40 dark:text-cream/40">
                Tap cancel to abort
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-coral"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-11 rounded-full border border-ink/15 dark:border-white/15 text-sm font-jakarta font-bold text-ink dark:text-cream hover:bg-ink/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-[1.4] h-11 rounded-full bg-coral text-white text-sm font-jakarta font-bold flex items-center justify-center gap-1.5 hover:bg-coral/90 shadow-pop"
              >
                <TbBolt /> Confirm & checkout
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
