"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "@/data/i18n.json";

const LangContext = createContext(null);

const LANGS = ["ru", "uz"];
const STORAGE_KEY = "chaihana_lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("ru");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.includes(saved)) {
        setLangState(saved);
      }
    } catch (e) {
      /* localStorage unavailable */
    }
    setHydrated(true);
  }, []);

  const setLang = (next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  };

  const t = useMemo(() => {
    const strings = i18n.ui[lang] || i18n.ui.ru;
    return (key) => strings[key] ?? key;
  }, [lang]);

  const iconLabel = useMemo(() => {
    const icons = i18n.icons[lang] || i18n.icons.ru;
    return (key) => icons[key] ?? key;
  }, [lang]);

  const value = { lang, setLang, t, iconLabel, hydrated, langs: LANGS };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
