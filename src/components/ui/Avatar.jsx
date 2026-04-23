import { cn } from "../../lib/cn";

function initials(name = "") {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name = "", size = "md", aura, className }) {
  const sizes = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl",
  };
  const auraColor =
    aura >= 80
      ? "ring-leaf"
      : aura >= 50
        ? "ring-tangerine"
        : aura
          ? "ring-coral"
          : "ring-white";

  return (
    <div
      className={cn(
        "relative inline-grid place-items-center shrink-0",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -m-1 rounded-full ring-2 opacity-70 blur-[1px]",
          auraColor,
        )}
      />
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            "relative rounded-full object-cover ring-2 ring-cream",
            sizes[size],
          )}
        />
      ) : (
        <div
          className={cn(
            "relative rounded-full bg-gradient-to-br from-peach to-lavender grid place-items-center font-jakarta font-bold text-ink ring-2 ring-cream",
            sizes[size],
          )}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}

export default Avatar;
