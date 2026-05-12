
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
  const [errorPopup, setErrorPopup] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);

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

     
    if (!res || !res.ok) {
      setErrorPopup({
        title: res?.title || "Cannot spin right now",
        message: res?.message || "Please try again later.",
      });
      // If backend says already spun, lock the button permanently
      if (
        /already spun/i.test(res?.message || "") ||
        /already spun/i.test(res?.title || "")
      ) {
        setHasSpun(true);
      }
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
        fontSize={20}
        onStopSpinning={() => {
          setSpinning(false);
          const p = DATA[idx]?.option;
          if (!p) return;
          setPrize(p);
          setHasSpun(true);

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
  <>
    <AnimatePresence>
      {errorPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm grid place-items-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <div className="text-lg font-fraunces text-ink mb-2">
              {errorPopup.title}
            </div>
            <div className="text-sm text-ink/70 mb-4">
              {errorPopup.message}
            </div>
            <Button
              onClick={() => setErrorPopup(null)}
              className="w-full"
              size="sm"
            >
              OK
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="rounded-3xl bg-gradient-to-br from-butter to-peach p-6 w-[360px] max-w-full relative">
      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
        Flash reward
      </div>

      <div className="flex items-center gap-2 text-ink mb-4">
        <TbGift className="text-lg" />
        <h4 className="font-fraunces text-xl">Spin the wheel</h4>
      </div>

      <div className="grid place-items-center">
        <div className="w-[260px] h-[260px] [&>div]:!w-full [&>div]:!h-full">
          {wheelComponent}
        </div>
      </div>

      <Button
        className="w-full mt-5"
        onClick={start}
        disabled={spinning || hasSpun}
      >
        {spinning ? "Spinning..." : hasSpun ? "Already spun" : "Spin now"}
      </Button>

      <AnimatePresence>
        {prize && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center rounded-xl bg-white/60 border border-white p-3"
          >
            <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 flex items-center justify-center gap-1 mb-1">
              <HiOutlineSparkles className="text-xs text-coral" />
              You won
            </div>

            <div className="font-fraunces text-lg text-coral">
              {prize}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
);
}
