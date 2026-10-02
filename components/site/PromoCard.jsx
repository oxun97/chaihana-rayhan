"use client";

import { ChevronRight } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { localized } from "@/lib/menu";

// Promo tiles, edited from /admin and stored in the promos table. Light,
// tinted tiles in a horizontal row, as delivery apps show restaurant offers.
const TONES = {
  red: { tile: "bg-brand/[0.09]", accent: "text-brand", dot: "bg-brand" },
  green: { tile: "bg-herb/[0.1]", accent: "text-herb", dot: "bg-herb" },
  gold: { tile: "bg-saffron/[0.16]", accent: "text-[#9a6b12] [[data-theme=night]_&]:text-saffron", dot: "bg-saffron" },
};

export default function PromoCard({ promo, onAction }) {
  const { lang } = useLang();
  const tone = TONES[promo.tone] || TONES.red;
  const action = promo.action ? localized(promo.action, lang) : null;
  const Tag = action ? "button" : "div";

  return (
    <Tag
      {...(action ? { onClick: onAction, type: "button" } : {})}
      className={`group relative flex min-h-[8.5rem] w-[16.5rem] shrink-0 lg:w-auto flex-col justify-between overflow-hidden rounded-[24px] p-4 text-left transition-transform sm:w-[18rem] ${
        tone.tile
      } ${action ? "active:scale-[0.98]" : ""}`}
    >
      <span className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] ${tone.dot}`} aria-hidden="true" />
      <span className="relative">
        <span className="block font-display text-[1.12rem] font-extrabold leading-tight tracking-tight text-body">
          {localized(promo.title, lang)}
        </span>
        <span className="mt-1 line-clamp-2 block text-[0.82rem] leading-snug text-muted">
          {localized(promo.body, lang)}
        </span>
      </span>

      {action && (
        <span className={`relative mt-3 flex items-center gap-0.5 text-[0.84rem] font-semibold ${tone.accent}`}>
          {action}
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </Tag>
  );
}
