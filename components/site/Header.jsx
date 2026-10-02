"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, X, Menu as MenuIcon, User, Clock } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";
import { LogoMark } from "@/components/site/Logo";
import { useDishModal } from "@/components/site/DishModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useOverlay } from "@/lib/useOverlay";

const LINKS = [
  { id: "menu", key: "nav_menu" },
  { id: "promos", key: "nav_promos" },
  { id: "booking", key: "nav_booking" },
  { id: "contacts", key: "nav_contacts" },
  { id: "about", key: "nav_about" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
}

function SearchResults({ results, query, onPick }) {
  const { t, lang } = useLang();
  if (!query.trim()) return null;
  return (
    <ul className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-edge bg-card p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)]">
      {results.length === 0 ? (
        <li className="px-3 py-3 text-sm text-muted">{t("search_no_results")}</li>
      ) : (
        results.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onPick(item.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-card-sunken"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card-sunken text-lg">
                {item.imgSrc ? (
                  <Image src={item.imgSrc} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  CATEGORY_EMOJI[item.categoryId] || "🍽️"
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.9rem] text-body">{localized(item.name, lang)}</span>
              <span className="shrink-0 text-[0.9rem] font-semibold text-body">{item.price} ₽</span>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}

export default function Header() {
  const { t, lang } = useLang();
  const { itemCount, total, setCartOpen } = useCart();
  const { categories } = useMenu();
  const { client, setAuthModalOpen } = useAuth();
  const { openDish } = useDishModal();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const mobileInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) mobileInputRef.current?.focus();
  }, [searchOpen]);

  useOverlay(searchOpen, () => setSearchOpen(false), { lockScroll: false });
  useOverlay(mobileOpen, () => setMobileOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (localized(item.name, lang).toLowerCase().includes(q)) {
          found.push({ ...item, categoryId: cat.id });
          if (found.length >= 8) return found;
        }
      }
    }
    return found;
  }, [query, categories, lang]);

  function pick(id) {
    setSearchOpen(false);
    setQuery("");
    openDish(id);
  }

  const profileButton = client ? (
    <Link
      href="/orders"
      aria-label={t("nav_my_orders")}
      className="flex h-11 w-11 items-center justify-center rounded-full text-body transition-colors hover:bg-card-sunken"
    >
      <User size={20} />
    </Link>
  ) : (
    <button
      onClick={() => setAuthModalOpen(true)}
      aria-label={t("nav_login")}
      className="flex h-11 w-11 items-center justify-center rounded-full text-body transition-colors hover:bg-card-sunken"
    >
      <User size={20} />
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-paper/95 backdrop-blur-md">
      {/* Desktop */}
      <div className="mx-auto hidden h-[4.5rem] max-w-[90rem] items-center gap-5 px-6 lg:flex xl:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8 text-brand" />
          <span className="font-display text-[1.15rem] font-extrabold tracking-tight text-body">
            {t("restaurant_name")}
          </span>
        </Link>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-card-sunken px-3.5 py-2 text-[0.82rem] font-medium text-body xl:flex">
          <Clock size={15} className="text-muted" />
          {t("info_delivery_time")}
        </span>

        <div className="relative mx-auto w-full max-w-xl">
          <label className="flex h-11 items-center gap-2.5 rounded-full bg-card-sunken px-4 transition-shadow focus-within:ring-2 focus-within:ring-brand/30">
            <Search size={18} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder={t("search_placeholder")}
              className="w-full bg-transparent text-[0.92rem] text-body placeholder:text-muted focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label={t("close")} className="text-muted hover:text-body">
                <X size={16} />
              </button>
            )}
          </label>
          <SearchResults results={results} query={query} onPick={pick} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle size="h-11 w-11" />
          {profileButton}
          <button
            onClick={() => setCartOpen(true)}
            aria-label={t("cart_title")}
            className="ml-2 flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[0.9rem] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 ? <span>{total} ₽</span> : <span>{t("cart_title")}</span>}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex h-14 items-center gap-1 px-2 lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t("nav_menu")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body"
        >
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>

        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <LogoMark className="h-7 w-7 shrink-0 text-brand" />
          <span className="truncate font-display text-[1.05rem] font-extrabold tracking-tight text-body">
            {t("restaurant_name")}
          </span>
        </Link>

        <button
          onClick={() => setSearchOpen((v) => !v)}
          aria-label={t("search_placeholder")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body"
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
        {profileButton}
      </div>

      {searchOpen && (
        <div className="border-t border-edge px-4 py-3 lg:hidden">
          <div className="relative">
            <label className="flex h-11 items-center gap-2.5 rounded-full bg-card-sunken px-4">
              <Search size={17} className="shrink-0 text-muted" />
              <input
                ref={mobileInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full bg-transparent text-[0.95rem] text-body placeholder:text-muted focus:outline-none"
              />
            </label>
            <SearchResults results={results} query={query} onPick={pick} />
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-edge bg-paper px-4 pb-5 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setMobileOpen(false);
                  scrollToId(l.id);
                }}
                className="border-b border-edge py-3.5 text-left text-[1rem] font-medium text-body"
              >
                {t(l.key)}
              </button>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher />
            <ThemeToggle size="h-11 w-11" />
          </div>
        </div>
      )}
    </header>
  );
}
