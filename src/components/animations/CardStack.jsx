import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CardStack — Tinder-like swipable stack.
 *
 * Props:
 *   items      : array of items to render. Each passed to `render(item, index)`.
 *   render     : (item, index) => ReactNode
 *   onDismiss  : (item, direction) => void   direction is -1 or 1
 *   visible    : number of cards visible in the stack (default 3)
 *   rotation   : max rotation in degrees on drag (default 12)
 *   className  : wrapper className
 */
export function CardStack({
  items,
  render,
  onDismiss,
  visible = 3,
  rotation = 12,
  className = '',
}) {
  const [dismissed, setDismissed] = useState([]);
  const active = items.filter((_, i) => !dismissed.includes(i));

  function dismiss(realIndex, direction) {
    setDismissed((d) => [...d, realIndex]);
    onDismiss?.(items[realIndex], direction);
  }

  return (
    <div className={`relative w-full max-w-sm aspect-[3/4] mx-auto ${className}`}>
      <AnimatePresence>
        {active.slice(0, visible).map((item, idx) => {
          const realIndex = items.indexOf(item);
          const isTop = idx === 0;
          const depth = idx;
          return (
            <motion.div
              key={realIndex}
              initial={{ scale: 1 - depth * 0.05, y: depth * 16, opacity: 0 }}
              animate={{ scale: 1 - depth * 0.05, y: depth * 16, opacity: 1 }}
              exit={{ x: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(_, info) => {
                if (!isTop) return;
                if (Math.abs(info.offset.x) > 120) {
                  dismiss(realIndex, info.offset.x > 0 ? 1 : -1);
                }
              }}
              whileDrag={{ rotate: 0 }}
              style={{ zIndex: visible - depth }}
              className="absolute inset-0 rounded-3xl shadow-soft bg-white overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <motion.div
                className="w-full h-full"
                style={{ pointerEvents: isTop ? 'auto' : 'none' }}
              >
                {render(item, realIndex)}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {active.length === 0 && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl border-2 border-dashed border-mauve/30 text-mauve font-caveat text-2xl">
          You have seen everything
        </div>
      )}
    </div>
  );
}

export default CardStack;
