"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Truck, Check, ShoppingBag } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

// Shared by the desktop cart column and the phone cart sheet, so the two
// never drift apart.

export function CartEmpty() {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card-sunken text-muted">
        <ShoppingBag size={26} />
      </span>
      <p className="mt-2 font-semibold text-body">{t("cart_empty")}</p>
      <p className="text-[0.85rem] text-muted">{t("cart_empty_hint")}</p>
    </div>
  );
}

export function CartLines() {
  const { lang } = useLang();
  const { items, setQty } = useCart();

  return (
    <ul className="flex flex-col">
      {items.map((it) => {
        const name = localized(it.name, lang);
        return (
          <li key={it.id} className="flex items-center gap-3 border-b border-edge py-3 last:border-b-0">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-card-sunken">
              {it.imgSrc ? (
                <Image src={it.imgSrc} alt={name} fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl">
                  {CATEGORY_EMOJI[it.categoryId] || "🍽️"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[0.88rem] leading-snug text-body">{name}</p>
              <p className="mt-0.5 text-[0.88rem] font-semibold text-body">{it.price * it.qty} ₽</p>
            </div>
            <div className="flex shrink-0 items-center rounded-xl bg-card-sunken">
              <button
                onClick={() => setQty(it.id, it.qty - 1)}
                aria-label="−"
                className="flex h-10 w-9 items-center justify-center rounded-xl text-body active:scale-90"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-[1.2rem] text-center text-[0.88rem] font-semibold text-body">{it.qty}</span>
              <button
                onClick={() => setQty(it.id, it.qty + 1)}
                aria-label="+"
                className="flex h-10 w-9 items-center justify-center rounded-xl text-body active:scale-90"
              >
                <Plus size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Where the basket stands against the two delivery thresholds: the
// minimum for delivery at all, then free delivery.
function DeliveryProgress() {
  const { t } = useLang();
  const { subtotal, minDeliveryOrder: minOrder, freeDeliveryFrom: freeFrom } = useCart();
  const belowMin = subtotal < minOrder;
  const target = belowMin ? minOrder : freeFrom;
  const done = subtotal >= freeFrom;
  const pct = Math.min(100, Math.round((subtotal / target) * 100));

  return (
    <div className="rounded-2xl bg-card-sunken px-3.5 py-3">
      <p className="flex items-center gap-2 text-[0.82rem] text-body">
        {done ? <Check size={15} className="shrink-0 text-herb" /> : <Truck size={15} className="shrink-0 text-muted" />}
        {done ? (
          t("cart_free_reached")
        ) : (
          <span>
            {belowMin ? t("cart_min_left") : t("cart_free_left")}{" "}
            <span className="font-semibold">{target - subtotal} ₽</span>
          </span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-edge">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-herb" : belowMin ? "bg-brand" : "bg-saffron"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {belowMin && <p className="mt-2 text-[0.74rem] text-muted">{t("cart_min_pickup_note")}</p>}
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
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-herb/10 px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-[0.84rem] font-semibold text-herb">
          <Check size={15} />
          {promo.code} · −{promo.discount} ₽
        </span>
        <button
          onClick={removePromo}
          aria-label={t("promo_remove")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-body"
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
          className="h-11 w-full rounded-xl bg-card-sunken px-3.5 text-[0.86rem] uppercase text-body outline-none transition-shadow placeholder:normal-case placeholder:text-muted focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="h-11 shrink-0 rounded-xl bg-card-sunken px-4 text-[0.84rem] font-semibold text-body transition-colors hover:text-brand disabled:opacity-50"
        >
          {t("promo_apply")}
        </button>
      </form>
      {error && <p className="mt-1.5 text-[0.78rem] text-brand">{error}</p>}
    </div>
  );
}

export function CartSummary({ onCheckout }) {
  const { t } = useLang();
  const { subtotal, deliveryFee, total, discount } = useCart();

  return (
    <div className="flex flex-col gap-3">
      <DeliveryProgress />
      <PromoField />

      <div className="flex flex-col gap-1.5 text-[0.86rem]">
        <div className="flex justify-between text-muted">
          <span>{t("cart_subtotal")}</span>
          <span>{subtotal} ₽</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-herb">
            <span>{t("promo_discount")}</span>
            <span>−{discount} ₽</span>
          </div>
        )}
        <div className="flex justify-between text-muted">
          <span>{t("cart_delivery")}</span>
          <span>{deliveryFee === 0 ? t("cart_delivery_free") : `${deliveryFee} ₽`}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="flex h-[3.4rem] w-full items-center justify-between rounded-2xl bg-brand px-5 text-[0.98rem] font-semibold text-white transition-transform active:scale-[0.98]"
      >
        <span>{t("cart_checkout")}</span>
        <span>{Math.max(0, total - discount)} ₽</span>
      </button>
    </div>
  );
}
