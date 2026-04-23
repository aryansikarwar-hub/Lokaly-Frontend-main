import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

/**
 * ConfirmDialog
 * Small reusable modal for destructive / confirm actions.
 *
 * Props:
 *   open         – boolean
 *   title        – string (dialog heading)
 *   message      – string | ReactNode (body copy)
 *   confirmLabel – string (defaults to "Confirm")
 *   cancelLabel  – string (defaults to "Cancel")
 *   onConfirm    – () => void | Promise<void>
 *   onCancel     – () => void
 *   loading      – boolean (disables buttons while work in flight)
 *   tone         – "danger" (default) | "neutral"
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  tone = "danger",
}) {
  const confirmClass =
    tone === "danger"
      ? "bg-coral text-white hover:bg-coral/90"
      : "bg-ink text-cream hover:bg-ink/90 dark:bg-cream dark:text-ink dark:hover:bg-cream/90";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/50 backdrop-blur-sm p-4"
          onClick={loading ? undefined : onCancel}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-cream dark:bg-ink border border-ink/5 dark:border-cream/10 shadow-xl overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3 flex items-start gap-3">
              {tone === "danger" && (
                <div className="shrink-0 w-10 h-10 rounded-full grid place-items-center bg-coral/15 text-coral">
                  <HiOutlineExclamationTriangle className="text-lg" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-fraunces text-base text-ink dark:text-cream tracking-tight">
                  {title}
                </h3>
                {message && (
                  <p className="mt-1 text-xs text-ink/70 dark:text-cream/70 font-jakarta leading-relaxed">
                    {message}
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-white/70 dark:bg-cream/5 border border-ink/10 dark:border-cream/15 text-ink dark:text-cream font-jakarta font-semibold text-xs px-4 py-2 hover:border-ink/25 dark:hover:border-cream/30 disabled:opacity-50 transition"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex items-center justify-center rounded-full font-jakarta font-semibold text-xs px-4 py-2 disabled:opacity-60 transition ${confirmClass}`}
              >
                {loading ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
