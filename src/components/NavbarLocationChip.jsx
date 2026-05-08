import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useLocationStore } from "../store/locationStore";
import LocationPrompt from "../features/hyperlocal/LocationPrompt";

/**
 * NavbarLocationChip — tiny pill in the navbar showing current location.
 * Click to change. If no location set, shows "Set location".
 *
 * Drop into Navbar.jsx near the cart icon:
 *   import LocationChip from './LocationChip';
 *   <LocationChip />
 */
export default function NavbarLocationChip() {
  const label = useLocationStore((s) => s.label);
  const pincode = useLocationStore((s) => s.pincode);
  const coords = useLocationStore((s) => s.coords);
  const [open, setOpen] = useState(false);

  const display = label || (pincode ? `Pincode ${pincode}` : "Set location");
  const hasLocation = !!(coords || pincode);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-jakarta font-bold uppercase tracking-wider transition shrink-0 ${
          hasLocation
            ? "bg-mint/40 text-leaf hover:bg-mint/60"
            : "bg-coral/15 text-coral hover:bg-coral/25"
        }`}
        aria-label="Change location"
      >
        <HiOutlineMapPin className="text-sm" />
        <span className="max-w-[80px] truncate">{display}</span>
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
              className="absolute right-0 mt-2 w-80 z-50"
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
