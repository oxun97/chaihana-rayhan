"use client";

import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

// Pill buttons, active one in brand red, per the brief. Horizontally
// scrollable on phones instead of wrapping into a tall block.
export default function CategoryTabs({ active, onChange, className = "" }) {
  const { t, lang } = useLang();
  const { categories } = useMenu();

  const pill = (isActive) =>
    `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[0.85rem] font-semibold transition-colors ${
      isActive
        ? "bg-brand text-white"
        : "border border-edge bg-card text-body hover:border-brand hover:text-brand"
    }`;

  return (
    <div className={`no-scrollbar flex gap-2.5 overflow-x-auto ${className}`}>
      <button onClick={() => onChange(null)} className={pill(!active)}>
        <span>🍽️</span>
        {t("cat_all")}
      </button>

      {categories.map((cat) => (
        <button key={cat.id} onClick={() => onChange(cat.id)} className={pill(active === cat.id)}>
          <span>{CATEGORY_EMOJI[cat.id] || "🍽️"}</span>
          {localized(cat.title, lang)}
        </button>
      ))}
    </div>
  );
}
