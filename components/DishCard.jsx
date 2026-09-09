"use client";

import { useState } from "react";
import Image from "next/image";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized } from "@/lib/menu";
import IconBadge from "@/components/IconBadge";

const CATEGORY_EMOJI = {
  salaty: "🥗",
  zakuski: "🫒",
  supy: "🍲",
  goryachie: "🍛",
  shashlyki: "🍢",
  "blyuda-na-zakaz": "🍚",
  garniry: "🍟",
  sousy: "🥣",
  deserty: "🍰",
  "kholodnye-napitki": "🥤",
};

// Per-dish overrides for a more accurate visual than the generic category icon.
const NAME_EMOJI = {
  "Картофель фри": "🍟",
  "Картофельное пюре": "🥔",
  "Гречка": "🌾",
  "Рис": "🍚",
  "Макароны": "🍝",
  "Сметана": "🥣",
  "Наршараб": "🍇",
  "Томатный": "🍅",
  "Кетчуп": "🍅",
  "Чесночный": "🧄",
  "Медовик": "🍰",
  "Наполеон": "🍰",
  "Красный бархат": "🍰",
  "Сникерс": "🍫",
  "Чизкейк холодный": "🍮",
  "Кока-кола": "🥤",
  "Фанта": "🥤",
  "RC кола": "🥤",
  "Сок “Добрый”": "🧃",
  "Холодный чай": "🧊",
  "Натахтари (Дюшес / Тархун)": "🥤",
  "Бон-акуа (c газом / без газа)": "💧",
  "Султан чай": "🍵",
  "Манты": "🥟",
  "Пельмени Чучвара": "🥟",
  "Форель на мангале": "🐟",
  "Дорадо на углях": "🐟",
  "Сибас на мангале": "🐟",
  "Овощи на мангале": "🍆",
  "Шампиньоны на углях": "🍄",
};

export default function DishCard({ item, categoryId, index }) {
  const { lang, t } = useLang();
  const { getQty, addItem, setQty } = useCart();
  const [expanded, setExpanded] = useState(false);

  const name = localized(item.name, lang);
  const desc = localized(item.desc, lang);
  const qty = getQty(item.id);
  const emoji = NAME_EMOJI[item.name.ru] || CATEGORY_EMOJI[categoryId] || "🍽️";

  return (
    <div
      className="group flex flex-col gap-2.5 rounded-2xl border-t-2 border-t-gold/50 bg-white p-3 opacity-0 shadow-soft transition-all duration-300 [animation-fill-mode:forwards] hover:-translate-y-0.5 hover:shadow-card animate-fadeUp"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <div className="pattern-lattice-soft relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gradient-to-br from-cream to-gold-light/20">
        {item.imgSrc ? (
          <Image
            src={item.imgSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="medallion flex h-14 w-14 items-center justify-center rounded-full bg-cream text-2xl transition-transform duration-500 group-hover:scale-110">
              {emoji}
            </div>
          </div>
        )}
        {item.price >= 3000 && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[0.62rem] font-medium tracking-wide text-gold-light backdrop-blur-sm">
            {t("made_to_order_note")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-serif text-[0.92rem] font-semibold leading-snug text-ink">{name}</h3>
          <div className="flex gap-0.5 text-[0.8rem]">
            {(item.icons || []).map((ic) => (
              <IconBadge key={ic} icon={ic} />
            ))}
          </div>
        </div>

        {desc && (
          <div className="text-[0.78rem] leading-snug text-ink-soft">
            <span className={expanded ? "" : "desc-clamp"}>{desc}</span>
            {desc.length > 60 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 font-medium text-gold hover:underline"
              >
                {expanded ? t("dish_show_less") : t("dish_show_more")}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-gold">{item.price} ₽</span>
            {item.weight && <span className="text-[0.68rem] text-ink-soft">{item.weight}</span>}
          </div>

          {qty === 0 ? (
            <button
              onClick={() => addItem(item.id)}
              className="shrink-0 rounded-full bg-gold px-3.5 py-1.5 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-gold-dark hover:text-white active:scale-95"
            >
              {t("add_to_cart")}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-1 py-1">
              <button
                onClick={() => setQty(item.id, qty - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10 active:scale-90"
                aria-label="-"
              >
                −
              </button>
              <span className="min-w-[1.1rem] text-center text-[0.8rem] font-semibold text-ink">
                {qty}
              </span>
              <button
                onClick={() => setQty(item.id, qty + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10 active:scale-90"
                aria-label="+"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
