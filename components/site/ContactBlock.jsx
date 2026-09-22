"use client";

import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

const MAP_QUERY = "Москва, 2-я Магистральная улица, 1/3с1";

export default function ContactBlock() {
  const { t } = useLang();

  return (
    <div className="grid overflow-hidden rounded-[22px] border border-edge/70 bg-card lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-4 p-6 sm:p-7">
        <h3 className="font-serif text-[1.5rem] font-bold text-body">{t("contacts_title")}</h3>

        <span className="flex items-start gap-3 text-[0.9rem] text-body">
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
          {t("footer_address")}
        </span>

        <a
          href={`tel:${RESTAURANT_PHONE_TEL}`}
          className="flex items-center gap-3 text-[0.9rem] text-body transition-colors hover:text-brand"
        >
          <Phone size={18} className="shrink-0 text-brand" />
          {RESTAURANT_PHONE_DISPLAY}
        </a>

        <span className="flex items-center gap-3 text-[0.9rem] text-body">
          <Clock size={18} className="shrink-0 text-brand" />
          {t("footer_hours_value")}
        </span>

        <a
          href={`https://yandex.ru/maps/?text=${encodeURIComponent(MAP_QUERY)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex w-fit items-center gap-2 rounded-full border border-edge px-4 py-2.5 text-[0.82rem] font-semibold text-body transition-colors hover:border-brand hover:text-brand"
        >
          <Navigation size={15} />
          {t("contacts_route")}
        </a>
      </div>

      {/* Static map surrogate: an embedded provider map needs a key and a
          cookie banner, so the block links out to maps instead. */}
      <a
        href={`https://yandex.ru/maps/?text=${encodeURIComponent(MAP_QUERY)}`}
        target="_blank"
        rel="noreferrer"
        className="relative flex min-h-[13rem] items-center justify-center bg-card-sunken"
      >
        <div className="pattern-lattice-soft absolute inset-0 opacity-70" aria-hidden="true" />
        <span className="relative flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg">
            <MapPin size={20} />
          </span>
          <span className="font-serif text-[1.05rem] font-bold text-body">
            {t("restaurant_name")}
          </span>
          <span className="text-[0.75rem] text-muted">{t("city_moscow")}</span>
        </span>
      </a>
    </div>
  );
}
