"use client";

import { useLang } from "@/context/LangContext";
import LogoMark from "@/components/LogoMark";

export default function AboutSection() {
  const { t } = useLang();

  return (
    <section id="about" className="scroll-mt-20 border-t border-gold/10 bg-night px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <LogoMark className="h-10 w-10" />
        <h2 className="font-serif text-2xl font-bold text-parchment sm:text-3xl">
          {t("about_title")}
        </h2>
        <div className="h-[3px] w-11 rounded-full bg-gold" />
        <p className="max-w-xl text-sm leading-relaxed text-parchment-soft">{t("about_text")}</p>
      </div>
    </section>
  );
}
