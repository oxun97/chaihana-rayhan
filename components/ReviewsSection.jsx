"use client";

import { Star } from "lucide-react";
import { useLang } from "@/context/LangContext";

// Shows the real aggregate rating only (also used in Hero and the site's
// Restaurant schema.org markup) — no individual review quotes are invented.
export default function ReviewsSection() {
  const { t } = useLang();

  return (
    <section id="reviews" className="scroll-mt-20 border-t border-gold/10 bg-surface/40 px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <h2 className="font-serif text-2xl font-bold text-parchment sm:text-3xl">
          {t("reviews_title")}
        </h2>
        <div className="flex items-center gap-1.5 text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={22} fill={i < 5 ? "currentColor" : "none"} />
          ))}
        </div>
        <p className="font-serif text-4xl font-bold text-parchment">4.8</p>
        <p className="text-sm text-parchment-soft">{t("reviews_subtitle")}</p>
      </div>
    </section>
  );
}
