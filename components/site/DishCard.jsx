"use client";

import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";
import { useDishModal } from "@/components/site/DishModal";

// Delivery-app card: square picture, price first, name, weight, one wide
// "Добавить" that turns into a stepper. The picture and the name open the
// full card (description and all) — the grid itself stays terse.
export default function DishCard({ item, categoryId, domId }) {
  const { lang, t } = useLang();
  const { getQty, addItem, setQty } = useCart();
  const { openDish } = useDishModal();
  const qty = getQty(item.id);
  const name = localized(item.name, lang);

  return (
    <article
      id={domId || item.id}
      className="group flex scroll-mt-36 flex-col rounded-[24px] bg-card-sunken p-2 transition-shadow duration-300 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)]"
    >
      <button
        onClick={() => openDish(item.id)}
        aria-label={name}
        className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-card"
      >
        {item.imgSrc ? (
          <Image
            src={item.imgSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 30vw, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[3.2rem] transition-transform duration-500 group-hover:scale-110">
            {CATEGORY_EMOJI[categoryId || item.categoryId] || "🍽️"}
          </span>
        )}
        {item.featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-saffron px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide text-[#21201F]">
            {t("badge_hit")}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-1.5 pb-0.5 pt-2.5">
        <span className="text-[1.08rem] font-bold leading-tight text-body">{item.price} ₽</span>
        <button
          onClick={() => openDish(item.id)}
          className="mt-1 line-clamp-2 text-left text-[0.88rem] leading-snug text-body hover:text-brand"
        >
          {name}
        </button>
        {item.weight && <span className="mt-0.5 text-[0.78rem] text-muted">{item.weight}</span>}

        <div className="mt-auto pt-3">
          {qty === 0 ? (
            <button
              onClick={() => addItem(item.id)}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-card text-[0.88rem] font-semibold text-body transition-all hover:shadow-sm active:scale-[0.97]"
            >
              <Plus size={17} />
              {t("dish_add")}
            </button>
          ) : (
            <div className="flex h-11 w-full items-center justify-between rounded-2xl bg-brand px-1 text-white">
              <button
                onClick={() => setQty(item.id, qty - 1)}
                aria-label="−"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/15 active:scale-90"
              >
                <Minus size={17} />
              </button>
              <span className="text-[0.95rem] font-bold">{qty}</span>
              <button
                onClick={() => setQty(item.id, qty + 1)}
                aria-label="+"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/15 active:scale-90"
              >
                <Plus size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
