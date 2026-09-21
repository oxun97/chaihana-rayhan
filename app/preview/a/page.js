"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Phone } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

// Direction A — the menu as a printed page from an expensive restaurant.
// Dishes are set as typography with a leader line to the price, so the
// absence of real food photography reads as restraint rather than as a
// missing asset.
export default function PreviewA() {
  const { lang, t } = useLang();
  const { categories } = useMenu();
  const { setCheckoutOpen, itemCount, total } = useCart();
  const [activeCat, setActiveCat] = useState(null);

  const shown = useMemo(() => {
    if (!activeCat) return categories;
    return categories.filter((c) => c.id === activeCat);
  }, [categories, activeCat]);

  return (
    <main className="pb-28">
      {/* Hero — one strong typographic statement, no imagery */}
      <section className="relative overflow-hidden px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <Ornament className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 opacity-[0.07] sm:-right-4 sm:h-96 sm:w-96" />

        <div className="mx-auto max-w-4xl">
          <p className="text-[0.66rem] uppercase tracking-[0.34em] text-gold">
            Москва · с 2014 года
          </p>

          <h1 className="mt-5 font-serif text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-parchment sm:text-[4.6rem]">
            Чайхана
            <br />
            <span className="italic text-gold">Райхан</span>
          </h1>

          <div className="mt-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
            <span className="text-[0.62rem] uppercase tracking-[0.3em] text-parchment-soft">
              Меню
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-gold/60 to-transparent" />
          </div>

          <p className="mt-7 max-w-md font-serif text-lg italic leading-relaxed text-parchment-soft sm:text-xl">
            Плов на костре, тандырная самса и лагман ручной лепки — так, как готовили
            в Фергане.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.72rem] uppercase tracking-[0.18em] text-parchment-soft">
            <span>Ежедневно 11:00 — 23:00</span>
            <span className="text-gold">4.8 / 5</span>
            <a
              href={`tel:${RESTAURANT_PHONE_TEL}`}
              className="flex items-center gap-1.5 text-parchment transition-colors hover:text-gold"
            >
              <Phone size={13} className="text-gold" />
              {RESTAURANT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* Category filter — set as small caps, not chips */}
      <nav className="sticky top-[44px] z-30 border-y border-gold/15 bg-night/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl gap-6 overflow-x-auto px-5 py-3.5 sm:px-8">
          <FilterLink active={!activeCat} onClick={() => setActiveCat(null)}>
            Всё
          </FilterLink>
          {categories.map((c) => (
            <FilterLink
              key={c.id}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            >
              {localized(c.title, lang)}
            </FilterLink>
          ))}
        </div>
      </nav>

      {categories.length === 0 && (
        <p className="px-5 py-16 text-center text-sm text-parchment-soft">
          Меню не загрузилось — проверьте подключение к базе.
        </p>
      )}

      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {shown.map((cat, ci) => (
          <section key={cat.id} className="pt-14">
            <header className="mb-8 flex items-baseline gap-4">
              <span className="font-serif text-sm italic text-gold">
                {String(ci + 1).padStart(2, "0")}
              </span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
                {localized(cat.title, lang)}
              </h2>
              <span className="h-px flex-1 bg-gold/20" />
              <span className="text-[0.66rem] uppercase tracking-[0.2em] text-parchment-soft">
                {cat.items.length}
              </span>
            </header>

            <ul className="flex flex-col">
              {cat.items.map((item) => (
                <MenuLine key={item.id} item={item} lang={lang} t={t} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Order bar */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-night/95 px-5 py-3.5 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-parchment-soft">
                {itemCount} поз. в заказе
              </p>
              <p className="font-serif text-xl font-semibold text-gold">{total} ₽</p>
            </div>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="rounded-none border border-gold px-7 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-night"
            >
              Оформить
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function FilterLink({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border-b pb-0.5 text-[0.7rem] uppercase tracking-[0.2em] transition-colors ${
        active ? "border-gold text-gold" : "border-transparent text-parchment-soft hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}

// One dish as a line of a printed menu: name, leader rule, price.
function MenuLine({ item, lang, t }) {
  const { getQty, addItem, setQty } = useCart();
  const qty = getQty(item.id);
  const name = localized(item.name, lang);
  const desc = localized(item.desc, lang);

  return (
    <li className="group border-b border-white/[0.06] py-5 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <h3 className="font-serif text-[1.05rem] font-medium leading-snug text-parchment sm:text-[1.2rem]">
          {name}
        </h3>
        <span className="hidden h-px flex-1 translate-y-[-3px] bg-[repeating-linear-gradient(90deg,rgba(242,169,0,0.35)_0_2px,transparent_2px_7px)] sm:block" />
        <span className="ml-auto shrink-0 font-serif text-[1.05rem] text-gold sm:ml-0 sm:text-[1.2rem]">
          {item.price} ₽
        </span>
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-4">
        <p className="max-w-lg text-[0.82rem] leading-relaxed text-parchment-soft">
          {desc || " "}
          {item.weight && <span className="ml-2 text-parchment-soft/70">· {item.weight}</span>}
        </p>

        {qty === 0 ? (
          <button
            onClick={() => addItem(item.id)}
            className="shrink-0 border-b border-gold/40 pb-0.5 text-[0.66rem] uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold"
          >
            {t("add_to_cart")}
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-3 text-gold">
            <button onClick={() => setQty(item.id, qty - 1)} aria-label="-">
              <Minus size={14} />
            </button>
            <span className="font-serif text-base text-parchment">{qty}</span>
            <button onClick={() => setQty(item.id, qty + 1)} aria-label="+">
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

// Eight-point geometric star, the shape Uzbek tilework is built on.
function Ornament({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g stroke="#f2a900" strokeWidth="0.8" fill="none">
        <rect x="40" y="40" width="120" height="120" />
        <rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
        <circle cx="100" cy="100" r="84" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="30" />
      </g>
    </svg>
  );
}
