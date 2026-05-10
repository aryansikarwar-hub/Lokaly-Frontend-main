import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useLocationStore } from "../store/locationStore";
import { useUIStore } from "../store/uiStore";
import LocationPrompt from "../features/hyperlocal/LocationPrompt";

export default function NavbarLocationChip() {
  const label = useLocationStore((s) => s.label);
  const pincode = useLocationStore((s) => s.pincode);
  const coords = useLocationStore((s) => s.coords);
  const open = useLocationStore((s) => s.promptOpen);
  const setOpen = useLocationStore((s) => s.setPromptOpen);

  const display = label || (pincode ? `Pincode ${pincode}` : "Set location");
  const hasLocation = !!(coords || pincode);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          hasLocation
            ? `Location: ${display}. Tap to change.`
            : "Set your location"
        }
        title={display}
        className={`
          inline-flex items-center justify-center gap-1 rounded-full font-jakarta font-bold uppercase tracking-wider transition shrink-0 touch-manipulation
          w-9 h-9 md:w-auto md:h-auto md:px-2.5 md:py-1
          text-[10px]
          ${
            hasLocation
              ? "bg-mint/40 text-leaf hover:bg-mint/60 dark:bg-mint/20 dark:text-mint"
              : "bg-coral/15 text-coral hover:bg-coral/25 dark:bg-coral/25 dark:text-white"
          }
        `}
      >
        <HiOutlineMapPin className="text-base md:text-sm" />
        {/* Label is visible on tablet+ only to keep the mobile navbar tight */}
        <span className="hidden md:inline-block max-w-[80px] truncate">
          {display}
        </span>
        {/* Tiny dot indicator on mobile when location is set — gives a visual
            cue that the chip carries state, since we hide the text label */}
        {hasLocation && (
          <span className="md:hidden absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-leaf" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-50 mt-2 right-0 w-[calc(100vw-1.5rem)] max-w-[320px] md:w-80"
            >
              <LocationPrompt
                onResolved={() => setOpen(false)}
                onDismiss={() => setOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
