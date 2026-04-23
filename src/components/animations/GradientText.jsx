import { cn } from '../../lib/cn';

/**
 * GradientText — animated multi-stop background-clip:text.
 * Uses the `gradientPan` keyframe from tailwind.config.
 */
export function GradientText({ children, className, from = '#E85A5A', via = '#F39445', to = '#6B5A82' }) {
  return (
    <span
      className={cn('bg-clip-text text-transparent animate-gradientPan', className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${via}, ${from})`,
        backgroundSize: '200% 100%',
      }}
    >
      {children}
    </span>
  );
}

export default GradientText;
