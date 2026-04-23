import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TbCoins } from 'react-icons/tb';
import { CountUp } from '../../components/animations/CountUp';
import { useAuthStore } from '../../store/authStore';

export default function CoinsWidget() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <Link to="/coins" className="block">
      <motion.div
        whileHover={{ y: -2 }}
        className="inline-flex items-center gap-2 rounded-full bg-butter px-4 py-2 shadow-soft"
      >
        <motion.span
          animate={{ rotate: [0, 12, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-tangerine text-lg"
        >
          <TbCoins />
        </motion.span>
        <span className="font-jakarta font-semibold text-ink text-sm">
          <CountUp to={user.coins || 0} /> coins
        </span>
      </motion.div>
    </Link>
  );
}
