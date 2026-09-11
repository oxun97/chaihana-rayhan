"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, Minus, Plus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";
import IconBadge from "@/components/IconBadge";

export default function DishCard({ item, categoryId, index, domId }) {
  const { lang, t } = useLang();
  const { getQty, addItem, setQty } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [expanded, setExpanded] = useState(false);

  const name = localized(item.name, lang);
  const desc = localized(item.desc, lang);
  const qty = getQty(item.id);
  const favorite = isFavorite(item.id);
  const emoji = CATEGORY_EMOJI[categoryId] || "🍽️";

  return (
    <div
      id={domId || item.id}
      className="group flex scroll-mt-20 flex-col gap-2.5 rounded-[20px] bg-surface p-3 opacity-0 shadow-lift transition-all duration-300 [animation-fill-mode:forwards] hover:-translate-y-0.5 animate-fadeUp"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <div className="pattern-lattice-soft relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gradient-to-br from-night to-terracotta-dark/30">
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
            <div className="medallion flex h-14 w-14 items-center justify-center rounded-full bg-surface text-2xl transition-transform duration-500 group-hover:scale-110">
              {emoji}
            </div>
          </div>
        )}

        {item.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-terracotta px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wide text-white">
            {t("badge_popular")}
          </span>
        )}
        {item.price >= 3000 && (
          <span className="absolute left-2 bottom-2 rounded-full bg-night/85 px-2 py-0.5 text-[0.6rem] font-medium tracking-wide text-gold-light backdrop-blur-sm">
            {t("made_to_order_note")}
          </span>
        )}

        <button
          onClick={() => toggle(item.id)}
          aria-label="favorite"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-night/60 text-parchment backdrop-blur-sm transition-colors hover:text-terracotta"
        >
          <Heart size={14} fill={favorite ? "currentColor" : "none"} className={favorite ? "text-terracotta" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-serif text-[0.92rem] font-semibold leading-snug text-parchment">{name}</h3>
          <div className="flex gap-1">
            {(item.icons || []).map((ic) => (
              <IconBadge key={ic} icon={ic} />
            ))}
          </div>
        </div>

        {desc && (
          <div className="text-[0.78rem] leading-snug text-parchment-soft">
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
            {item.weight && <span className="text-[0.68rem] text-parchment-soft">{item.weight}</span>}
          </div>

          {qty === 0 ? (
            <button
              onClick={() => addItem(item.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-terracotta px-3.5 py-1.5 text-[0.75rem] font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            >
              <ShoppingBag size={13} /> {t("add_to_cart")}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-1 py-1">
              <button
                onClick={() => setQty(item.id, qty - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10 active:scale-90"
                aria-label="-"
              >
                <Minus size={12} />
              </button>
              <span className="min-w-[1.1rem] text-center text-[0.8rem] font-semibold text-parchment">
                {qty}
              </span>
              <button
                onClick={() => setQty(item.id, qty + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10 active:scale-90"
                aria-label="+"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
