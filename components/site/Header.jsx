"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, X, Menu as MenuIcon, MapPin, User, CalendarDays } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { localized } from "@/lib/menu";
import Logo from "@/components/site/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useOverlay } from "@/lib/useOverlay";

const LINKS = [
  { id: "menu", key: "nav_menu" },
  { id: "delivery", key: "nav_delivery" },
  { id: "promos", key: "nav_promos" },
  { id: "booking", key: "nav_booking" },
  { id: "about", key: "nav_about" },
  { id: "contacts", key: "nav_contacts" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
}

export default function Header() {
  const { t, lang } = useLang();
  const { itemCount, total, setCartOpen } = useCart();
  const { categories } = useMenu();
  const { client, setAuthModalOpen } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Escape closes both. The search bar keeps the page scrollable — its
  // results are read against the menu behind it — while the mobile menu
  // covers the screen and locks it.
  useOverlay(searchOpen, () => setSearchOpen(false), { lockScroll: false });
  useOverlay(mobileOpen, () => setMobileOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (localized(item.name, lang).toLowerCase().includes(q)) {
          found.push(item);
          if (found.length >= 8) return found;
        }
      }
    }
    return found;
  }, [query, categories, lang]);

  function goToDish(id) {
    setSearchOpen(false);
    setQuery("");
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-edge/60 bg-paper/95 backdrop-blur-md">
      {/* Desktop */}
      <div className="mx-auto hidden h-20 max-w-7xl items-center gap-6 px-6 lg:flex">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-6">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollToId(l.id)}
              className="whitespace-nowrap text-[0.9rem] font-medium text-muted transition-colors hover:text-brand"
            >
              {t(l.key)}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("search_placeholder")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-brand"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
          {client ? (
            <Link
              href="/orders"
              aria-label={t("nav_my_orders")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-brand"
            >
              <User size={18} />
            </Link>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              aria-label={t("nav_login")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-brand"
            >
              <User size={18} />
            </button>
          )}

          <button
            onClick={() => scrollToId("booking")}
            className="flex items-center gap-2 rounded-full border border-edge px-4 py-2.5 text-[0.82rem] font-semibold text-body transition-colors hover:border-brand hover:text-brand"
          >
            <CalendarDays size={15} />
            {t("book_table")}
          </button>

          <button
            onClick={() => setCartOpen(true)}
            aria-label={t("cart_title")}
            className="flex items-center gap-2.5 rounded-full bg-brand px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingCart size={16} />
            {itemCount > 0 && <span>{total} ₽</span>}
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/25 px-1 text-[0.7rem]">
              {itemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t("nav_menu")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body"
        >
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>

        <Link href="/" className="mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-brand">
              <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
                  <rect x="11" y="11" width="26" height="26" rx="3" />
                  <rect x="11" y="11" width="26" height="26" rx="3" transform="rotate(45 24 24)" />
                </g>
                <circle cx="24" cy="24" r="5.2" fill="currentColor" />
              </svg>
            </span>
            <span className="font-serif text-[1.2rem] font-bold text-body">{t("restaurant_name")}</span>
          </div>
          <span className="flex items-center gap-1 text-[0.72rem] text-muted">
            <MapPin size={11} className="text-brand" /> {t("city_moscow")}
          </span>
        </Link>

        <button
          onClick={() => setSearchOpen((v) => !v)}
          aria-label={t("search_placeholder")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body"
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {searchOpen && (
        <div className="border-t border-edge/60 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-2 rounded-full border border-edge bg-card px-4 py-2.5">
              <Search size={16} className="shrink-0 text-brand" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full bg-transparent text-sm text-body placeholder:text-muted focus:outline-none"
              />
            </div>
            {query.trim() && (
              <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-edge bg-card">
                {results.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted">{t("search_no_results")}</li>
                ) : (
                  results.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => goToDish(item.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-body hover:bg-card-sunken"
                      >
                        <span className="truncate">{localized(item.name, lang)}</span>
                        <span className="shrink-0 font-semibold text-brand">{item.price} ₽</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-edge/60 bg-paper px-4 pb-4 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setMobileOpen(false);
                  scrollToId(l.id);
                }}
                className="border-b border-edge/50 py-3 text-left text-[0.95rem] font-medium text-body"
              >
                {t(l.key)}
              </button>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
