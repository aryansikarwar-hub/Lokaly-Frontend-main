import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLongLeft,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center bg-cream relative overflow-hidden">
      {/* Subtle background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-peach/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-lavender/30 rounded-full blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-coral mb-3">
          Error 404
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="font-fraunces text-[96px] md:text-[120px] text-coral leading-none tracking-tight"
        >
          404
        </motion.div>

        <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight mt-4">
          Lost in the bazaar
        </h1>
        <p className="mt-2 text-xs md:text-sm text-ink/60 font-jakarta max-w-sm mx-auto leading-relaxed">
          The page you tried to visit doesn't exist. It may have moved, been
          renamed, or never existed at all.
        </p>

        <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream font-jakarta font-semibold text-xs px-5 py-2.5 hover:bg-ink/90 transition"
          >
            <HiOutlineArrowLongLeft className="text-sm" /> Back to home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-ink/5 text-ink font-jakarta font-semibold text-xs px-5 py-2.5 hover:border-ink/20 transition"
          >
            <HiOutlineMagnifyingGlass className="text-sm" /> Browse products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
