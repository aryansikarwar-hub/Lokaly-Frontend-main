import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

const variants = {
  primary: "bg-ink text-cream hover:bg-ink/90",
  coral: "bg-coral text-white hover:bg-coral/90",
  secondary: "bg-cream text-ink border border-ink/10 hover:border-ink/20",
  ghost:
    "bg-white/60 backdrop-blur text-ink hover:bg-white border border-ink/5",
  soft: "bg-peach text-ink hover:bg-peach/80",
  mint: "bg-mint text-ink hover:bg-mint/80",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-cream",
};

const sizes = {
  sm: "px-3 py-1.5 text-[11px] gap-1.5",
  md: "px-4 py-2 text-xs gap-1.5",
  lg: "px-5 py-2.5 text-xs gap-2",
  xl: "px-6 py-3 text-sm gap-2",
  icon: "w-8 h-8 grid place-items-center",
};

const iconSizes = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
  xl: "text-base",
  icon: "text-base",
};

export function Button({
  as: Comp = motion.button,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}) {
  return (
    <Comp
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-jakarta font-semibold tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
    </Comp>
  );
}

export default Button;
