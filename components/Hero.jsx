"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

function scrollToMenu() {
  const el = document.getElementById("menu-top");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
}

export default function Hero() {
  const { t } = useLang();

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] items-center overflow-hidden bg-night pt-20 sm:min-h-[92vh]"
    >
      <div className="pattern-lattice-lg absolute inset-0 animate-drift opacity-[0.05]" />
      <div className="absolute inset-0 animate-heroZoom bg-[radial-gradient(ellipse_at_top_left,rgba(242,169,0,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(232,65,44,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-gold/15 sm:inset-6 sm:rounded-[2.5rem]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:gap-6 lg:py-24">
        <div className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"
          >
            {t("hero_eyebrow")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 font-serif text-4xl font-bold leading-tight text-parchment sm:text-5xl lg:text-6xl"
          >
            {t("hero_title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-2 font-serif text-xl text-gold-light sm:text-2xl"
          >
            {t("hero_subtitle")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchment-soft lg:mx-0"
          >
            {t("hero_description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-4 flex items-center justify-center gap-2 text-sm text-parchment-soft lg:justify-start"
          >
            <span className="flex items-center gap-1 text-gold">
              <Star size={15} fill="currentColor" /> 4.8
            </span>
            <span className="opacity-50">•</span>
            <span>156 отзывов</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <button
              onClick={scrollToMenu}
              className="rounded-full bg-terracotta px-7 py-3 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t("hero_cta_menu")} →
            </button>
            <a
              href={`tel:${RESTAURANT_PHONE_TEL}`}
              className="rounded-full border-2 border-gold/50 px-7 py-3 text-sm font-semibold text-parchment transition-colors hover:border-gold hover:text-gold"
            >
              {t("nav_order_online")}
            </a>
          </motion.div>
        </div>

        {/* No real dish photography yet — a warm gold/terracotta glow with
            the brand's lattice ornament stands in for the hero food shot
            until real photos are uploaded via /admin. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
        >
          <div className="pattern-lattice-soft absolute inset-6 rounded-[3rem] border border-gold/20 bg-gradient-to-br from-surface via-surface to-terracotta-dark/40" />
          <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_50%_50%,rgba(242,169,0,0.28),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="medallion flex h-28 w-28 items-center justify-center rounded-full bg-surface text-5xl sm:h-36 sm:w-36">
              🍚
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.2 }, y: { duration: 2.4, repeat: Infinity } }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 cursor-pointer text-[0.72rem] tracking-[0.2em] text-parchment-soft sm:block"
        onClick={scrollToMenu}
      >
        ▼ {t("scroll_to_menu")}
      </motion.div>
    </section>
  );
}
