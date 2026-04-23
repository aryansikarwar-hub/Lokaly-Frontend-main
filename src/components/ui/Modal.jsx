import { AnimatePresence, motion } from "framer-motion";
import { HiXMark } from "react-icons/hi2";

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = "max-w-lg",
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${width} rounded-2xl bg-cream shadow-xl border border-ink/5 overflow-hidden`}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5">
              <div className="min-w-0">
                {eyebrow && (
                  <div className="text-[9px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-0.5">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h3 className="font-fraunces text-base text-ink tracking-tight truncate">
                    {title}
                  </h3>
                )}
              </div>
              <button
                aria-label="close"
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 text-ink/60 hover:text-ink transition shrink-0"
              >
                <HiXMark className="text-base" />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
