import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'itsla.theme';

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStored());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const resolved: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Stamp the *resolved* value (not the raw setting) on the root so CSS
    // tokens have a single, authoritative source of truth. This also ensures
    // that "Light" with an OS that prefers dark still wins: the dark media
    // query is guarded by `:root:not([data-theme='light'])` and would
    // otherwise apply on top of the light tokens.
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolved,
      setTheme: (t) => setThemeState(t),
      toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
