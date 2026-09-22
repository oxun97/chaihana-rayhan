"use client";

import { MapPin, Phone, Clock, Leaf, HandHeart, ChefHat, Users } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { LogoMark } from "@/components/site/Logo";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

export default function Footer() {
  const { t } = useLang();

  const values = [
    { icon: Leaf, text: t("advantage_fresh_title") },
    { icon: HandHeart, text: t("advantage_trust_title") },
    { icon: ChefHat, text: t("advantage_recipes_title") },
    { icon: Users, text: t("advantage_delivery_title") },
  ];

  return (
    <footer className="relative overflow-hidden bg-cocoa text-[#F7F0E5]">
      <div className="pattern-lattice absolute inset-0 opacity-[0.08]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-5 border-b border-[#F7F0E5]/10 pb-9">
          {values.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-[#F7F0E5]/70"
            >
              <Icon size={17} className="text-saffron" />
              {text}
            </li>
          ))}
        </ul>

        <div className="grid gap-8 pt-9 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9 text-saffron" />
              <span className="leading-tight">
                <span className="block font-serif text-[1.3rem] font-bold">{t("restaurant_name")}</span>
                <span className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#F7F0E5]/55">
                  {t("restaurant_tagline")}
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-[#F7F0E5]/65">
              {t("about_text")}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-[0.87rem] text-[#F7F0E5]/75">
            <span className="mb-1 text-[0.66rem] uppercase tracking-[0.18em] text-saffron">
              {t("nav_contacts")}
            </span>
            <span className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-saffron" />
              {t("footer_address")}
            </span>
            <a
              href={`tel:${RESTAURANT_PHONE_TEL}`}
              className="-my-2.5 flex items-center gap-2.5 py-2.5 transition-colors hover:text-saffron"
            >
              <Phone size={16} className="shrink-0 text-saffron" />
              {RESTAURANT_PHONE_DISPLAY}
            </a>
            <span className="flex items-center gap-2.5">
              <Clock size={16} className="shrink-0 text-saffron" />
              {t("footer_hours_value")}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 text-[0.87rem] text-[#F7F0E5]/75">
            <span className="mb-1 text-[0.66rem] uppercase tracking-[0.18em] text-saffron">
              {t("nav_menu")}
            </span>
            {[
              { id: "menu", key: "nav_menu" },
              { id: "promos", key: "nav_promos" },
              { id: "booking", key: "nav_booking" },
              { id: "contacts", key: "nav_contacts" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  const el = document.getElementById(l.id);
                  if (el)
                    window.scrollTo({
                      top: el.getBoundingClientRect().top + window.scrollY - 88,
                      behavior: "smooth",
                    });
                }}
                className="py-2.5 text-left transition-colors hover:text-saffron"
              >
                {t(l.key)}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-10 border-t border-[#F7F0E5]/10 pt-6 text-center text-[0.72rem] text-[#F7F0E5]/45">
          © {new Date().getFullYear()} {t("restaurant_name")}
        </p>
      </div>
    </footer>
  );
}
