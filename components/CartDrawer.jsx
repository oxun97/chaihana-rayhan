"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";

// The mobile/tablet cart — a slide-up sheet. Hidden at lg+, where
// CartSidebar shows the cart permanently in the page layout instead.
export default function CartDrawer() {
  const { lang, t } = useLang();
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

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-night/70 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="cart-drawer-panel fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border border-gold/15 bg-surface shadow-lift sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[380px] sm:rounded-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-parchment">
                🧺 {t("cart_title")}
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-parchment-soft">
                    ({itemCount} {t("cart_items_count")})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-parchment-soft hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="text-4xl">🍽️</span>
                  <p className="font-medium text-parchment">{t("cart_empty")}</p>
                  <p className="text-sm text-parchment-soft">{t("cart_empty_hint")}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-night text-xl">
                        🍽️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.85rem] font-medium text-parchment">
                          {localized(it.name, lang)}
                        </p>
                        <p className="text-[0.78rem] text-gold">{it.price} ₽</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-gold/40 px-1 py-1">
                        <button
                          onClick={() => setQty(it.id, it.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-[1rem] text-center text-[0.78rem] font-semibold text-parchment">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => setQty(it.id, it.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="ml-1 text-parchment-soft/60 hover:text-terracotta"
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
              <div className="border-t border-gold/10 px-5 py-4">
                <div className="flex justify-between text-[0.82rem] text-parchment-soft">
                  <span>{t("cart_subtotal")}</span>
                  <span>{subtotal} ₽</span>
                </div>
                <div className="mt-1 flex justify-between text-[0.82rem] text-parchment-soft">
                  <span>{t("cart_delivery")}</span>
                  <span>{deliveryFee === 0 ? "—" : `${deliveryFee} ₽`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="mt-1 text-[0.68rem] text-parchment-soft/70">
                    {t("cart_delivery_free_hint")}
                  </p>
                )}
                <div className="mt-2 flex justify-between text-base font-semibold text-parchment">
                  <span>{t("cart_total")}</span>
                  <span className="text-gold">{total} ₽</span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="mt-4 w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                >
                  {t("cart_checkout")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
      <style jsx global>{`
        /* vh is computed against the layout viewport, which on mobile can
           be taller than what's actually visible with the address bar
           showing. dvh tracks the real visible viewport; vh stays as a
           fallback for browsers that don't support dvh yet. */
        .cart-drawer-panel {
          max-height: 85vh;
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
