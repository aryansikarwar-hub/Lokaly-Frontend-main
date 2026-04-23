import { motion } from 'framer-motion';

/**
 * TextReveal — word-by-word reveal on scroll-in-view.
 */
export function TextReveal({ text, className, delay = 0 }) {
  const words = String(text).split(/\s+/);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.04,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

export default TextReveal;
