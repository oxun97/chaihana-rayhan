"use client";

import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

// Card per the brief: photo, name, description, price, round add button,
// 20px radius, soft shadow, image scales on hover. Until a dish has a real
// photo the frame shows a tiled ornament instead of a grey box, so a
// photo-less menu still looks deliberate.
export default function DishCard({ item, categoryId, domId, compact = false }) {
  const { lang, t } = useLang();
  const { getQty, addItem, setQty } = useCart();
  const qty = getQty(item.id);
  const name = localized(item.name, lang);
  const desc = localized(item.desc, lang);

  return (
    <article
      id={domId || item.id}
      className="group flex scroll-mt-28 flex-col overflow-hidden rounded-[20px] border border-edge/70 bg-card shadow-[0_2px_14px_-6px_rgba(36,20,13,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(36,20,13,0.35)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-card-sunken">
        {item.imgSrc ? (
          <Image
            src={item.imgSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
        ) : (
          <div className="pattern-lattice-soft flex h-full w-full items-center justify-center">
            <span className="text-3xl opacity-70">{CATEGORY_EMOJI[categoryId] || "🍽️"}</span>
          </div>
        )}

        {item.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-saffron px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-cocoa">
            {t("badge_hit")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-snug text-body">{name}</h3>

        {desc && !compact && (
          <p className="desc-clamp text-[0.8rem] leading-relaxed text-muted">{desc}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-col">
            <span className="text-[1.05rem] font-bold text-body">{item.price} ₽</span>
            {item.weight && <span className="text-[0.68rem] text-muted">{item.weight}</span>}
          </div>

          {qty === 0 ? (
            <button
              onClick={() => addItem(item.id)}
              aria-label={t("add_to_cart")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform hover:scale-110 active:scale-90"
            >
              <Plus size={20} />
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand p-1 text-white">
              <button
                onClick={() => setQty(item.id, qty - 1)}
                aria-label="−"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[1.1rem] text-center text-sm font-bold">{qty}</span>
              <button
                onClick={() => setQty(item.id, qty + 1)}
                aria-label="+"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-90"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
