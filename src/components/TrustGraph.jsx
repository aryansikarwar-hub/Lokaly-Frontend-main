import { motion } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineSparkles, HiStar } from "react-icons/hi2";
import { CountUp } from "./animations/CountUp";

/**
 * TrustGraph — redesigned radial chart with cleaner visual hierarchy.
 * Larger, more legible, with better legend and score breakdown.
 */
export default function TrustGraph({ trustScore = 50, fraudKarma = 50, breakdown, verified }) {
  const parts = breakdown || {};

  // Score colour thresholds
  const scoreColor =
    trustScore >= 80 ? "#51CF66"
    : trustScore >= 60 ? "#FFA94D"
    : "#FF6B6B";

  const scoreBg =
    trustScore >= 80 ? "bg-leaf/10 text-leaf border-leaf/20"
    : trustScore >= 60 ? "bg-tangerine/10 text-tangerine border-tangerine/20"
    : "bg-coral/10 text-coral border-coral/20";

  const scoreLabel =
    trustScore >= 80 ? "Excellent"
    : trustScore >= 60 ? "Good"
    : "Building";

  // SVG ring config
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const rings = [
    { r: 80, color: scoreColor,  val: trustScore / 100,                           label: "Trust",    stroke: 10 },
    { r: 64, color: "#6B5A82",   val: fraudKarma / 100,                            label: "Karma",    stroke: 9  },
    { r: 50, color: "#FFA94D",   val: Math.min(1, (parts.ratingPart || 20) / 30), label: "Rating",   stroke: 8  },
    { r: 36, color: "#60B8FF",   val: Math.min(1, parts.onTimeRate ?? 0.6),        label: "On-time",  stroke: 7  },
  ];

  const metrics = [
    { dot: scoreColor, label: "Trust score",   value: trustScore,   suffix: "/100" },
    { dot: "#6B5A82",  label: "Fraud karma",   value: fraudKarma,   suffix: "/100" },
    { dot: "#FFA94D",  label: "Avg rating",    value: parts.avgRating ? parts.avgRating.toFixed(1) : "—", suffix: "/5", raw: true },
    { dot: "#60B8FF",  label: "On-time rate",  value: parts.onTimeRate != null ? Math.round(parts.onTimeRate * 100) : 0, suffix: "%" },
    { dot: "#51CF66",  label: "Reviews",       value: parts.reviewCount || 0, raw: true },
    { dot: "#C4B5F4",  label: "Repeat buyers", value: parts.repeatShare != null ? Math.round(parts.repeatShare * 100) : 0, suffix: "%" },
  ];

  return (
    <div className="rounded-2xl bg-white/90 border border-ink/6 overflow-hidden backdrop-blur shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-ink/5">
        <div className="text-[9px] uppercase tracking-[0.22em] font-jakarta font-semibold text-ink/40 mb-0.5">
          Seller signals
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HiOutlineShieldCheck className="text-leaf text-base" />
            <h3 className="font-fraunces text-base text-ink tracking-tight">Trust graph</h3>
          </div>
          {/* Score badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-jakarta font-bold ${scoreBg}`}>
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* Chart + Legend */}
      <div className="p-4">
        {/* Radial chart */}
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {rings.map((ring) => {
              const circ = 2 * Math.PI * ring.r;
              return (
                <g key={ring.label}>
                  {/* Track */}
                  <circle cx={cx} cy={cy} r={ring.r} fill="none"
                    stroke="#F5F0E8" strokeWidth={ring.stroke} />
                  {/* Progress */}
                  <motion.circle
                    cx={cx} cy={cy} r={ring.r} fill="none"
                    stroke={ring.color} strokeWidth={ring.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ * (1 - ring.val) }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    transform={`rotate(-90 ${cx} ${cy})`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Centre content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="font-fraunces text-4xl text-ink leading-none tracking-tight">
              <CountUp to={trustScore} />
            </div>
            <div className="text-[8px] uppercase tracking-[0.22em] font-jakarta font-semibold text-ink/40 mt-1">
              Trust score
            </div>
            {verified && (
              <div className="mt-1.5 flex items-center gap-0.5 text-leaf">
                <HiOutlineSparkles className="text-[10px]" />
                <span className="text-[8px] font-jakarta font-bold">Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics legend */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-ink/45 font-jakarta truncate">{m.label}</div>
                <div className="text-[11px] font-jakarta font-semibold text-ink tabular-nums leading-tight">
                  {m.raw ? m.value : <CountUp to={Number(m.value) || 0} />}
                  {m.suffix && <span className="text-ink/40 font-normal text-[9px]">{m.suffix}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {verified && (
          <div className="mt-3 pt-3 border-t border-ink/5 flex items-center gap-1.5 text-[10px] text-leaf font-jakarta font-semibold">
            <HiOutlineSparkles className="text-xs" />
            Verified seller bonus applied
          </div>
        )}
      </div>
    </div>
  );
}