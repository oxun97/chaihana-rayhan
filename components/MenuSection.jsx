"use client";

import { useLang } from "@/context/LangContext";
import { localized } from "@/lib/menu";
import DishCard from "@/components/DishCard";

export default function MenuSection({ category }) {
  const { lang, t } = useLang();
  const title = localized(category.title, lang);

  return (
    <section id={category.id} className="mx-auto max-w-6xl scroll-mt-16 px-4 py-10 sm:px-6">
      <h2 className="inline-block font-serif text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      <div className="mb-6 mt-1.5 h-[3px] w-11 rounded-full bg-gold" />
      <p className="mb-6 -mt-4 text-[0.8rem] text-ink-soft">
        {category.items.length} {t("sections_items")}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {category.items.map((item, idx) => (
          <DishCard key={item.id} item={item} categoryId={category.id} index={idx} />
        ))}
      </div>
    </section>
  );
}
