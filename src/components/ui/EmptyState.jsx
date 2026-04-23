import { HiSparkles } from "react-icons/hi2";

export function EmptyState({
  title = "Nothing here yet",
  hint = "Try coming back soon.",
  icon,
}) {
  return (
    <div className="grid place-items-center py-12 text-center">
      <div className="w-12 h-12 grid place-items-center rounded-xl bg-peach/60 text-ink text-lg mb-3">
        {icon || <HiSparkles />}
      </div>
      <h4 className="font-fraunces text-base text-ink tracking-tight mb-1">
        {title}
      </h4>
      <p className="text-xs text-ink/55 font-jakarta max-w-xs leading-relaxed">
        {hint}
      </p>
    </div>
  );
}

export default EmptyState;
