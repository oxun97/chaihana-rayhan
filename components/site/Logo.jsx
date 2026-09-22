"use client";

import { useLang } from "@/context/LangContext";

// The mark is an eight-point rosette — the figure Uzbek tilework is built
// from — drawn rather than shipped as an asset so it stays crisp and takes
// its colour from the theme.
export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round">
        <rect x="11" y="11" width="26" height="26" rx="3" />
        <rect x="11" y="11" width="26" height="26" rx="3" transform="rotate(45 24 24)" />
      </g>
      <circle cx="24" cy="24" r="5.2" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ compact = false, className = "" }) {
  const { t } = useLang();

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={compact ? "h-8 w-8 text-brand" : "h-9 w-9 text-brand"} />
      <span className="leading-tight">
        <span className="block font-serif text-[1.15rem] font-bold tracking-tight text-body sm:text-[1.3rem]">
          {t("restaurant_name")}
        </span>
        {!compact && (
          <span className="block text-[0.58rem] uppercase tracking-[0.16em] text-muted">
            {t("restaurant_tagline")}
          </span>
        )}
      </span>
    </div>
  );
}
