import { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import api from "../services/api";
import { Modal } from "./ui/Modal";
import Button from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { useAuthStore } from "../store/authStore";

export default function BookCoHostModal({ host, open, onClose, onSuccess }) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: 60,
    notes: "",
  });

  if (!host) return null;

  const totalAmount = Math.round((host.perStreamRate * formData.duration) / 60);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to book a co-host");
      return;
    }

    if (!formData.date || !formData.time) {
      toast.error("Please select date and time");
      return;
    }

    const scheduledAt = new Date(`${formData.date}T${formData.time}`);
    if (scheduledAt < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/cohosts/${host._id}/book`, {
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(formData.duration),
        notes: formData.notes,
      });

      setStep("success");
      toast.success("Booking confirmed! 🎉");

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2500);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Booking failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setStep("form");
    setFormData({ date: "", time: "", duration: 60, notes: "" });
    onClose();
  }

  // Tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Book Co-host"
      eyebrow="Talent marketplace"
      width="max-w-md"
    >
      {step === "form" ? (
        <div className="space-y-4">
          {/* Host Info */}
          <div className="flex items-center gap-3 pb-3 border-b border-ink/5 dark:border-white/8">
            <Avatar
              src={host.profileImage || host.avatar}
              name={host.name}
              size="md"
              aura={Math.round((host.rating || 0) * 18)}
            />
            <div className="flex-1 min-w-0">
              <div className="font-fraunces text-base text-ink dark:text-cream truncate">
                {host.name}
              </div>
              <div className="text-[11px] text-ink/55 dark:text-cream/55 font-jakarta truncate">
                {host.specialty} · {host.location?.city}
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {/* Date */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/60 dark:text-cream/60">
                <HiOutlineCalendar className="inline mr-1" /> Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={minDate}
                required
                className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta transition"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/60 dark:text-cream/60">
                <HiOutlineClock className="inline mr-1" /> Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta transition"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/60 dark:text-cream/60">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, duration: mins })
                    }
                    className={`py-2 rounded-xl text-xs font-jakarta font-semibold transition border ${
                      formData.duration === mins
                        ? "bg-ink dark:bg-cream text-cream dark:text-ink border-ink dark:border-cream"
                        : "bg-white/60 dark:bg-white/5 border-ink/10 dark:border-white/10 text-ink/70 dark:text-cream/70 hover:border-ink/30"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/60 dark:text-cream/60">
                Special Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Any specific requirements..."
                className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta placeholder:text-ink/35 dark:placeholder:text-cream/35 resize-none transition"
              />
            </div>

            {/* Total */}
            <div className="bg-lavender/40 dark:bg-lavender/10 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/60 dark:text-cream/60">
                  Total Amount
                </div>
                <div className="text-[10px] text-ink/50 dark:text-cream/50 font-jakarta mt-0.5">
                  ₹{host.perStreamRate} × {formData.duration / 60}h
                </div>
              </div>
              <div className="font-fraunces text-2xl text-ink dark:text-cream tabular-nums">
                ₹{totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              leftIcon={<HiOutlineVideoCamera />}
            >
              {loading ? "Booking..." : `Confirm Booking · ₹${totalAmount}`}
            </Button>

            <p className="text-[10px] text-ink/40 dark:text-cream/40 font-jakarta text-center">
              You'll receive a confirmation once the co-host accepts.
            </p>
          </form>
        </div>
      ) : (
        // Success state
        <div className="py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-16 h-16 bg-leaf/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <HiOutlineCheckCircle className="text-4xl text-leaf" />
          </motion.div>
          <h3 className="font-fraunces text-xl text-ink dark:text-cream mb-2">
            Booking Confirmed!
          </h3>
          <p className="text-sm text-ink/60 dark:text-cream/60 font-jakarta">
            {host.name} will host your stream on{" "}
            {new Date(`${formData.date}T${formData.time}`).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short", year: "numeric" },
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}