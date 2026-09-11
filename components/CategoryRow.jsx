"use client";

import Image from "next/image";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

function scrollToCategory(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function CategoryRow() {
  const { lang } = useLang();
  const { categories } = useMenu();

  if (!categories.length) return null;

  return (
    <div className="border-b border-gold/10 bg-night py-6">
      <div className="no-scrollbar mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 sm:px-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className="group flex shrink-0 flex-col items-center gap-2"
          >
            <span className="medallion flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full bg-surface text-2xl transition-transform duration-300 group-hover:scale-105 sm:h-[90px] sm:w-[90px]">
              {cat.imageSrc ? (
                <Image
                  src={cat.imageSrc}
                  alt={localized(cat.title, lang)}
                  width={90}
                  height={90}
                  className="h-full w-full object-cover"
                />
              ) : (
                CATEGORY_EMOJI[cat.id] || "🍽️"
              )}
            </span>
            <span className="max-w-[80px] truncate text-xs font-medium text-parchment-soft group-hover:text-gold">
              {localized(cat.title, lang)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
