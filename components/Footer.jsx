"use client";

import { Leaf, Truck, ChefHat, Star } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

const ADVANTAGES = [
  { icon: Leaf, titleKey: "advantage_fresh_title", descKey: "advantage_fresh_desc" },
  { icon: Truck, titleKey: "advantage_delivery_title", descKey: "advantage_delivery_desc" },
  { icon: ChefHat, titleKey: "advantage_recipes_title", descKey: "advantage_recipes_desc" },
  { icon: Star, titleKey: "advantage_trust_title", descKey: "advantage_trust_desc" },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <>
      <div className="ornament-divider bg-night" />

      <section className="border-t border-gold/10 bg-surface/40 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
          {ADVANTAGES.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 text-gold">
                <Icon size={20} />
              </span>
              <p className="text-sm font-semibold text-parchment">{t(titleKey)}</p>
              <p className="text-xs text-parchment-soft">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="delivery"
        className="pattern-lattice-lg relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-night via-night to-teal-dark px-6 py-16 text-center"
      >
        <div className="relative">
          <h2 className="font-serif text-2xl font-bold text-gold-light sm:text-3xl">
            {t("phone_delivery")}
          </h2>
          <p className="mt-1 text-sm text-parchment-soft">{t("phone_call")}</p>
          <a
            href={`tel:${RESTAURANT_PHONE_TEL}`}
            className="mt-3 inline-block text-2xl font-semibold tracking-wide text-parchment transition-colors hover:text-gold sm:text-3xl"
          >
            {RESTAURANT_PHONE_DISPLAY}
          </a>
          <p className="mt-3 text-sm text-parchment-soft/70">{t("footer_hours_value")}</p>
        </div>
      </section>

      <footer
        id="contacts"
        className="scroll-mt-20 border-t border-gold/10 bg-night px-4 py-8 text-center text-[0.76rem] text-parchment-soft"
      >
        <p>
          {t("footer_address_label")}: {t("footer_address")}
        </p>
        <p className="mt-1">{t("footer_meta")}</p>
      </footer>
    </>
  );
}
