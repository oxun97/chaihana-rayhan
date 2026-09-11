"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "@/context/MenuContext";

const FavoritesContext = createContext(null);
const STORAGE_KEY = "chaihana_favorites_v1";

export function FavoritesProvider({ children }) {
  const { getItem } = useMenu();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      /* ignore */
    }
  }, [ids]);

  const toggle = (id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const isFavorite = (id) => ids.includes(id);

  const items = useMemo(
    () => ids.map((id) => getItem(id)).filter(Boolean),
    [ids, getItem]
  );

  const value = { ids, items, toggle, isFavorite, count: items.length };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
