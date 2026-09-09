"use client";

import { motion } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

function scrollToMenu() {
  const el = document.querySelector("main section[id]");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 68, behavior: "smooth" });
}

export default function Hero() {
  const { t } = useLang();
  const titleWords = t("hero_title").split(" ");
  const titleLast = titleWords.pop();
  const titleRest = titleWords.join(" ");

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-ink sm:min-h-[92vh]"
    >
      {/* Layered Eastern ornament: lattice texture + soft gold glows */}
      <div className="pattern-lattice-lg absolute inset-0 animate-drift opacity-[0.05]" />
      <div className="absolute inset-0 animate-heroZoom bg-[radial-gradient(ellipse_at_top_left,rgba(201,169,110,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(31,111,107,0.22),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23c9a96e' stroke-width='1'%3E%3Ccircle cx='42' cy='42' r='28'/%3E%3Ccircle cx='42' cy='42' r='18'/%3E%3Cpath d='M42 4v76M4 42h76M13 13l58 58M71 13L13 71'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "84px 84px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/40 to-ink" />
      {/* Vignette frame — evokes a portal/iwan without needing a photo asset */}
      <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-gold/20 sm:inset-6 sm:rounded-[2.5rem]" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs tracking-wide text-gold-light"
        >
          <span>★ 4.8</span>
          <span className="opacity-50">•</span>
          <span>156 отзывов</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-shadow-hero font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl"
        >
          {titleRest ? `${titleRest} ` : ""}
          <span className="text-gold-light">{titleLast}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto mt-4 flex items-center justify-center gap-3 text-gold/60"
          aria-hidden="true"
        >
          <span className="h-px w-10 bg-gold/40" />
          <StarMark />
          <span className="h-px w-10 bg-gold/40" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-3 text-sm uppercase tracking-[0.35em] text-white/70"
        >
          {t("hero_subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href={`tel:${RESTAURANT_PHONE_TEL}`}
            className="rounded-full border-2 border-gold px-7 py-2.5 text-[1.05rem] text-white transition-all duration-300 hover:bg-gold hover:text-ink"
          >
            {RESTAURANT_PHONE_DISPLAY}
          </a>
          <button
            onClick={scrollToMenu}
            className="rounded-full border-2 border-gold bg-gold px-7 py-2.5 text-[1.05rem] font-semibold text-ink transition-all duration-300 hover:bg-gold-light"
          >
            📱 {t("nav_order_online")}
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.2 }, y: { duration: 2.4, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 cursor-pointer text-[0.72rem] tracking-[0.2em] text-white"
        onClick={scrollToMenu}
      >
        ▼ {t("scroll_to_menu")}
      </motion.div>
    </section>
  );
}

function StarMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0l2.6 8.2L23 11l-8.4 2.8L12 22l-2.6-8.2L1 11l8.4-2.8L12 0z" />
    </svg>
  );
}
