"use client";

import { Home, UtensilsCrossed, ShoppingBag, MapPin } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function MobileNav() {
  const { t } = useLang();
  const { itemCount, setCartOpen } = useCart();

  const items = [
    { key: "home", icon: Home, label: t("mobile_nav_home"), onClick: () => scrollToId("top") },
    { key: "menu", icon: UtensilsCrossed, label: t("mobile_nav_menu"), onClick: () => scrollToId("menu-top") },
    { key: "cart", icon: ShoppingBag, label: t("mobile_nav_cart"), onClick: () => setCartOpen(true), badge: itemCount },
    { key: "contacts", icon: MapPin, label: t("mobile_nav_contacts"), onClick: () => scrollToId("contacts") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/10 bg-night/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map(({ key, icon: Icon, label, onClick, badge }) => (
          <button
            key={key}
            onClick={onClick}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-parchment-soft transition-colors active:text-gold"
          >
            <Icon size={20} />
            {!!badge && (
              <span className="absolute right-1 top-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-terracotta px-1 text-[0.55rem] font-semibold text-white">
                {badge}
              </span>
            )}
            <span className="text-[0.62rem] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
