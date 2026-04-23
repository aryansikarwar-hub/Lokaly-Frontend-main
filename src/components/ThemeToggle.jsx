import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 dark:hover:bg-white/10 text-ink dark:text-cream shrink-0 transition ${className}`}
    >
      {isDark ? <HiOutlineSun className="text-base" /> : <HiOutlineMoon className="text-base" />}
    </button>
  );
}
