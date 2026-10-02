"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/context/LangContext";

// Horizontal strip of menu sections (phones, tablets, laptop widths).
// Tapping scrolls to the section; the highlight follows the scroll. On a
// desktop with a mouse there is no scrollbar and the wheel scrolls
// vertically, so arrow buttons page through the overflow.
export function CategoryTabs({ sections, active, onSelect }) {
  const { t } = useLang();
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
  }, [measure, sections.length]);

  // Keep the highlighted tab in view as the page scrolls through sections.
  useEffect(() => {
    const el = scroller.current;
    const tab = el?.querySelector('[data-active="true"]');
    if (!el || !tab) return;
    const left = tab.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft + 24 || left + tab.offsetWidth > el.scrollLeft + el.clientWidth - 24) {
      el.scrollTo({ left: Math.max(0, left - 40), behavior: "smooth" });
    }
  }, [active]);

  const page = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card text-body shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors hover:text-brand lg:flex";

  return (
    <div className="relative">
      <div ref={scroller} className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              data-active={isActive}
              className={`flex h-10 shrink-0 items-center rounded-full px-4 text-[0.88rem] font-medium transition-colors ${
                isActive ? "bg-body text-paper" : "text-body hover:bg-card-sunken"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-paper to-transparent transition-opacity ${
          edges.left ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent transition-opacity ${
          edges.right ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      {edges.left && (
        <button onClick={() => page(-1)} aria-label={t("scroll_left")} className={`${arrow} -left-1`}>
          <ChevronLeft size={18} />
        </button>
      )}
      {edges.right && (
        <button onClick={() => page(1)} aria-label={t("scroll_right")} className={`${arrow} -right-1`}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// The same sections as a sticky left column on wide screens.
export function CategorySidebar({ sections, active, onSelect }) {
  const { t } = useLang();
  return (
    <nav aria-label={t("menu_section_title")} className="sticky top-[5.75rem] flex flex-col gap-0.5">
      {sections.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            aria-current={isActive ? "true" : undefined}
            className={`min-h-[44px] rounded-xl px-3.5 py-2.5 text-left text-[0.95rem] transition-colors ${
              isActive ? "bg-card-sunken font-semibold text-body" : "text-body/80 hover:bg-card-sunken hover:text-body"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

export default CategoryTabs;
