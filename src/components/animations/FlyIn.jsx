import { motion, useReducedMotion } from 'framer-motion';

/**
 * FlyIn — floats icon bursts upward (used for live reactions without emoji).
 */
export function FlyIn({ icon, left = 50, color = '#FF6B6B', onDone }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8, x: `${left}%` }}
      animate={{ y: reduce ? -20 : -260, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{ color }}
      className="absolute bottom-6 text-3xl pointer-events-none"
    >
      {icon}
    </motion.div>
  );
}

export default FlyIn;
