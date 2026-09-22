"use client";

import { Truck, Store, CalendarDays } from "lucide-react";
import { useLang } from "@/context/LangContext";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

// The three-way shortcut row from the mobile reference. Sits over the seam
// between hero and content on a rounded card, as in the brief.
export default function QuickActions() {
  const { t } = useLang();

  const actions = [
    { icon: Truck, label: t("quick_delivery"), target: "menu" },
    { icon: Store, label: t("quick_pickup"), target: "menu" },
    { icon: CalendarDays, label: t("quick_booking"), target: "booking" },
  ];

  return (
    <div className="relative z-10 -mt-6 px-4 lg:hidden">
      <div className="grid grid-cols-3 gap-2.5 rounded-[22px] border border-edge/70 bg-card p-3 shadow-[0_10px_30px_-18px_rgba(36,20,13,0.5)]">
        {actions.map(({ icon: Icon, label, target }) => (
          <button
            key={label}
            onClick={() => scrollToId(target)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card-sunken/70 px-2 py-3.5 text-body transition-colors active:bg-card-sunken"
          >
            <Icon size={22} className="text-brand" />
            <span className="text-[0.74rem] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
