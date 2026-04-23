import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'lokaly-theme';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  toggle: () => {},
});

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {
    /* ignore */
  }
  // if (
  //   typeof window.matchMedia === 'function' &&
  //   window.matchMedia('(prefers-color-scheme: dark)').matches
  // ) {
  //   return 'dark';
  // }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback(
    (t) => setThemeState(t === 'dark' ? 'dark' : 'light'),
    []
  );
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  // `toggle` kept as an alias for backward compatibility with existing consumers.
  const value = { theme, setTheme, toggleTheme, toggle: toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
