"use client";

import { createContext, useContext, useMemo } from "react";
import { buildMenuIndex, localized } from "@/lib/menu";

const MenuContext = createContext(null);

export function MenuProvider({ categories, children }) {
  const { getItem } = useMemo(() => buildMenuIndex(categories), [categories]);

  const value = useMemo(
    () => ({ categories: categories || [], getItem, localized }),
    [categories, getItem]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
