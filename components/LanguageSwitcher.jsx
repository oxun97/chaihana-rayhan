"use client";

import { useLang } from "@/context/LangContext";
import i18n from "@/data/i18n.json";

const FLAGS = { ru: "🇷🇺", uz: "🇺🇿" };

export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, langs } = useLang();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {langs.map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          title={i18n.ui[code]?.label}
          aria-label={i18n.ui[code]?.label}
          className={`rounded-md border px-1 py-0.5 text-lg leading-none transition-all duration-200 ${
            lang === code
              ? "scale-110 border-gold bg-gold/10 opacity-100 grayscale-0"
              : "border-transparent opacity-45 grayscale-[0.6] hover:opacity-80 hover:grayscale-0"
          }`}
        >
          {FLAGS[code]}
        </button>
      ))}
    </div>
  );
}
