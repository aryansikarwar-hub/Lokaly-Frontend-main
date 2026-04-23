import { cn } from "../../lib/cn";

const tones = {
  coral: "bg-coral/15 text-coral",
  mint: "bg-mint text-leaf",
  peach: "bg-peach text-ink",
  lavender: "bg-lavender text-ink",
  butter: "bg-butter text-ink",
  ink: "bg-ink text-cream",
  leaf: "bg-leaf/15 text-leaf",
};

export function Badge({ tone = "peach", className, icon, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-jakarta font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
