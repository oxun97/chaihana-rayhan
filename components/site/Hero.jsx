"use client";

import { ArrowRight, CalendarDays, Leaf, Truck, Sprout, HandHeart } from "lucide-react";
import { useLang } from "@/context/LangContext";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
}

// The brief's hero is carried by a photograph of the room. No interior
// photography exists yet, so the ground is built from the brand's own
// colours and tilework instead of a stock stand-in: it reads as intent
// now, and an <img> can drop straight in behind it later.
export default function Hero() {
  const { t } = useLang();

  const advantages = [
    { icon: Truck, text: t("adv_fast") },
    { icon: Sprout, text: t("adv_fresh") },
    { icon: HandHeart, text: t("adv_taste") },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-cocoa">
      <div className="pattern-lattice absolute inset-0 opacity-[0.12]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_20%,rgba(199,154,69,0.32),transparent_62%),radial-gradient(90%_80%_at_10%_90%,rgba(181,31,36,0.28),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-6 lg:min-h-[43rem] lg:px-8 lg:pb-20 lg:pt-24">
        <div className="max-w-2xl">
          <h1 className="font-serif text-[2.4rem] font-bold leading-[1.05] tracking-tight text-[#F7F0E5] sm:text-[3.4rem] lg:text-[4.2rem]">
            <span className="block lg:hidden">{t("hero_mobile_h1")}</span>
            <span className="hidden lg:block">
              {t("hero_h1_a")}
              <br />
              <span className="italic text-saffron">{t("hero_h1_b")}</span>
            </span>
          </h1>

          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-[#F7F0E5]/75 sm:text-[1.05rem]">
            <span className="lg:hidden">{t("hero_mobile_lead")}</span>
            <span className="hidden lg:inline">{t("hero_lead")}</span>
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => scrollToId("menu")}
              className="flex items-center gap-2.5 rounded-full bg-brand px-7 py-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(181,31,36,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("nav_order_online")}
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => scrollToId("booking")}
              className="flex items-center gap-2.5 rounded-full border border-saffron/50 px-6 py-4 text-[0.92rem] font-semibold text-saffron transition-colors hover:bg-saffron/10"
            >
              <CalendarDays size={16} />
              {t("book_table")}
            </button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
            {advantages.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-[0.82rem] text-[#F7F0E5]/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-saffron/35 text-saffron">
                  <Icon size={15} />
                </span>
                <span className="max-w-[9rem] leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Natural-ingredients seal, as in the brief */}
        <div className="absolute bottom-8 right-5 hidden h-24 w-24 flex-col items-center justify-center gap-1 rounded-full bg-herb text-center text-[0.6rem] font-semibold leading-tight text-[#F7F0E5] sm:flex lg:bottom-16 lg:right-10 lg:h-28 lg:w-28 lg:text-[0.68rem]">
          <Leaf size={18} className="text-saffron" />
          {t("badge_natural")}
        </div>
      </div>
    </section>
  );
}
