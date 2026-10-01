"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

// Pill buttons, active one in brand red, per the brief. One scrollable row
// rather than wrapping into a tall block — which on a desktop with a mouse
// meant the last categories were simply unreachable, since there is no
// scrollbar and a wheel scrolls vertically. The edge fades show there is
// more, and on wide screens arrow buttons page through it.
export default function CategoryTabs({ active, onChange, className = "" }) {
  const { t, lang } = useLang();
  const { categories } = useMenu();
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, categories.length]);

  // Keep the chosen pill in view, e.g. after picking it from the far end.
  useEffect(() => {
    const el = scroller.current;
    const pill = el?.querySelector('[data-active="true"]');
    if (!el || !pill) return;
    const left = pill.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft || left + pill.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, left - 48), behavior: "smooth" });
    }
  }, [active]);

  const page = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const pill = (isActive) =>
    `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[0.85rem] font-semibold transition-colors ${
      isActive
        ? "bg-brand text-white"
        : "border border-edge bg-card text-body hover:border-brand hover:text-brand"
    }`;

  const arrow =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-card text-body shadow-[0_6px_18px_-8px_rgba(36,20,13,0.35)] transition-colors hover:border-brand hover:text-brand lg:flex";

  return (
    <div className={`relative ${className}`}>
      <div ref={scroller} className="no-scrollbar flex gap-2.5 overflow-x-auto">
        <button onClick={() => onChange(null)} className={pill(!active)} data-active={!active}>
          <span>🍽️</span>
          {t("cat_all")}
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={pill(active === cat.id)}
            data-active={active === cat.id}
          >
            <span>{CATEGORY_EMOJI[cat.id] || "🍽️"}</span>
            {localized(cat.title, lang)}
          </button>
        ))}
      </div>

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-paper to-transparent transition-opacity lg:w-16 ${
          edges.left ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper to-transparent transition-opacity lg:w-16 ${
          edges.right ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {edges.left && (
        <button onClick={() => page(-1)} aria-label={t("scroll_left")} className={`${arrow} -left-2`}>
          <ChevronLeft size={18} />
        </button>
      )}
      {edges.right && (
        <button onClick={() => page(1)} aria-label={t("scroll_right")} className={`${arrow} -right-2`}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
