import { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineMapPin,
  HiOutlineXMark,
  HiOutlineSparkles,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useLocationStore } from "../../store/locationStore";
import api from "../../services/api";
 
export default function LocationPrompt({ onResolved, onDismiss }) {
  const { status, request } = useGeolocation();
  const setFromGPS = useLocationStore((s) => s.setFromGPS);
  const setFromPincode = useLocationStore((s) => s.setFromPincode);
  const [mode, setMode] = useState("idle"); // 'idle' | 'pincode'
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleUseGPS() {
    // console.log("[LocationPrompt] handleUseGPS clicked");
    const coords = await request();
    if (!coords) {
      toast.error("Could not detect location. Try entering a pincode.");
      return;
    }
    setFromGPS(coords, "");
    toast.success("Location detected");
    if (onResolved) onResolved();
  }

  async function handlePincode(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    setBusy(true);
    try {
      // Optional: backend route /api/geo/pincode → { lng, lat, label }
      // If you don't have it yet, we still save the pincode and the
      // backend's trending endpoint falls back to pincode matching.
      const { data } = await api
        .get("/geo/pincode", { params: { pincode } })
        .catch(() => ({ data: null }));

      if (data && data.lng != null && data.lat != null) {
        setFromPincode({
          pincode,
          lng: data.lng,
          lat: data.lat,
          label: data.label || `Pincode ${pincode}`,
        });
      } else {
        setFromPincode({
          pincode,
          lng: null,
          lat: null,
          label: `Pincode ${pincode}`,
        });
      }
      toast.success("Location set");
      if (onResolved) onResolved();
    } catch (err) {
      toast.error("Could not resolve pincode");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="
relative
group
rounded-2xl

bg-gradient-to-br
from-peach
via-butter
to-lavender

dark:bg-gradient-to-br
dark:from-[#211c31]
dark:via-[#191624]
dark:to-[#14111d]

dark:backdrop-blur-2xl

border
border-ink/5
dark:border-white/10

shadow-[0_10px_40px_rgba(0,0,0,0.08)]
dark:shadow-[0_10px_60px_rgba(0,0,0,0.45)]

hover:border-ink/10
dark:hover:border-white/20

transition-all
duration-300

p-5
md:p-6

overflow-hidden

text-ink
dark:text-white
"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-7 h-7 grid place-items-center rounded-full bg-white/40 hover:bg-white/70 text-ink/60 transition"
          aria-label="Dismiss"
        >
          <HiOutlineXMark className="text-sm" />
        </button>
      )}

      <div className="relative flex items-start gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-11 md:h-11 grid place-items-center rounded-xl bg-white/60 dark:bg-white/10 border border-ink/10 dark:border-white/10 backdrop-blur shrink-0">
          <HiOutlineSparkles className="text-coral text-lg dark:text-cream" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-coral mb-1">
            Hyperlocal magic
          </div>
          <h3 className="font-fraunces text-lg md:text-xl text-ink dark:text-cream tracking-tight leading-tight">
            Discover sellers in your neighbourhood
          </h3>
          <p className="mt-1.5 text-xs text-ink/65 dark:text-cream/70 font-jakarta max-w-md leading-relaxed">
            We&apos;ll show you artisans nearby, same-day delivery options, and
            what&apos;s trending in your area.
          </p>

          {mode === "idle" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleUseGPS}
                disabled={status === "loading"}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-xs font-jakarta font-semibold hover:bg-ink/90 transition disabled:opacity-60"
              >
                <HiOutlineMapPin className="text-sm" />
                {status === "prompt" ? "Detecting…" : "Use my location"}
              </button>
              <button
                onClick={() => setMode("pincode")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-ink/10 dark:border-white/10 text-ink dark:text-cream px-4 py-2 text-xs font-jakarta font-semibold hover:border-ink/30 dark:hover:border-white/20 transition"
              >
                Enter pincode
              </button>
            </div>
          )}

          {mode === "pincode" && (
            <form
              onSubmit={handlePincode}
              className="mt-4 flex flex-wrap gap-2"
            >
              <input
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6-digit pincode"
                inputMode="numeric"
                autoFocus
                className="flex-1 min-w-[140px] rounded-full bg-white/80 dark:bg-white/95 border border-ink/10 dark:border-white/10 text-ink dark:text-ink px-4 py-2 text-xs font-jakarta outline-none focus:border-ink/30 dark:focus:border-white/20 transition"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-ink text-cream px-4 py-2 text-xs font-jakarta font-semibold hover:bg-ink/90 transition disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-full bg-white/70 dark:bg-white/10 border border-ink/10 dark:border-white/10 text-ink dark:text-cream px-4 py-2 text-xs font-jakarta font-semibold hover:border-ink/30 dark:hover:border-white/20 transition"
              >
                Back
              </button>
            </form>
          )}

          {status === "denied" && mode === "idle" && (
            <p className="mt-3 text-[11px] text-coral font-jakarta">
              Location access blocked. You can enter a pincode instead.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
