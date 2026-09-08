"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";

export default function CartDrawer() {
  const { lang, t } = useLang();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryFrom,
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-lift sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
                🧺 {t("cart_title")}
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-ink-soft">
                    ({itemCount} {t("cart_items_count")})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-cream"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="text-4xl">🍽️</span>
                  <p className="font-medium text-ink">{t("cart_empty")}</p>
                  <p className="text-sm text-ink-soft">{t("cart_empty_hint")}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cream text-xl">
                        🍽️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.85rem] font-medium text-ink">
                          {localized(it.name, lang)}
                        </p>
                        <p className="text-[0.78rem] text-gold">{it.price} ₽</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-gold/40 px-1 py-1">
                        <button
                          onClick={() => setQty(it.id, it.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                        >
                          −
                        </button>
                        <span className="min-w-[1rem] text-center text-[0.78rem] font-semibold">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => setQty(it.id, it.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="ml-1 text-ink-soft/60 hover:text-red-400"
                        aria-label="remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gold/10 px-5 py-4">
                <div className="flex justify-between text-[0.82rem] text-ink-soft">
                  <span>{t("cart_subtotal")}</span>
                  <span>{subtotal} ₽</span>
                </div>
                <div className="mt-1 flex justify-between text-[0.82rem] text-ink-soft">
                  <span>{t("cart_delivery")}</span>
                  <span>{deliveryFee === 0 ? "—" : `${deliveryFee} ₽`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="mt-1 text-[0.68rem] text-ink-soft/70">
                    {t("cart_delivery_free_hint")}
                  </p>
                )}
                <div className="mt-2 flex justify-between text-base font-semibold text-ink">
                  <span>{t("cart_total")}</span>
                  <span className="text-gold">{total} ₽</span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="mt-4 w-full rounded-full bg-gold py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-dark hover:text-white active:scale-[0.98]"
                >
                  {t("cart_checkout")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
