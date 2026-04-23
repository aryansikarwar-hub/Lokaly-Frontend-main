import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineTruck,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import api from "../services/api";
import { loadRazorpay } from "../services/razorpay";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";

export default function Checkout() {
  const user = useAuthStore((s) => s.user);
  const { cart, subtotal, fetch, clear } = useCartStore();
  const [addr, setAddr] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    city: user?.location?.city || "",
    state: user?.location?.state || "",
    pincode: user?.location?.pincode || "",
  });
  const [placing, setPlacing] = useState(false);
  const nav = useNavigate();
  const coinsToRedeem = Number(sessionStorage.getItem("lokaly-coins") || 0);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const items = cart?.items || [];
  const shipping = subtotal > 999 ? 0 : 49;
  const total = Math.max(0, subtotal + shipping - coinsToRedeem);

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
