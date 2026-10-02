"use client";

import { Clock, Truck, Wallet, Store, CalendarDays } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { LogoMark } from "@/components/site/Logo";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
}

// The restaurant's own card at the top of the page, delivery-app style:
// name, cuisine and the terms a guest decides on — how fast, how much
// delivery costs, the minimum — before the menu starts. Compact on
// purpose: the food is the page, not the banner.
export default function Hero() {
  const { t } = useLang();
  const { freeDeliveryFrom, minDeliveryOrder, deliveryFeeBase } = useCart();

  const facts = [
    { icon: Clock, label: t("info_time_label"), value: t("info_time_value") },
    {
      icon: Truck,
      label: t("info_fee_label"),
      value: `${deliveryFeeBase} ₽`,
      note: `${t("info_free_from")} ${freeDeliveryFrom} ₽`,
    },
    { icon: Wallet, label: t("info_min_label"), value: `${minDeliveryOrder} ₽` },
    { icon: Store, label: t("info_pickup_label"), value: t("info_pickup_value") },
  ];

  return (
    <section id="top" className="mx-auto max-w-[90rem] px-4 pt-4 lg:px-6 lg:pt-6 xl:px-8">
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#8E1419_0%,#C82026_55%,#E0582B_100%)] text-white">
        <LogoMark className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 text-white/10 sm:h-80 sm:w-80 lg:-right-6 lg:h-[26rem] lg:w-[26rem]" />

        <div className="relative flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
          <div className="max-w-2xl">
            <p className="text-[0.82rem] font-medium text-white/80">
              {t("restaurant_cuisine")} · {t("city_moscow")}
            </p>
            <h1 className="mt-1 font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-tight sm:text-[2.8rem] lg:text-[3.4rem]">
              {t("restaurant_name")}
            </h1>

            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-[46rem]">
              {facts.map(({ icon: Icon, label, value, note }) => (
                <li key={label} className="rounded-2xl bg-white/[0.13] px-3 py-2.5 backdrop-blur-sm">
                  <span className="flex items-center gap-1.5 text-[0.72rem] font-medium text-white/75">
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[0.95rem] font-bold leading-tight">
                    {value}
                    {note && <span className="block text-[0.7rem] font-medium text-white/75">{note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => scrollToId("booking")}
            className="flex min-h-[48px] w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[0.9rem] font-semibold text-[#21201F] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <CalendarDays size={17} />
            {t("book_table")}
          </button>
        </div>
      </div>
    </section>
  );
}
