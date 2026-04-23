import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';

/**
 * CountUp — animated number that counts to `to` when scrolled into view.
 */
export function CountUp({ to = 0, duration = 1.4, format = (v) => Math.round(v).toLocaleString('en-IN'), prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${format(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [inView, to, duration, mv]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

export default CountUp;
