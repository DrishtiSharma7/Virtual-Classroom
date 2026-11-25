import { useState, useEffect, useCallback } from "react";

const THEME_STORAGE_KEY = "vc_theme";
const THEME_EVENT = "vc-theme-change";

const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
};

export default function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const initial = getStoredTheme();
    applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const handleSync = (e) => {
      const next = e?.detail === "dark" ? "dark" : "light";
      setThemeState(next);
    };
    window.addEventListener(THEME_EVENT, handleSync);
    return () => window.removeEventListener(THEME_EVENT, handleSync);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const resolved = nextTheme === "dark" ? "dark" : "light";
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 240);
    }
    setThemeState(resolved);
    applyTheme(resolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: resolved }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
