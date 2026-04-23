import { motion } from "framer-motion";

export function Spinner({ size = 28, color = "#FF6B6B" }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="rgba(255,107,107,0.15)"
        strokeWidth="4"
      />
      <path
        d="M25 5a20 20 0 0 1 20 20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export default Spinner;
