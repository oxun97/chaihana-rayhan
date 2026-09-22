"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { readStored, writeStored } from "@/lib/persisted-state";

const FavoritesContext = createContext(null);
const STORAGE_KEY = "chaihana_favorites_v1";

// Favourites are a list of dish ids. Anything else in storage is discarded:
// `ids.map(...)` on a stored object used to throw on every render.
function coerceIds(parsed) {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter((id) => typeof id === "string" && id);
}

export function FavoritesProvider({ children }) {
  const { getItem } = useMenu();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(readStored(STORAGE_KEY, coerceIds, []));
  }, []);

  useEffect(() => {
    writeStored(STORAGE_KEY, ids);
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
