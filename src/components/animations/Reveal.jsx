import { motion } from "framer-motion";

/**
 * Reveal — fade+rise on scroll-in-view with optional stagger via `delay`.
 * Tighter, more restrained defaults for editorial feel.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.6,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
