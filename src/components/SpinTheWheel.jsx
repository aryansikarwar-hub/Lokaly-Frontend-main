import { useState } from "react";
import { Wheel } from "react-custom-roulette";
import { motion, AnimatePresence } from "framer-motion";
import { TbGift } from "react-icons/tb";
import { HiOutlineSparkles } from "react-icons/hi2";
import Button from "./ui/Button";

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
    option: "Ship free",
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

  function start() {
    if (spinning) return;
    setPrize(null);
    setIdx(Math.floor(Math.random() * DATA.length));
    setSpinning(true);
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-butter to-peach p-4 border border-ink/5">
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
        <Wheel
          mustStartSpinning={spinning}
          prizeNumber={idx}
          data={DATA}
          outerBorderColor="#2B2438"
          outerBorderWidth={3}
          innerBorderColor="#FFF8F0"
          radiusLineColor="#FFF8F0"
          radiusLineWidth={2}
          fontSize={13}
          onStopSpinning={() => {
            setSpinning(false);
            const p = DATA[idx].option;
            setPrize(p);
            onSpun?.(p);
          }}
        />
      </div>
      <Button
        className="w-full mt-3"
        size="sm"
        onClick={start}
        disabled={spinning}
      >
        {spinning ? "Spinning..." : "Spin now"}
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
    </div>
  );
}
