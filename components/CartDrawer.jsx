"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";
import { useVisualViewportHeight } from "@/lib/useVisualViewportHeight";
import { useOverlay } from "@/lib/useOverlay";

// The cart, at every width: a full slide-up sheet on a phone, a compact
// flyout anchored bottom-right from `sm:` up. It used to hide itself at
// `lg:` on the assumption that CartSidebar would take over as a permanent
// column there — CartSidebar was never wired into the page, so the cart
// icon in the desktop header opened nothing, and checkout was unreachable
// above 1024px. This is the one place `setCheckoutOpen(true)` was still
// reachable from, so it now renders everywhere instead.
export default function CartDrawer() {
  const { lang, t } = useLang();
  const viewportHeight = useVisualViewportHeight();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    setQty,
    removeItem,
    isCartOpen,
    setCartOpen,
    setCheckoutOpen,
  } = useCart();

  useOverlay(isCartOpen, () => setCartOpen(false));

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [listMaxHeight, setListMaxHeight] = useState(null);

  // Same reasoning as CheckoutModal: flex-1/min-h-0 shrink math didn't
  // reliably constrain height on every mobile browser tested, clipping
  // the total/checkout footer away with no way to scroll to it. Measuring
  // header/footer in pixels and giving the item list an explicit
  // max-height sidesteps flexbox's shrink behavior entirely.
  useEffect(() => {
    if (!isCartOpen || !viewportHeight) return;
    const measure = () => {
      const panelMax = viewportHeight * 0.85;
      const headerH = headerRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setListMaxHeight(Math.max(120, Math.round(panelMax - headerH - footerH)));
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [isCartOpen, viewportHeight, items.length]);

  return (
    <AnimatePresence>
      {isCartOpen && [
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-cocoa/60 backdrop-blur-sm"
          />,
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="cart-drawer-panel fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border border-edge bg-card shadow-lift sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[380px] sm:rounded-2xl"
            style={viewportHeight ? { maxHeight: Math.round(viewportHeight * 0.85) } : undefined}
          >
            <div
              ref={headerRef}
              className="flex shrink-0 items-center justify-between border-b border-edge/70 px-5 py-4"
            >
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-body">
                🧺 {t("cart_title")}
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-muted">
                    ({itemCount} {t("cart_items_count")})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="cart-drawer-list overflow-y-auto px-5 py-3"
              style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
            >
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="text-4xl">🍽️</span>
                  <p className="font-medium text-body">{t("cart_empty")}</p>
                  <p className="text-sm text-muted">{t("cart_empty_hint")}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-paper text-xl">
                        🍽️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.85rem] font-medium text-body">
                          {localized(it.name, lang)}
                        </p>
                        <p className="text-[0.78rem] text-brand">{it.price} ₽</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-edge px-1 py-1">
                        <button
                          onClick={() => setQty(it.id, it.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-brand hover:bg-brand/10 active:scale-90"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-[1rem] text-center text-[0.78rem] font-semibold text-body">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => setQty(it.id, it.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-brand hover:bg-brand/10 active:scale-90"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="ml-1 text-muted/60 hover:text-brand"
                        aria-label="remove"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div ref={footerRef} className="shrink-0 border-t border-edge/70 px-5 py-4">
                <div className="flex justify-between text-[0.82rem] text-muted">
                  <span>{t("cart_subtotal")}</span>
                  <span>{subtotal} ₽</span>
                </div>
                <div className="mt-1 flex justify-between text-[0.82rem] text-muted">
                  <span>{t("cart_delivery")}</span>
                  <span>{deliveryFee === 0 ? "—" : `${deliveryFee} ₽`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="mt-1 text-[0.68rem] text-muted/70">
                    {t("cart_delivery_free_hint")}
                  </p>
                )}
                <div className="mt-2 flex justify-between text-base font-semibold text-body">
                  <span>{t("cart_total")}</span>
                  <span className="text-brand">{total} ₽</span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                >
                  {t("cart_checkout")}
                </button>
              </div>
            )}
          </motion.div>,
      ]}
      <style jsx global>{`
        /* Fallbacks for the brief moment before JS measures (or if JS is
           disabled) — same vh/dvh reasoning as elsewhere in this file. */
        .cart-drawer-panel {
          max-height: 85vh;
        }
        .cart-drawer-list {
          max-height: 60vh;
        }
        @media (min-width: 640px) {
          .cart-drawer-panel {
            max-height: 80vh;
          }
        }
        @supports (height: 100dvh) {
          .cart-drawer-panel {
            max-height: 85dvh;
          }
          .cart-drawer-list {
            max-height: 60dvh;
          }
          @media (min-width: 640px) {
            .cart-drawer-panel {
              max-height: 80dvh;
            }
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
