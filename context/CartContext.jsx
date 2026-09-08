"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "@/context/MenuContext";

const CartContext = createContext(null);
const STORAGE_KEY = "chaihana_cart_v1";
const FREE_DELIVERY_FROM = 2000;
const DELIVERY_FEE = 100;

export function CartProvider({ children }) {
  const { getItem } = useMenu();
  // lines: { [itemId]: qty }
  const [lines, setLines] = useState({});
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (e) {
      /* ignore */
    }
  }, [lines]);

  const addItem = (id, qty = 1) => {
    setLines((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
    setLastAdded(id);
    window.clearTimeout(addItem._t);
    addItem._t = window.setTimeout(() => setLastAdded(null), 1800);
  };

  const setQty = (id, qty) => {
    setLines((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[id];
      } else {
        next[id] = qty;
      }
      return next;
    });
  };

  const removeItem = (id) => setQty(id, 0);

  const clearCart = () => setLines({});

  const items = useMemo(() => {
    return Object.entries(lines)
      .map(([id, qty]) => {
        const dish = getItem(id);
        if (!dish) return null;
        return { ...dish, qty };
      })
      .filter(Boolean);
  }, [lines, getItem]);

  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.price || 0) * it.qty, 0),
    [items]
  );

  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const value = {
    lines,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryFrom: FREE_DELIVERY_FROM,
    addItem,
    setQty,
    removeItem,
    clearCart,
    isCartOpen,
    setCartOpen,
    isCheckoutOpen,
    setCheckoutOpen,
    lastAdded,
    getQty: (id) => lines[id] || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
