"use client";

import { useLang } from "@/context/LangContext";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";

export default function Footer() {
  const { t } = useLang();

  return (
    <>
      <section className="bg-gradient-to-br from-ink to-ink-text px-6 py-14 text-center text-white">
        <h2 className="font-serif text-2xl font-bold text-gold-light sm:text-3xl">
          {t("phone_delivery")}
        </h2>
        <p className="mt-1 text-sm text-white/60">{t("phone_call")}</p>
        <a
          href={`tel:${RESTAURANT_PHONE_TEL}`}
          className="mt-3 inline-block text-2xl font-semibold tracking-wide text-white transition-colors hover:text-gold sm:text-3xl"
        >
          {RESTAURANT_PHONE_DISPLAY}
        </a>
        <p className="mt-3 text-sm text-white/50">{t("footer_hours_value")}</p>
      </section>

      <footer className="border-t border-gold/10 px-4 py-6 text-center text-[0.76rem] text-ink-soft">
        <p>{t("footer_address_label")}: {t("footer_address")}</p>
        <p className="mt-1">{t("footer_meta")}</p>
      </footer>
    </>
  );
}
