import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineTruck,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { TbShoppingBag, TbX } from "react-icons/tb";
import toast from "react-hot-toast";
import api from "../services/api";
import { loadRazorpay } from "../services/razorpay";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { useCoinsStore } from "../store/coinsStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";

// Resolve relative product image URLs (e.g. /uploads/...) against the API origin.
const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  try { return new URL(raw).origin; } catch { return ""; }
})();
function absolutizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/") && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

export default function Checkout() {
  const user = useAuthStore((s) => s.user);
  const { cart, subtotal, fetch, clear, remove: cartRemove } = useCartStore();
  const [removingId, setRemovingId] = useState(null);

  async function removeItem(productId, title) {
    if (!productId || removingId) return;
    setRemovingId(productId);
    try {
      await cartRemove(String(productId));
      toast.success(`Removed: ${title || "item"}`);
    } catch (e) {
      toast.error(e.response?.data?.error || "Could not remove item");
    } finally {
      setRemovingId(null);
    }
  }
  const [params] = useSearchParams();
  // ?product=<id> tells us which item the user explicitly chose via voice
  // "buy now" — we highlight + scroll-into-view that card.
  const highlightId = params.get("product") || "";
  const highlightRef = useRef(null);

  // ✅ Auto-fill address from user profile (including line1, line2, state)
  const [addr, setAddr] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    line1: user?.address?.line1 || user?.location?.line1 || "",
    line2: user?.address?.line2 || user?.location?.line2 || "",
    city: user?.address?.city || user?.location?.city || "",
    state: user?.address?.state || user?.location?.state || "",
    pincode: user?.address?.pincode || user?.location?.pincode || "",
  });

  const [placing, setPlacing] = useState(false);
  const nav = useNavigate();
  const coinsToRedeem = Number(sessionStorage.getItem("lokaly-coins") || 0);
  console.log(
    "🔥 [Checkout] coinsToRedeem =",
    coinsToRedeem,
    "raw =",
    sessionStorage.getItem("lokaly-coins"),
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  // ✅ Re-sync address if user loads after mount (e.g. slow hydration)
  useEffect(() => {
    if (user) {
      setAddr((prev) => ({
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || "",
        line1: prev.line1 || user?.address?.line1 || user?.location?.line1 || "",
        line2: prev.line2 || user?.address?.line2 || user?.location?.line2 || "",
        city: prev.city || user?.address?.city || user?.location?.city || "",
        state: prev.state || user?.address?.state || user?.location?.state || "",
        pincode: prev.pincode || user?.address?.pincode || user?.location?.pincode || "",
      }));
    }
  }, [user]);

  const items = cart?.items || [];
  const shipping = subtotal > 999 ? 0 : 49;
  const total = Math.max(0, subtotal + shipping - coinsToRedeem);

  // Sort: highlighted product (from voice "buy now") first, then the rest.
  const orderedItems = useMemo(() => {
    if (!highlightId || items.length === 0) return items;
    const idx = items.findIndex(
      (it) => String(it.product?._id || it.product) === String(highlightId),
    );
    if (idx <= 0) return items;
    const copy = [...items];
    const [picked] = copy.splice(idx, 1);
    return [picked, ...copy];
  }, [items, highlightId]);

  // Scroll the highlighted card into view once cart has loaded.
  useEffect(() => {
    if (!highlightId || !highlightRef.current) return;
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(t);
  }, [highlightId, items.length]);

  async function place() {
    if (!addr.fullName || !addr.line1 || !addr.city || !addr.pincode) {
      toast.error("Please fill your shipping address");
      return;
    }
    setPlacing(true);
    try {
      const { data: orderData } = await api.post("/orders", {
        address: addr,
        coinsToRedeem,
      });
      const order = orderData.order;
      const { data: rp } = await api.post(
        `/payments/order/${order._id}/razorpay`,
      );

      if (rp.mock) {
        await api.post("/payments/verify", {
          orderId: order._id,
          razorpay_order_id: rp.razorpayOrderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock",
        });
        await clear();
        await useCoinsStore.getState().fetch();
        sessionStorage.removeItem("lokaly-coins");
        nav(`/order/${order._id}/success`);
        return;
      }

      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: rp.key,
        amount: rp.amount,
        currency: rp.currency,
        name: "Lokaly",
        description: "Local love, live shopping",
        order_id: rp.razorpayOrderId,
        prefill: {
          name: addr.fullName,
          email: user?.email,
          contact: addr.phone,
        },
        theme: { color: "#FF6B6B" },
        handler: async (resp) => {
          await api.post("/payments/verify", { ...resp, orderId: order._id });
          await clear();
          await useCoinsStore.getState().fetch();
          sessionStorage.removeItem("lokaly-coins");
          nav(`/order/${order._id}/success`);
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(e.response?.data?.error || "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  if (!cart)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10 grid md:grid-cols-3 gap-5">
      {/* Address form */}
      <div className="md:col-span-2">
        {/* "You're buying" — product card preview at the top of checkout so
            the user always sees exactly what's being ordered. The
            ?product=<id> query param (set by AI Shopper voice "buy now")
            highlights and scrolls to the chosen item. */}
        {orderedItems.length > 0 && (
          <Reveal>
            <div
              ref={highlightId ? highlightRef : null}
              className="mb-6 rounded-2xl bg-gradient-to-br from-peach/40 to-lavender/40 border border-white p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral flex items-center gap-1.5">
                  <HiOutlineSparkles /> You're buying
                </div>
                <div className="text-[11px] font-jakarta text-ink/60">
                  {orderedItems.length} item{orderedItems.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                {orderedItems.map((it, i) => {
                  const p = it.product || it;
                  const id = String(p?._id || p);
                  const isHighlight = highlightId && id === String(highlightId);
                  const img = absolutizeUrl(p?.images?.[0]?.url || p?.image);
                  const qty = it.quantity || it.qty || 1;
                  const price = (it.priceAtAdd ?? p?.price) || 0;
                  const isRemoving = removingId === id;
                  return (
                    <motion.div
                      key={id || i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: isRemoving ? 0.5 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.04 }}
                      className={`relative shrink-0 w-44 snap-start rounded-xl overflow-hidden bg-white border ${
                        isHighlight
                          ? "border-coral shadow-pop ring-2 ring-coral/30"
                          : "border-white"
                      }`}
                    >
                      {/* Remove (×) button — sits on the corner of every card.
                          Calls cartStore.remove() then refreshes server cart. */}
                      <button
                        type="button"
                        onClick={() => removeItem(id, p?.title)}
                        disabled={isRemoving}
                        title="Remove from cart"
                        aria-label={`Remove ${p?.title || "item"}`}
                        className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-coral hover:text-white text-ink shadow-pop grid place-items-center transition disabled:opacity-50"
                      >
                        <TbX className="text-sm" />
                      </button>
                      <div className="aspect-square bg-cream relative">
                        {img ? (
                          <img
                            src={img}
                            alt={p?.title || ""}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-ink/30">
                            <TbShoppingBag className="text-3xl" />
                          </div>
                        )}
                        {isHighlight && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-coral text-white text-[9px] font-jakarta font-bold uppercase tracking-wider">
                            Picked
                          </div>
                        )}
                        {qty > 1 && (
                          <div className="absolute bottom-2 right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-ink text-white text-[10px] font-jakarta font-bold grid place-items-center">
                            ×{qty}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-jakarta font-semibold text-ink line-clamp-2 leading-snug min-h-[2.4em]">
                          {p?.title || "Item"}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <div className="font-fraunces text-base text-ink tabular-nums">
                            ₹{Number(price * qty).toLocaleString("en-IN")}
                          </div>
                          {qty > 1 && (
                            <div className="text-[10px] text-ink/50 font-jakarta tabular-nums">
                              ₹{Number(price).toLocaleString("en-IN")} ea
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {highlightId && (
                <div className="mt-3 text-[11px] font-jakarta text-ink/60 italic">
                  Highlighted via voice — confirm address below to checkout.
                </div>
              )}
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
            Step 2 of 2
          </div>
          <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
            <HiOutlineMapPin className="text-coral" /> Shipping address
          </h1>
          <p className="mt-1 text-xs text-ink/55 font-jakarta">
            We ship pan-India, typically within 2–4 business days.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-3">
            <Input
              label="Full name"
              value={addr.fullName}
              onChange={(e) => setAddr({ ...addr, fullName: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={addr.phone}
              onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
              required
            />
            <Input
              className="md:col-span-2"
              label="Address line 1"
              value={addr.line1}
              onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
              required
            />
            <Input
              className="md:col-span-2"
              label="Address line 2 (optional)"
              value={addr.line2}
              onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
            />
            <Input
              label="City"
              value={addr.city}
              onChange={(e) => setAddr({ ...addr, city: e.target.value })}
              required
            />
            <Input
              label="State"
              value={addr.state}
              onChange={(e) => setAddr({ ...addr, state: e.target.value })}
            />
            <Input
              label="Pincode"
              value={addr.pincode}
              onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
              required
            />
          </div>
        </Reveal>
      </div>

      {/* Payment sidebar */}
      <aside className="rounded-2xl bg-gradient-to-br from-mint to-lavender p-5 h-max md:sticky md:top-20 border border-ink/5">
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/60 mb-2">
          Payment
        </div>
        <h3 className="font-fraunces text-xl text-ink tracking-tight tabular-nums">
          Pay ₹{total.toLocaleString("en-IN")}
        </h3>

        <div className="mt-4 text-xs text-ink/70 space-y-1.5 font-jakarta">
          <div className="flex justify-between">
            <span>Items ({items.length})</span>
            <span className="tabular-nums">
              ₹{subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span
              className={
                shipping === 0 ? "text-leaf font-semibold" : "tabular-nums"
              }
            >
              {shipping === 0 ? "Free" : `₹${shipping}`}
            </span>
          </div>
          {coinsToRedeem > 0 && (
            <div className="flex justify-between text-coral font-semibold">
              <span>Coins used</span>
              <span className="tabular-nums">−₹{coinsToRedeem}</span>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-white/70 p-3 border border-white text-[11px] font-jakarta text-ink/70 space-y-1.5"
        >
          <div className="flex items-center gap-1.5">
            <HiOutlineTruck className="text-mauve text-sm" /> Estimated delivery
            2–4 days
          </div>
          <div className="flex items-center gap-1.5">
            <HiOutlineShieldCheck className="text-leaf text-sm" /> 7-day easy
            returns
          </div>
          <div className="flex items-center gap-1.5">
            <HiOutlineLockClosed className="text-mauve text-sm" /> Secure
            Razorpay checkout
          </div>
        </motion.div>

        <Button
          onClick={place}
          className="w-full mt-4"
          size="md"
          disabled={placing}
        >
          {placing ? "Placing order…" : "Place order"}
        </Button>
      </aside>
    </div>
  );
}