"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useOverlay } from "@/lib/useOverlay";
import { CartEmpty, CartLines, CartSummary } from "@/components/site/CartContents";

const DESKTOP_QUERY = "(min-width: 1024px)";

function CartHeader({ onClose }) {
  const { t } = useLang();
  const { itemCount, clearCart } = useCart();
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
      <h2 className="font-display text-[1.35rem] font-extrabold tracking-tight text-body">
        {t("cart_title")}
        {itemCount > 0 && <span className="ml-2 text-[0.95rem] font-medium text-muted">{itemCount}</span>}
      </h2>
      <div className="flex items-center gap-1">
        {itemCount > 0 && (
          <button
            onClick={clearCart}
            aria-label={t("cart_clear")}
            title={t("cart_clear")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-sunken hover:text-body"
          >
            <Trash2 size={18} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-sunken hover:text-body"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// The cart as a permanent right-hand column on wide screens — always in
// view while browsing, the way delivery apps lay out a restaurant page.
export function CartPanel() {
  const { items, setCheckoutOpen } = useCart();
  return (
    <aside
      id="cart-panel"
      className="sticky top-[5.75rem] flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-[28px] border border-edge bg-card shadow-[0_8px_30px_-20px_rgba(0,0,0,0.25)]"
    >
      <CartHeader />
      {items.length === 0 ? (
        <CartEmpty />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            <CartLines />
          </div>
          <div className="border-t border-edge p-5">
            <CartSummary onCheckout={() => setCheckoutOpen(true)} />
          </div>
        </>
      )}
    </aside>
  );
}

// The phone cart: a bottom sheet opened from the floating cart bar. Wide
// screens have the CartPanel column instead, so anything that asks for
// the cart there (the header button, "back to cart" from checkout) just
// brings the column into view.
export default function CartDrawer() {
  const { items, isCartOpen, setCartOpen, setCheckoutOpen } = useCart();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isDesktop || !isCartOpen) return;
    setCartOpen(false);
    const panel = document.getElementById("cart-panel");
    panel?.animate(
      [{ boxShadow: "0 0 0 0 rgba(200,32,38,0.5)" }, { boxShadow: "0 0 0 8px rgba(200,32,38,0)" }],
      { duration: 700 }
    );
  }, [isDesktop, isCartOpen, setCartOpen]);

  const open = isCartOpen && !isDesktop;
  useOverlay(open, () => setCartOpen(false));

  return (
    <AnimatePresence>
      {open && [
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/50"
        />,
        <motion.div
          key="panel"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[28px] bg-card"
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-edge" aria-hidden="true" />
          <CartHeader onClose={() => setCartOpen(false)} />
          {items.length === 0 ? (
            <CartEmpty />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-5">
                <CartLines />
              </div>
              <div className="border-t border-edge px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <CartSummary
                  onCheckout={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                />
              </div>
            </>
          )}
        </motion.div>,
      ]}
    </AnimatePresence>
  );
}
