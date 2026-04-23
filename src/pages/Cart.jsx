import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineTrash,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineBolt,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { TbCoins } from "react-icons/tb";
import toast from "react-hot-toast";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import { Reveal } from "../components/animations/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";

export default function Cart() {
  const { cart, subtotal, fetch, update, remove, loading } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const items = cart?.items || [];
  const maxCoins = Math.min(user?.coins || 0, Math.floor(subtotal * 0.2));
  const shipping = subtotal > 999 ? 0 : 49;
  const total = Math.max(0, subtotal + shipping - coinsToRedeem);

  if (loading && !cart)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Your basket
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
            Cart <span className="text-ink/40">({items.length})</span>
          </h1>
          {items.length > 0 && (
            <Link
              to="/products"
              className="text-xs font-jakarta font-semibold text-ink/60 hover:text-coral transition"
            >
              Continue shopping →
            </Link>
          )}
        </div>
      </Reveal>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            hint={
              <span>
                Start browsing{" "}
                <Link to="/products" className="text-coral underline">
                  the bazaar
                </Link>
              </span>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid md:grid-cols-3 gap-5">
          {/* Items */}
          <div className="md:col-span-2 space-y-2.5">
            <AnimatePresence>
              {items.map((it) => (
                <motion.div
                  key={it.product._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl bg-white/80 border border-ink/5 p-3 flex gap-3 hover:border-ink/15 transition"
                >
                  <Link to={`/product/${it.product._id}`} className="shrink-0">
                    <img
                      src={it.product.images?.[0]?.url}
                      alt={it.product.title}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${it.product._id}`}
                        className="font-jakarta font-semibold text-sm text-ink line-clamp-2 hover:text-coral transition leading-snug"
                      >
                        {it.product.title}
                      </Link>
                      <button
                        onClick={() => remove(it.product._id)}
                        className="w-7 h-7 grid place-items-center rounded-full hover:bg-coral/10 text-ink/40 hover:text-coral transition shrink-0"
                        aria-label="Remove item"
                      >
                        <HiOutlineTrash className="text-sm" />
                      </button>
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink/50 font-jakarta">
                      ₹{it.priceAtAdd.toLocaleString("en-IN")} each
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 bg-cream rounded-full p-0.5 border border-ink/5">
                        <button
                          onClick={() =>
                            update(it.product._id, it.quantity - 1)
                          }
                          className="w-6 h-6 grid place-items-center rounded-full hover:bg-peach/60 text-ink disabled:opacity-40 disabled:hover:bg-transparent transition"
                          disabled={it.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <HiOutlineMinus className="text-xs" />
                        </button>
                        <span className="font-jakarta font-semibold text-xs w-5 text-center tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() =>
                            update(it.product._id, it.quantity + 1)
                          }
                          className="w-6 h-6 grid place-items-center rounded-full hover:bg-peach/60 text-ink transition"
                          aria-label="Increase quantity"
                        >
                          <HiOutlinePlus className="text-xs" />
                        </button>
                      </div>
                      <div className="font-fraunces text-base text-ink tracking-tight tabular-nums">
                        ₹{(it.priceAtAdd * it.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Trust strip */}
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink/50 font-jakarta px-2">
              <div className="flex items-center gap-1.5">
                <HiOutlineTruck className="text-sm" /> Free shipping over ₹999
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineShieldCheck className="text-sm" /> 7-day returns
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineLockClosed className="text-sm" /> Secure checkout
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <aside className="rounded-2xl bg-gradient-to-br from-lavender to-peach p-5 h-max md:sticky md:top-20 border border-ink/5">
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/60 mb-2">
              Summary
            </div>
            <h3 className="font-fraunces text-lg text-ink tracking-tight">
              Order total
            </h3>

            <div className="mt-4 space-y-2 font-jakarta text-xs text-ink/70">
              <Row
                label="Subtotal"
                value={`₹${subtotal.toLocaleString("en-IN")}`}
              />
              <Row
                label="Shipping"
                value={shipping === 0 ? "Free" : `₹${shipping}`}
                highlight={shipping === 0}
              />
              {coinsToRedeem > 0 && (
                <Row
                  label="Coins applied"
                  value={`−₹${coinsToRedeem}`}
                  highlight
                />
              )}
              <div className="border-t border-ink/10 pt-2.5 mt-2.5 flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold">
                  Total
                </span>
                <span className="font-fraunces text-xl text-ink tracking-tight tabular-nums">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Coin redemption */}
            {maxCoins > 0 && (
              <div className="mt-4 rounded-xl bg-white/70 p-3 border border-white">
                <div className="flex items-center gap-1.5">
                  <TbCoins className="text-tangerine text-base" />
                  <span className="font-jakarta font-semibold text-xs text-ink">
                    Use coins
                  </span>
                  <span className="text-[10px] text-ink/50 ml-auto font-jakarta">
                    Max ₹{maxCoins}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxCoins}
                  value={coinsToRedeem}
                  onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
                  className="w-full accent-coral mt-2.5"
                />
                <div className="text-[10px] text-ink/60 mt-1 text-center font-jakarta tabular-nums">
                  {coinsToRedeem} / {user?.coins || 0} available
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              size="md"
              leftIcon={<HiOutlineBolt />}
              onClick={() => {
                sessionStorage.setItem("lokaly-coins", String(coinsToRedeem));
                if (!user) {
                  toast("Please log in");
                  nav("/login");
                  return;
                }
                nav("/checkout");
              }}
            >
              Proceed to checkout
            </Button>

            <div className="mt-3 text-[10px] text-ink/50 font-jakarta text-center">
              Secure checkout · Razorpay
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={highlight ? "text-leaf font-semibold" : ""}>
        {value}
      </span>
    </div>
  );
}
