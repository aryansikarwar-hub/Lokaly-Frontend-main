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
          // ✅ z-[9999] — navbar (z-40) aur sidebar (z-50) se upar
          className="fixed inset-0 z-[9999] grid place-items-end sm:place-items-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            // ✅ Mobile pe bottom sheet, desktop pe centered modal
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={`
              w-full ${width}
              rounded-t-3xl sm:rounded-2xl
              bg-cream dark:bg-ink
              shadow-xl border border-ink/5 dark:border-white/10
              overflow-hidden
              max-h-[92dvh] sm:max-h-[85vh]
              flex flex-col
            `}
          >
            {/* drag handle — mobile pe visual cue */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-ink/15" />
            </div>

            {/* header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5 dark:border-white/10 shrink-0">
              <div className="min-w-0">
                {eyebrow && (
                  <div className="text-[9px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-0.5">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h3 className="font-fraunces text-base text-ink dark:text-cream tracking-tight truncate">
                    {title}
                  </h3>
                )}
              </div>

              {/* ✅ Touch target bada kiya — 44x44px minimum */}
              <button
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="
                  w-11 h-11
                  grid place-items-center
                  rounded-full
                  hover:bg-peach/60 active:bg-peach
                  dark:hover:bg-white/10
                  text-ink/60 hover:text-ink dark:text-cream/60 dark:hover:text-cream
                  transition
                  shrink-0
                  touch-manipulation
                "
              >
                <HiXMark className="text-xl" />
              </button>
            </div>

            {/* scrollable content */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;