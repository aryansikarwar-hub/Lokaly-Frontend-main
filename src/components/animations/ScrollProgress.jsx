import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * ScrollProgress — slim gradient bar at the top of the viewport that tracks page scroll.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0 50%' }}
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] bg-gradient-to-r from-coral via-tangerine to-leaf"
    />
  );
}

export default ScrollProgress;
