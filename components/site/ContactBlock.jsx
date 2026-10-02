"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Navigation, Map } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

const MAP_QUERY = "Москва, 2-я Магистральная улица, 1/3с1";
const ROUTE_URL = `https://yandex.ru/maps/?text=${encodeURIComponent(MAP_QUERY)}`;
// Yandex's keyless embeddable widget, centred on a search for the address.
const WIDGET_URL = `https://yandex.ru/map-widget/v1/?mode=search&z=16&text=${encodeURIComponent(MAP_QUERY)}`;

export default function ContactBlock() {
  const { t } = useLang();
  // The embedded map is a third-party page with its own cookies and a few
  // hundred KB of script — it only loads once the guest asks for it, not on
  // every visit to the menu.
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="grid overflow-hidden rounded-[28px] bg-card-sunken lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-body sm:text-[1.9rem]">{t("contacts_title")}</h2>

        <span className="flex items-start gap-3 text-[0.9rem] text-body">
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
          {t("footer_address")}
        </span>

        <a
          href={`tel:${RESTAURANT_PHONE_TEL}`}
          className="-my-2.5 flex items-center gap-3 py-2.5 text-[0.9rem] text-body transition-colors hover:text-brand"
        >
          <Phone size={18} className="shrink-0 text-brand" />
          {RESTAURANT_PHONE_DISPLAY}
        </a>

        <span className="flex items-center gap-3 text-[0.9rem] text-body">
          <Clock size={18} className="shrink-0 text-brand" />
          {t("footer_hours_value")}
        </span>

        <a
          href={ROUTE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex min-h-[44px] w-fit items-center gap-2 rounded-2xl bg-card px-4 text-[0.86rem] font-semibold text-body transition-colors hover:text-brand"
        >
          <Navigation size={15} />
          {t("contacts_route")}
        </a>
      </div>

      <div className="relative m-2 mt-0 min-h-[15rem] overflow-hidden rounded-[22px] bg-edge/50 lg:m-2 lg:ml-0 lg:min-h-[18rem]">
        {showMap ? (
          <iframe
            src={WIDGET_URL}
            title={t("contacts_map_title")}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            onClick={() => setShowMap(true)}
            className="group absolute inset-0 flex items-center justify-center"
          >
            <span className="relative flex flex-col items-center gap-2.5 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform group-hover:scale-110">
                <MapPin size={21} />
              </span>
              <span className="font-display text-[1.05rem] font-bold text-body">{t("restaurant_name")}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[0.82rem] font-semibold text-body shadow-sm transition-colors group-hover:text-brand">
                <Map size={14} />
                {t("contacts_show_map")}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
