"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Minus, Search, Clock, Percent, ShoppingBag } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

// Direction B — the ordering flow of a delivery app: pinned categories,
// tiles you tap once to add, a promo strip, a free-delivery progress bar
// and a persistent cart bar.
export default function PreviewB() {
  const { lang, t } = useLang();
  const { categories } = useMenu();
  const { itemCount, subtotal, total, freeDeliveryFrom, setCheckoutOpen } = useCart();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const sectionRefs = useRef({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => localized(i.name, lang).toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length);
  }, [categories, query, lang]);

  const toFreeDelivery = Math.max(0, freeDeliveryFrom - subtotal);
  const freeProgress = Math.min(100, (subtotal / freeDeliveryFrom) * 100);

  function jumpTo(catId) {
    setActiveCat(catId);
    const el = sectionRefs.current[catId];
    if (el) window.scrollTo({ top: el.offsetTop - 132, behavior: "smooth" });
  }

  return (
    <main className={itemCount > 0 ? "pb-28" : "pb-10"}>
      {/* Search + delivery facts */}
      <div className="px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
            <Search size={17} className="shrink-0 text-parchment-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Плов, лагман, самса…"
              className="w-full bg-transparent text-sm text-parchment placeholder:text-parchment-soft focus:outline-none"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <Fact icon={Clock}>30–45 мин</Fact>
            <Fact icon={ShoppingBag}>Доставка 100 ₽</Fact>
            <Fact icon={Percent}>Бесплатно от {freeDeliveryFrom} ₽</Fact>
          </div>

          {/* Promo strip — the promo/coupon feature this design will host */}
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            <PromoCard
              title="−20% на первый заказ"
              body="Промокод RAYHAN20 при оформлении"
              tone="gold"
            />
            <PromoCard
              title="Плов + лепёшка"
              body="Комбо дня за 590 ₽"
              tone="red"
            />
          </div>
        </div>
      </div>

      {/* Pinned category rail */}
      <nav className="sticky top-[44px] z-30 mt-4 border-b border-white/[0.06] bg-night/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => jumpTo(c.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.78rem] font-medium transition-colors ${
                activeCat === c.id
                  ? "bg-gold text-night"
                  : "bg-surface text-parchment-soft hover:text-parchment"
              }`}
            >
              <span>{CATEGORY_EMOJI[c.id] || "🍽️"}</span>
              {localized(c.title, lang)}
            </button>
          ))}
        </div>
      </nav>

      {categories.length === 0 && (
        <p className="px-4 py-16 text-center text-sm text-parchment-soft">
          Меню не загрузилось — проверьте подключение к базе.
        </p>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {filtered.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => (sectionRefs.current[cat.id] = el)}
            className="pt-7"
          >
            <h2 className="mb-3 text-lg font-semibold text-parchment sm:text-xl">
              {localized(cat.title, lang)}
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cat.items.map((item) => (
                <Tile key={item.id} item={item} categoryId={cat.id} lang={lang} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Cart bar with free-delivery progress */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto max-w-5xl">
            {toFreeDelivery > 0 ? (
              <>
                <p className="mb-1.5 text-[0.72rem] text-parchment-soft">
                  Ещё <span className="font-semibold text-gold">{toFreeDelivery} ₽</span> до
                  бесплатной доставки
                </p>
                <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${freeProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mb-2.5 text-[0.72rem] font-medium text-green-400">
                Доставим бесплатно ✓
              </p>
            )}

            <button
              onClick={() => setCheckoutOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night transition-transform active:scale-[0.99]"
            >
              <span>Оформить заказ</span>
              <span>{total} ₽</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Fact({ icon: Icon, children }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[0.72rem] text-parchment-soft">
      <Icon size={13} className="text-gold" />
      {children}
    </span>
  );
}

function PromoCard({ title, body, tone }) {
  const tones = {
    gold: "from-gold/25 to-gold/5 border-gold/30",
    red: "from-terracotta/25 to-terracotta/5 border-terracotta/30",
  };
  return (
    <div
      className={`w-[15rem] shrink-0 rounded-2xl border bg-gradient-to-br p-3.5 ${tones[tone]}`}
    >
      <p className="text-[0.85rem] font-semibold text-parchment">{title}</p>
      <p className="mt-0.5 text-[0.72rem] text-parchment-soft">{body}</p>
    </div>
  );
}

function Tile({ item, categoryId, lang, t }) {
  const { getQty, addItem, setQty } = useCart();
  const qty = getQty(item.id);
  const name = localized(item.name, lang);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface">
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-white/[0.06] to-transparent">
        <span className="text-4xl opacity-80">{CATEGORY_EMOJI[categoryId] || "🍽️"}</span>

        {item.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-terracotta px-2 py-0.5 text-[0.58rem] font-semibold text-white">
            {t("badge_popular")}
          </span>
        )}

        {qty === 0 ? (
          <button
            onClick={() => addItem(item.id)}
            aria-label={t("add_to_cart")}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-night shadow-lift transition-transform active:scale-90"
          >
            <Plus size={18} />
          </button>
        ) : (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-gold px-1 py-1 text-night">
            <button
              onClick={() => setQty(item.id, qty - 1)}
              aria-label="-"
              className="flex h-7 w-7 items-center justify-center rounded-full active:scale-90"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[1rem] text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty(item.id, qty + 1)}
              aria-label="+"
              className="flex h-7 w-7 items-center justify-center rounded-full active:scale-90"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[0.86rem] font-semibold leading-snug text-parchment">{name}</p>
        {item.weight && (
          <p className="text-[0.68rem] text-parchment-soft">{item.weight}</p>
        )}
        <p className="mt-auto pt-1 text-[0.95rem] font-bold text-gold">{item.price} ₽</p>
      </div>
    </div>
  );
}
