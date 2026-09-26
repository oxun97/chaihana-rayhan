"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { readStored, writeStored } from "@/lib/persisted-state";

const CartContext = createContext(null);
const STORAGE_KEY = "chaihana_cart_v1";
const FREE_DELIVERY_FROM = 2000;
const DELIVERY_FEE = 100;
const MIN_DELIVERY_ORDER = 1000;

// The cart is a flat { [dishId]: qty } map. A stored `null`, an array, or
// quantities left over from an older shape used to crash the page instead
// of the basket simply coming back empty. Lines that survive are kept, so a
// single odd entry does not throw away a real order.
function coerceLines(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const lines = {};
  for (const [id, qty] of Object.entries(parsed)) {
    const n = Math.floor(Number(qty));
    if (id && Number.isFinite(n) && n > 0) lines[id] = n;
  }
  return lines;
}

export function CartProvider({ children }) {
  const { getItem } = useMenu();
  // lines: { [itemId]: qty }
  const [lines, setLines] = useState({});
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    setLines(readStored(STORAGE_KEY, coerceLines, {}));
  }, []);

  useEffect(() => {
    writeStored(STORAGE_KEY, lines);
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
    minDeliveryOrder: MIN_DELIVERY_ORDER,
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
