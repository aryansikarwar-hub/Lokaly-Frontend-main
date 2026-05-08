import {
  HiOutlineBolt,
  HiOutlineTruck,
  HiOutlineMapPin,
} from "react-icons/hi2";

 
export default function DeliveryBadge({
  delivery,
  distanceKm,
  compact = false,
}) {
  if (!delivery) return null;

  const config = {
    same_day: {
      Icon: HiOutlineBolt,
      tone: "bg-coral/15 text-coral dark:bg-coral/25 dark:text-white",
      pulse: true,
    },
    next_day: {
      Icon: HiOutlineTruck,
      tone: "bg-mint/40 text-leaf dark:bg-mint/20 dark:text-mint",
      pulse: false,
    },
    two_day: {
      Icon: HiOutlineTruck,
      tone: "bg-butter/60 text-tangerine dark:bg-butter/20 dark:text-butter",
      pulse: false,
    },
    standard: {
      Icon: HiOutlineMapPin,
      tone: "bg-white/70 text-ink/55 dark:bg-white/5 dark:text-cream/55",
      pulse: false,
    },
  }[delivery.tier] || {
    Icon: HiOutlineMapPin,
    tone: "bg-white/70 text-ink/55",
    pulse: false,
  };

  const { Icon, tone, pulse } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-jakarta font-semibold tracking-wide ${tone} ${
        compact
          ? "px-1.5 py-0.5 text-[9px] uppercase"
          : "px-2 py-0.5 text-[10px] uppercase"
      }`}
    >
      {pulse && (
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-60" />
          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-coral" />
        </span>
      )}
      <Icon className="text-xs" />
      <span>{delivery.label}</span>
      {Number.isFinite(distanceKm) && !compact && (
        <span className="opacity-70 normal-case">
          · {distanceKm.toFixed(1)} km
        </span>
      )}
    </span>
  );
}
