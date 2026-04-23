import { motion } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineSparkles } from "react-icons/hi2";
import { CountUp } from "./animations/CountUp";

/**
 * TrustGraph — animated radial chart rendering a seller's 6-signal trust + karma.
 */
export default function TrustGraph({
  trustScore = 50,
  fraudKarma = 50,
  breakdown,
  verified,
}) {
  const ringColor =
    trustScore >= 80 ? "#51CF66" : trustScore >= 50 ? "#FFA94D" : "#FF6B6B";
  const size = 180;
  const c = size / 2;
  const r1 = 74,
    r2 = 58,
    r3 = 42,
    r4 = 26;
  const stroke = 8;

  const parts = breakdown || {};
  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  const circ3 = 2 * Math.PI * r3;
  const circ4 = 2 * Math.PI * r4;

  const rings = [
    {
      r: r1,
      color: ringColor,
      val: trustScore / 100,
      circ: circ1,
      label: "trust",
    },
    {
      r: r2,
      color: "#6B5A82",
      val: fraudKarma / 100,
      circ: circ2,
      label: "karma",
    },
    {
      r: r3,
      color: "#FFA94D",
      val: Math.min(1, (parts.ratingPart || 20) / 30),
      circ: circ3,
      label: "rating",
    },
    {
      r: r4,
      color: "#FF6B6B",
      val: Math.min(1, parts.onTimeRate ?? 0.6),
      circ: circ4,
      label: "on-time",
    },
  ];

  return (
    <div className="rounded-2xl bg-white/80 border border-ink/5 p-5 backdrop-blur">
      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
        Seller signals
      </div>
      <div className="flex items-center gap-1.5">
        <HiOutlineShieldCheck className="text-leaf text-base" />
        <h3 className="font-fraunces text-base text-ink tracking-tight">
          Trust graph
        </h3>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4 items-center">
        <div className="relative w-[180px] h-[180px] mx-auto">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {rings.map((ring) => (
              <g key={ring.label}>
                <circle
                  cx={c}
                  cy={c}
                  r={ring.r}
                  fill="none"
                  stroke="#FFF3B0"
                  strokeWidth={stroke}
                  opacity="0.4"
                />
                <motion.circle
                  cx={c}
                  cy={c}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={ring.circ}
                  initial={{ strokeDashoffset: ring.circ }}
                  animate={{ strokeDashoffset: ring.circ * (1 - ring.val) }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              </g>
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-fraunces text-3xl text-ink leading-none tracking-tight">
                <CountUp to={trustScore} />
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mt-1">
                Trust score
              </div>
            </div>
          </div>
        </div>

        <ul className="space-y-1.5 font-jakarta">
          <Legend
            color={ringColor}
            label="Trust score"
            value={trustScore}
            suffix="/100"
          />
          <Legend
            color="#6B5A82"
            label="Fraud karma"
            value={fraudKarma}
            suffix="/100"
          />
          <Legend
            color="#FFA94D"
            label="Avg rating"
            value={parts.avgRating ? parts.avgRating.toFixed(1) : "—"}
            suffix="/5"
            raw
          />
          <Legend
            color="#FF6B6B"
            label="On-time rate"
            value={
              parts.onTimeRate != null ? Math.round(parts.onTimeRate * 100) : 0
            }
            suffix="%"
          />
          <Legend
            color="#51CF66"
            label="Reviews"
            value={parts.reviewCount || 0}
            raw
          />
          <Legend
            color="#E4D4F4"
            label="Repeat buyers"
            value={
              parts.repeatShare != null
                ? Math.round(parts.repeatShare * 100)
                : 0
            }
            suffix="%"
          />
          {verified && (
            <li className="flex items-center gap-1.5 text-[10px] text-leaf font-semibold pt-1 mt-1 border-t border-ink/5">
              <HiOutlineSparkles className="text-xs" /> Verified seller bonus
              applied
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Legend({ color, label, value, suffix = "", raw }) {
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-ink/60 flex-1">{label}</span>
      <span className="font-semibold text-ink tabular-nums">
        {raw ? value : <CountUp to={Number(value) || 0} />}
        {suffix}
      </span>
    </li>
  );
}
