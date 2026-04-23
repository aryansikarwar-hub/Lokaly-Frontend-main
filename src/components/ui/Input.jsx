import { cn } from "../../lib/cn";

export function Input({ label, error, leftIcon, className, ...rest }) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink/40 text-sm pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className={cn(
            "w-full rounded-xl bg-white/80 backdrop-blur border border-ink/10 focus:border-coral/60 focus:ring-2 focus:ring-coral/15 outline-none px-3 py-2.5 text-xs text-ink placeholder:text-ink/40 transition font-jakarta",
            leftIcon && "pl-9",
            error && "border-coral focus:border-coral focus:ring-coral/20",
            className,
          )}
          {...rest}
        />
      </div>
      {error && (
        <span className="block mt-1 text-[11px] text-coral font-jakarta font-medium">
          {error}
        </span>
      )}
    </label>
  );
}

export function Textarea({ label, error, className, ...rest }) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 uppercase tracking-wider">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl bg-white/80 backdrop-blur border border-ink/10 focus:border-coral/60 focus:ring-2 focus:ring-coral/15 outline-none px-3 py-2.5 text-xs text-ink placeholder:text-ink/40 transition font-jakarta min-h-[100px] leading-relaxed resize-y",
          error && "border-coral",
          className,
        )}
        {...rest}
      />
      {error && (
        <span className="block mt-1 text-[11px] text-coral font-jakarta font-medium">
          {error}
        </span>
      )}
    </label>
  );
}

export default Input;
