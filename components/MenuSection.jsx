"use client";

import Image from "next/image";
import { useLang } from "@/context/LangContext";
import { localized } from "@/lib/menu";
import DishCard from "@/components/DishCard";

// Deterministic accent per category so sections feel distinct even before
// real cover photos are uploaded, while staying inside the brand palette.
const ACCENTS = [
  "from-night via-night to-gold-dark/60",
  "from-night via-night to-teal-dark",
  "from-night via-night to-terracotta-dark/70",
];

function accentFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

export default function MenuSection({ category }) {
  const { lang, t } = useLang();
  const title = localized(category.title, lang);

  return (
    <section id={category.id} className="scroll-mt-20 pb-10">
      <div className={`relative overflow-hidden bg-gradient-to-br ${accentFor(category.id)}`}>
        {category.imageSrc && (
          <Image
            src={category.imageSrc}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}
        <div className="pattern-lattice absolute inset-0 opacity-[0.12]" />
        <div className="relative px-4 py-8 sm:px-6 sm:py-10">
          <h2 className="inline-block font-serif text-2xl font-bold text-parchment sm:text-3xl">
            {title}
          </h2>
          <div className="mt-1.5 h-[3px] w-11 rounded-full bg-gold" />
          <p className="mt-2 text-[0.8rem] text-parchment-soft">
            {category.items.length} {t("sections_items")}
          </p>
        </div>
      </div>

      <div className="pt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {category.items.map((item, idx) => (
            <DishCard key={item.id} item={item} categoryId={category.id} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
