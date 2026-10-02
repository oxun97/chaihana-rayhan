"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { readStored, writeStored } from "@/lib/persisted-state";
import { readJson } from "@/lib/readJson";

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

async function validatePromo(code, subtotal) {
  const res = await fetch("/api/promo-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || "");
  return data;
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

  const clearCart = () => {
    setLines({});
    setPromo(null);
  };

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

  // The applied promo code, as priced by the server for `promo.subtotal`.
  // Preview only — create_order() re-prices the code when the order is
  // placed, so nothing charged depends on this.
  const [promo, setPromo] = useState(null);

  async function applyPromo(code) {
    const data = await validatePromo(code, subtotal);
    setPromo(data.valid ? { ...data, subtotal } : null);
    return data;
  }

  // A percent code's discount moves with the basket, and a minimum can stop
  // being met — re-price whenever the subtotal changes.
  useEffect(() => {
    if (!promo || promo.subtotal === subtotal) return;
    if (subtotal === 0) {
      setPromo(null);
      return;
    }
    let cancelled = false;
    validatePromo(promo.code, subtotal)
      .then((data) => {
        if (!cancelled) setPromo(data.valid ? { ...data, subtotal } : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [subtotal, promo]);

  const value = {
    lines,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryFrom: FREE_DELIVERY_FROM,
    deliveryFeeBase: DELIVERY_FEE,
    minDeliveryOrder: MIN_DELIVERY_ORDER,
    promo,
    discount: promo?.discount || 0,
    applyPromo,
    removePromo: () => setPromo(null),
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
