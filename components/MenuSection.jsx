"use client";

import Image from "next/image";
import { useLang } from "@/context/LangContext";
import { localized } from "@/lib/menu";
import DishCard from "@/components/DishCard";

// Deterministic accent per category so sections feel distinct even before
// real cover photos are uploaded, while staying inside the brand palette.
const ACCENTS = [
  "from-ink via-ink to-gold-dark/70",
  "from-ink via-ink to-teal-dark",
  "from-ink via-ink to-terracotta-dark",
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
    <section id={category.id} className="scroll-mt-16 pb-10">
      <div className={`relative overflow-hidden bg-gradient-to-br ${accentFor(category.id)}`}>
        {category.imageSrc && (
          <Image
            src={category.imageSrc}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover opacity-50"
          />
        )}
        <div className="pattern-lattice absolute inset-0 opacity-[0.15]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <h2 className="inline-block font-serif text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h2>
          <div className="mt-1.5 h-[3px] w-11 rounded-full bg-gold" />
          <p className="mt-2 text-[0.8rem] text-white/70">
            {category.items.length} {t("sections_items")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {category.items.map((item, idx) => (
            <DishCard key={item.id} item={item} categoryId={category.id} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
