"use client";

import { useLang } from "@/context/LangContext";
import DishCard from "@/components/DishCard";

// Renders only when at least one dish is marked `featured` in /admin — no
// fabricated "hits" are shown just to fill the section.
export default function PopularDishes({ dishes }) {
  const { t } = useLang();

  if (!dishes.length) return null;

  return (
    <section className="py-10">
      <h2 className="font-serif text-2xl font-bold text-parchment sm:text-3xl">
        {t("popular_title")}
      </h2>
      <p className="mt-1 text-sm text-parchment-soft">{t("popular_subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {dishes.map((item, idx) => (
          <DishCard
            key={item.id}
            item={item}
            categoryId={item.categoryId}
            index={idx}
            domId={`popular-${item.id}`}
          />
        ))}
      </div>
    </section>
  );
}
