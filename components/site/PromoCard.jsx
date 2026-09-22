"use client";

import { ArrowRight } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { localized } from "@/lib/menu";

// Promo tiles, edited from /admin and stored in the promos table.
const TONES = {
  red: "from-brand to-[#7c1418] text-[#F7F0E5]",
  green: "from-herb to-[#0d2c1e] text-[#F7F0E5]",
  gold: "from-saffron to-[#a06f22] text-cocoa",
};

export default function PromoCard({ promo, onAction }) {
  const { lang } = useLang();
  const tone = TONES[promo.tone] || TONES.red;
  const action = promo.action ? localized(promo.action, lang) : null;

  return (
    <div
      className={`relative flex min-h-[10.5rem] flex-1 flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br p-5 ${tone}`}
    >
      <div
        className="pattern-lattice absolute inset-0 opacity-[0.14]"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="font-serif text-[1.35rem] font-bold leading-tight">{localized(promo.title, lang)}</p>
        <p className="mt-1.5 max-w-[15rem] text-[0.82rem] opacity-85">{localized(promo.body, lang)}</p>
      </div>

      {action && (
        <button
          onClick={onAction}
          className="relative mt-4 flex w-fit items-center gap-2 rounded-full bg-[#F7F0E5] px-4 py-2 text-[0.78rem] font-semibold text-cocoa transition-transform hover:scale-[1.03] active:scale-95"
        >
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
