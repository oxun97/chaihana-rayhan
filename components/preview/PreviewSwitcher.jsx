"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VARIANTS = [
  { href: "/preview/a", label: "A · Печатное меню" },
  { href: "/preview/b", label: "B · Приложение" },
  { href: "/", label: "Текущий сайт" },
];

export default function PreviewSwitcher() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-1.5 overflow-x-auto px-3 py-2">
        <span className="mr-1 shrink-0 text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
          Превью
        </span>
        {VARIANTS.map((v) => {
          const active = pathname === v.href;
          return (
            <Link
              key={v.href}
              href={v.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
