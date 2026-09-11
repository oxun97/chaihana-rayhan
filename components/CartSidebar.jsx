"use client";

import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";

// Persistent cart column for desktop (lg+) — the mobile equivalent is the
// slide-up CartDrawer, which stays hidden at this breakpoint (see there).
export default function CartSidebar() {
  const { lang, t } = useLang();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    setQty,
    removeItem,
    setCheckoutOpen,
  } = useCart();

  return (
    <aside
      id="cart-sidebar"
      className="sticky top-24 hidden h-fit w-[320px] shrink-0 scroll-mt-24 rounded-2xl border border-gold/15 bg-surface/90 p-5 shadow-lift backdrop-blur-md lg:block"
    >
      <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-parchment">
        <ShoppingBag size={18} className="text-gold" /> {t("cart_title")}
        {itemCount > 0 && (
          <span className="text-sm font-normal text-parchment-soft">
            ({itemCount} {t("cart_items_count")})
          </span>
        )}
      </h3>

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-3xl">🍽️</span>
          <p className="text-sm font-medium text-parchment">{t("cart_empty")}</p>
          <p className="text-xs text-parchment-soft">{t("cart_empty_hint")}</p>
        </div>
      ) : (
        <ul className="mt-4 flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.82rem] font-medium text-parchment">
                  {localized(it.name, lang)}
                </p>
                <p className="text-[0.76rem] text-gold">
                  {it.qty} × {it.price} ₽
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 px-1 py-1">
                <button
                  onClick={() => setQty(it.id, it.qty - 1)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                >
                  <Minus size={11} />
                </button>
                <span className="min-w-[0.9rem] text-center text-[0.74rem] font-semibold text-parchment">
                  {it.qty}
                </span>
                <button
                  onClick={() => setQty(it.id, it.qty + 1)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-gold hover:bg-gold/10 active:scale-90"
                >
                  <Plus size={11} />
                </button>
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="shrink-0 text-parchment-soft/60 hover:text-terracotta"
                aria-label="remove"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-4 border-t border-gold/10 pt-4">
          <div className="flex justify-between text-[0.8rem] text-parchment-soft">
            <span>{t("cart_subtotal")}</span>
            <span>{subtotal} ₽</span>
          </div>
          <div className="mt-1 flex justify-between text-[0.8rem] text-parchment-soft">
            <span>{t("cart_delivery")}</span>
            <span>{deliveryFee === 0 ? "—" : `${deliveryFee} ₽`}</span>
          </div>
          {deliveryFee > 0 && (
            <p className="mt-1 text-[0.66rem] text-parchment-soft/70">{t("cart_delivery_free_hint")}</p>
          )}
          <div className="mt-2 flex justify-between text-base font-semibold text-parchment">
            <span>{t("cart_total")}</span>
            <span className="text-gold">{total} ₽</span>
          </div>

          <button
            onClick={() => setCheckoutOpen(true)}
            className="mt-4 w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
          >
            {t("cart_checkout")} →
          </button>
        </div>
      )}
    </aside>
  );
}
