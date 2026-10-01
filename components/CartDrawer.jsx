"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, Truck, Check } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";
import { useVisualViewportHeight } from "@/lib/useVisualViewportHeight";
import { useOverlay } from "@/lib/useOverlay";

// Where the basket stands against the two delivery thresholds: the
// minimum for delivery at all, then free delivery. Told up front here
// rather than as an error two steps into checkout.
function DeliveryProgress({ subtotal, minOrder, freeFrom }) {
  const { t } = useLang();
  const belowMin = subtotal < minOrder;
  const target = belowMin ? minOrder : freeFrom;
  const done = subtotal >= freeFrom;
  const pct = Math.min(100, Math.round((subtotal / target) * 100));

  return (
    <div className="rounded-xl bg-card-sunken/70 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[0.78rem] text-body">
        {done ? <Check size={14} className="shrink-0 text-herb" /> : <Truck size={14} className="shrink-0 text-brand" />}
        {done ? (
          t("cart_free_reached")
        ) : (
          <span>
            {belowMin ? t("cart_min_left") : t("cart_free_left")}{" "}
            <span className="font-semibold">{target - subtotal} ₽</span>
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-edge/70">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-herb" : belowMin ? "bg-brand" : "bg-saffron"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {belowMin && <p className="mt-1.5 text-[0.7rem] text-muted">{t("cart_min_pickup_note")}</p>}
    </div>
  );
}

function PromoField() {
  const { t } = useLang();
  const { promo, applyPromo, removePromo } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function apply() {
    setError("");
    setChecking(true);
    try {
      const data = await applyPromo(code.trim());
      if (!data.valid) {
        const reasons = {
          expired: t("promo_expired"),
          exhausted: t("promo_exhausted"),
          min_subtotal: `${t("promo_min_subtotal")} ${data.min_subtotal} ₽`,
        };
        setError(reasons[data.reason] || t("promo_invalid"));
      } else {
        setCode("");
      }
    } catch (e) {
      setError(t("promo_invalid"));
    } finally {
      setChecking(false);
    }
  }

  if (promo) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-herb/30 bg-herb/5 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-herb">
          <Check size={14} />
          {promo.code} · −{promo.discount} ₽
        </span>
        <button
          onClick={removePromo}
          aria-label={t("promo_remove")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-brand"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) apply();
        }}
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder={t("promo_placeholder")}
          className="min-h-[40px] w-full rounded-xl border border-edge bg-card px-3 text-[0.82rem] uppercase text-body outline-none transition-colors placeholder:normal-case placeholder:text-muted focus:border-brand"
        />
        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="min-h-[40px] shrink-0 rounded-xl bg-card-sunken px-3.5 text-[0.78rem] font-semibold text-body transition-colors hover:text-brand disabled:opacity-50"
        >
          {t("promo_apply")}
        </button>
      </form>
      {error && <p className="mt-1.5 text-[0.75rem] text-brand">{error}</p>}
    </div>
  );
}

// The cart, at every width: a full slide-up sheet on a phone, a compact
// flyout anchored bottom-right from `sm:` up. It is step 1 of checkout —
// the checkout modal picks up at "Доставка" — so the promo code lives here
// and the basket is never shown twice.
export default function CartDrawer() {
  const { lang, t } = useLang();
  const viewportHeight = useVisualViewportHeight();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    discount,
    minDeliveryOrder,
    freeDeliveryFrom,
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
      const panelMax = viewportHeight * 0.88;
      const headerH = headerRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setListMaxHeight(Math.max(120, Math.round(panelMax - headerH - footerH)));
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [isCartOpen, viewportHeight, items.length, subtotal, discount]);

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
            className="cart-drawer-panel fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border border-edge bg-card shadow-lift sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:rounded-2xl"
            style={viewportHeight ? { maxHeight: Math.round(viewportHeight * 0.88) } : undefined}
          >
            <div
              ref={headerRef}
              className="flex shrink-0 items-center justify-between border-b border-edge/70 px-5 py-4"
            >
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-body">
                {t("cart_title")}
                {itemCount > 0 && (
                  <span className="font-sans text-sm font-normal text-muted">
                    ({itemCount} {t("cart_items_count")})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                aria-label={t("close")}
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-sunken hover:text-body"
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
                  {items.map((it) => {
                    const name = localized(it.name, lang);
                    return (
                      <li key={it.id} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-card-sunken">
                          {it.imgSrc ? (
                            <Image src={it.imgSrc} alt={name} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="pattern-lattice-soft flex h-full w-full items-center justify-center text-xl">
                              {CATEGORY_EMOJI[it.categoryId] || "🍽️"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.86rem] font-medium text-body">{name}</p>
                          <p className="text-[0.8rem] font-semibold text-body">{it.price * it.qty} ₽</p>
                        </div>
                        <div className="flex items-center gap-0.5 rounded-full border border-edge p-0.5">
                          <button
                            onClick={() => setQty(it.id, it.qty - 1)}
                            aria-label="−"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-brand hover:bg-brand/10 active:scale-90"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-[1.1rem] text-center text-[0.8rem] font-semibold text-body">
                            {it.qty}
                          </span>
                          <button
                            onClick={() => setQty(it.id, it.qty + 1)}
                            aria-label="+"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-brand hover:bg-brand/10 active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(it.id)}
                          aria-label={t("cart_remove")}
                          className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-muted/70 transition-colors hover:text-brand"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div ref={footerRef} className="flex shrink-0 flex-col gap-3 border-t border-edge/70 px-5 pb-5 pt-4">
                <DeliveryProgress subtotal={subtotal} minOrder={minDeliveryOrder} freeFrom={freeDeliveryFrom} />
                <PromoField />

                <div className="flex flex-col gap-1 text-[0.82rem] text-muted">
                  <div className="flex justify-between">
                    <span>{t("cart_subtotal")}</span>
                    <span>{subtotal} ₽</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-herb">
                      <span>{t("promo_discount")}</span>
                      <span>−{discount} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("cart_delivery")}</span>
                    <span>{deliveryFee === 0 ? t("cart_delivery_free") : `${deliveryFee} ₽`}</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold text-body">{t("cart_total")}</span>
                  <span className="font-serif text-xl font-bold text-body">{Math.max(0, total - discount)} ₽</span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full rounded-full bg-brand py-3.5 text-[0.92rem] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
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
          max-height: 88vh;
        }
        .cart-drawer-list {
          max-height: 50vh;
        }
        @supports (height: 100dvh) {
          .cart-drawer-panel {
            max-height: 88dvh;
          }
          .cart-drawer-list {
            max-height: 50dvh;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
