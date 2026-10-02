"use client";

import { MapPin, Phone, Clock } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { LogoMark } from "@/components/site/Logo";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

const LINKS = [
  { id: "menu", key: "nav_menu" },
  { id: "promos", key: "nav_promos" },
  { id: "booking", key: "nav_booking" },
  { id: "contacts", key: "nav_contacts" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
}

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="mt-16 border-t border-edge bg-paper">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 pb-10 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-6 lg:pb-12 xl:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <LogoMark className="h-6 w-6" />
            </span>
            <span className="font-display text-[1.15rem] font-extrabold tracking-tight text-body">
              {t("restaurant_name")}
            </span>
          </div>
          <p className="mt-3 max-w-sm text-[0.86rem] leading-relaxed text-muted">{t("restaurant_cuisine")} · {t("city_moscow")}</p>
        </div>

        <div className="flex flex-col gap-3 text-[0.9rem] text-body">
          <span className="text-[0.8rem] font-semibold text-muted">{t("nav_contacts")}</span>
          <span className="flex items-start gap-2.5">
            <MapPin size={17} className="mt-0.5 shrink-0 text-muted" />
            {t("footer_address")}
          </span>
          <a
            href={`tel:${RESTAURANT_PHONE_TEL}`}
            className="-my-2 flex items-center gap-2.5 py-2 font-semibold transition-colors hover:text-brand"
          >
            <Phone size={17} className="shrink-0 text-muted" />
            {RESTAURANT_PHONE_DISPLAY}
          </a>
          <span className="flex items-center gap-2.5">
            <Clock size={17} className="shrink-0 text-muted" />
            {t("footer_hours_value")}
          </span>
        </div>

        <nav className="flex flex-col gap-1 text-[0.9rem] text-body" aria-label={t("nav_menu")}>
          <span className="mb-2 text-[0.8rem] font-semibold text-muted">{t("restaurant_name")}</span>
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollToId(l.id)}
              className="-mx-2 w-fit rounded-lg px-2 py-2 text-left transition-colors hover:bg-card-sunken"
            >
              {t(l.key)}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-edge">
        <p className="mx-auto max-w-[90rem] px-4 pb-28 pt-5 text-[0.78rem] text-muted lg:px-6 lg:pb-5 xl:px-8">
          © {new Date().getFullYear()} {t("restaurant_name")}
        </p>
      </div>
    </footer>
  );
}
