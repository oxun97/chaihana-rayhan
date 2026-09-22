"use client";

import { useRouter } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, BadgePercent, User } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

export default function MobileBottomNav() {
  const { t } = useLang();
  const { itemCount, setCartOpen } = useCart();
  const { client, setAuthModalOpen } = useAuth();
  const router = useRouter();

  const items = [
    { key: "home", icon: Home, label: t("mobile_nav_home"), onClick: () => scrollToId("top") },
    { key: "menu", icon: LayoutGrid, label: t("mobile_nav_menu"), onClick: () => scrollToId("menu") },
    {
      key: "cart",
      icon: ShoppingCart,
      label: t("mobile_nav_cart"),
      onClick: () => setCartOpen(true),
      badge: itemCount,
    },
    {
      key: "promos",
      icon: BadgePercent,
      label: t("mobile_nav_promos"),
      onClick: () => scrollToId("promos"),
    },
    {
      key: "profile",
      icon: User,
      label: client ? t("mobile_nav_profile") : t("nav_login"),
      onClick: () => (client ? router.push("/orders") : setAuthModalOpen(true)),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-paper/97 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map(({ key, icon: Icon, label, onClick, badge }) => (
          <button
            key={key}
            onClick={onClick}
            className="relative flex flex-1 flex-col items-center gap-1 px-1 py-1.5 text-muted transition-colors active:text-brand"
          >
            <Icon size={21} />
            {!!badge && (
              <span className="absolute right-1.5 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[0.58rem] font-bold text-white">
                {badge}
              </span>
            )}
            <span className="text-[0.6rem] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
