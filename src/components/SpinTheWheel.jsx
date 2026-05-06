import { Wheel } from "react-custom-roulette";
import { motion, AnimatePresence } from "framer-motion";
import { TbGift } from "react-icons/tb";
import { HiOutlineSparkles } from "react-icons/hi2";
import { HiX } from "react-icons/hi";
import { useState, useEffect, useMemo } from "react";
import Button from "./ui/Button";
import confetti from "canvas-confetti";

const DATA = [
  {
    option: "5% off",
    style: { backgroundColor: "#FFD6BA", textColor: "#2B2438" },
  },
  {
    option: "10% off",
    style: { backgroundColor: "#C8F4DE", textColor: "#2B2438" },
  },
  {
    option: "Free shipping",
    style: { backgroundColor: "#E4D4F4", textColor: "#2B2438" },
  },
  {
    option: "50 coins",
    style: { backgroundColor: "#FFF3B0", textColor: "#2B2438" },
  },
  {
    option: "15% off",
    style: { backgroundColor: "#FFA94D", textColor: "#FFFFFF" },
  },
  {
    option: "Try again",
    style: { backgroundColor: "#FF6B6B", textColor: "#FFFFFF" },
  },
];

export default function SpinTheWheel({ onSpun }) {
  const [spinning, setSpinning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [prize, setPrize] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [errorPopup, setErrorPopup] = useState(null); // {title, message}

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function start() {
    if (spinning) return;
    setPrize(null);

    let res;
    try {
      res = await onSpun();
    } catch (err) {
      console.error("[Spin] onSpun threw:", err);
      setErrorPopup({
        title: "Spin failed",
        message: err?.message || "Something went wrong. Please try again.",
      });
      return;
    }

    console.log("[Spin] backend response:", res);

    // Backend rejected
    if (!res || !res.ok) {
      setErrorPopup({
        title: res?.title || "Cannot spin right now",
        message: res?.message || "Please try again later.",
      });
      return;
    }

    // Defensive: prize must exist and have a label
    if (!res.prize || !res.prize.label) {
      console.error("[Spin] Missing prize data:", res);
      setErrorPopup({
        title: "Something went wrong",
        message: "The server didn't return a valid prize.",
      });
      return;
    }

    const prizeLabel = res.prize.label;
    const prizeIndex = DATA.findIndex(
      (item) => item.option.toLowerCase() === prizeLabel.toLowerCase(),
    );

    if (prizeIndex === -1) {
      console.error("[Spin] Prize label not in DATA:", prizeLabel);
      setErrorPopup({
        title: "Something went wrong",
        message: `Unknown prize: ${prizeLabel}`,
      });
      return;
    }

    const finalIndex = prizeIndex + DATA.length * 3;
    setIdx(prizeIndex); 
    setSpinning(true);
  }
  const wheelComponent = useMemo(
    () => (
      <Wheel
        mustStartSpinning={spinning}
        prizeNumber={idx}
        data={DATA}
        spinDuration={1.2}
        outerBorderColor="#2B2438"
        outerBorderWidth={3}
        innerBorderColor="#FFF8F0"
        radiusLineColor="#FFF8F0"
        radiusLineWidth={2}
        fontSize={13}
        onStopSpinning={() => {
          setSpinning(false);
          const p = DATA[idx]?.option;
          if (!p) return;
          setPrize(p);
          setCooldown(10);
          if (p !== "Try again") {
            confetti({
              particleCount: 150,
              spread: 100,
              startVelocity: 30,
              scalar: 1.2,
              origin: { y: 0.6 },
            });
          }
        }}
      />
    ),
    [spinning, idx], // only re-render when these change, NOT cooldown
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-butter to-peach p-4 border border-ink/5 relative">
      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
        Flash reward
      </div>
      <div className="flex items-center gap-1.5 text-ink">
        <TbGift className="text-base" />
        <h4 className="font-fraunces text-base tracking-tight">
          Spin the wheel
        </h4>
      </div>

      <div className="mt-3 grid place-items-center">
        <div className="mt-3 grid place-items-center">{wheelComponent}</div>
      </div>

      <Button
        className="w-full mt-3"
        size="sm"
        onClick={start}
        disabled={spinning || cooldown > 0}
      >
        {spinning
          ? "Spinning..."
          : cooldown > 0
            ? `Wait ${cooldown}s`
            : "Spin now"}
      </Button>

      <AnimatePresence>
        {prize && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center rounded-xl bg-white/60 border border-white p-2.5"
          >
            <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 flex items-center justify-center gap-1 mb-0.5">
              <HiOutlineSparkles className="text-xs text-coral" /> You won
            </div>
            <div className="font-fraunces text-base text-coral tracking-tight">
              {prize}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error popup ── */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setErrorPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl relative"
            >
              <button
                onClick={() => setErrorPopup(null)}
                className="absolute top-3 right-3 text-ink/40 hover:text-ink"
              >
                <HiX className="text-lg" />
              </button>
              <div className="w-12 h-12 rounded-full bg-coral/10 grid place-items-center mb-3">
                <TbGift className="text-coral text-xl" />
              </div>
              <h3 className="font-fraunces text-lg text-ink mb-1">
                {errorPopup.title}
              </h3>
              <p className="text-sm font-jakarta text-ink/60 mb-4">
                {errorPopup.message}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setErrorPopup(null)}
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
