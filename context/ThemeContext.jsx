"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = "chaihana_theme";
const THEMES = ["day", "night"];

// Runs before first paint (see layout.js) so a night-theme visitor never
// sees a flash of the cream day theme.
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="night"||t==="day"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export function ThemeProvider({ children }) {
  // Day is the default: the storefront is a cream design, and night is the
  // opt-in. A stored choice always wins over the OS setting, which is why
  // prefers-color-scheme is not consulted here.
  const [theme, setThemeState] = useState("day");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (THEMES.includes(saved)) setThemeState(saved);
    } catch (e) {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (next) => {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      /* ignore */
    }
  };

  const value = {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "day" ? "night" : "day"),
    isNight: theme === "night",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
