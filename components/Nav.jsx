"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Menu as MenuIcon, X, MapPin, Phone as PhoneIcon, ShoppingBag, Heart, User } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { localized } from "@/lib/menu";
import { RESTAURANT_PHONE_DISPLAY, RESTAURANT_PHONE_TEL } from "@/lib/whatsapp";
import LogoMark from "@/components/LogoMark";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV_LINKS = [
  { id: "menu-top", labelKey: "nav_menu" },
  { id: "delivery", labelKey: "nav_delivery" },
  { id: "about", labelKey: "nav_about" },
  { id: "reviews", labelKey: "nav_reviews" },
  { id: "contacts", labelKey: "nav_contacts" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 84;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function Nav() {
  const { t, lang } = useLang();
  const { itemCount, setCartOpen, addItem } = useCart();
  const { categories } = useMenu();
  const { items: favoriteItems, toggle: toggleFavorite, count: favoriteCount } = useFavorites();
  const { client, setAuthModalOpen } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (localized(item.name, lang).toLowerCase().includes(q)) {
          matches.push(item);
          if (matches.length >= 8) return matches;
        }
      }
    }
    return matches;
  }, [query, categories, lang]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function goToDish(id) {
    closeSearch();
    setFavoritesOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <nav
      className={`fixed top-0 z-40 w-full border-b transition-all duration-300 ${
        scrolled || searchOpen || favoritesOpen
          ? "border-gold/15 bg-night/95 shadow-lift backdrop-blur-md"
          : "border-transparent bg-night/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="leading-tight">
            <span className="block font-serif text-base font-bold text-parchment sm:text-lg">
              {t("hero_title")}
            </span>
            <span className="hidden text-[0.62rem] uppercase tracking-[0.2em] text-gold sm:block">
              {t("hero_subtitle")}
            </span>
          </span>
        </a>

        <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToId(link.id)}
              className="whitespace-nowrap text-sm font-medium text-parchment-soft transition-colors hover:text-gold"
            >
              {t(link.labelKey)}
            </button>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <span className="flex items-center gap-1 text-sm text-parchment-soft">
            <MapPin size={15} className="text-gold" /> {t("city_moscow")}
          </span>
          <a
            href={`tel:${RESTAURANT_PHONE_TEL}`}
            className="flex items-center gap-1.5 text-sm text-parchment-soft transition-colors hover:text-gold"
          >
            <PhoneIcon size={15} className="text-gold" /> {RESTAURANT_PHONE_DISPLAY}
          </a>
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              setFavoritesOpen(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft transition-colors hover:bg-white/5 hover:text-gold"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => {
              setFavoritesOpen((v) => !v);
              setSearchOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft transition-colors hover:bg-white/5 hover:text-gold"
            aria-label={t("favorites_title")}
          >
            <Heart size={18} />
            {favoriteCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-terracotta px-1 text-[0.58rem] font-semibold text-white">
                {favoriteCount}
              </span>
            )}
          </button>
          {client ? (
            <Link
              href="/orders"
              className="flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft transition-colors hover:bg-white/5 hover:text-gold"
              aria-label={t("nav_my_orders")}
              title={t("nav_my_orders")}
            >
              <User size={18} />
            </Link>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft transition-colors hover:bg-white/5 hover:text-gold"
              aria-label={t("nav_login")}
              title={t("nav_login")}
            >
              <User size={18} />
            </button>
          )}
          <LanguageSwitcher />
          <CartButton itemCount={itemCount} onClick={() => scrollToId("cart-sidebar")} />
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:hidden">
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              setFavoritesOpen(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft hover:bg-white/5 hover:text-gold"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <CartButton itemCount={itemCount} onClick={() => setCartOpen(true)} compact />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-parchment-soft hover:bg-white/5 hover:text-gold"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gold/10 bg-night/98 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-2 rounded-full border border-gold/25 bg-surface px-4 py-2">
              <Search size={16} className="shrink-0 text-gold" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full bg-transparent text-sm text-parchment placeholder:text-parchment-soft focus:outline-none"
              />
              <button onClick={closeSearch} className="shrink-0 text-parchment-soft hover:text-gold">
                <X size={16} />
              </button>
            </div>
            {query.trim() && (
              <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gold/10 bg-surface">
                {results.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-parchment-soft">{t("search_no_results")}</li>
                ) : (
                  results.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => goToDish(item.id)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-parchment hover:bg-white/5"
                      >
                        <span className="truncate">{localized(item.name, lang)}</span>
                        <span className="ml-3 shrink-0 text-gold">{item.price} ₽</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {favoritesOpen && (
        <div className="border-t border-gold/10 bg-night/98 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-parchment">{t("favorites_title")}</h4>
              <button onClick={() => setFavoritesOpen(false)} className="text-parchment-soft hover:text-gold">
                <X size={16} />
              </button>
            </div>
            {favoriteItems.length === 0 ? (
              <p className="rounded-2xl border border-gold/10 bg-surface px-4 py-3 text-sm text-parchment-soft">
                {t("favorites_empty")}
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto rounded-2xl border border-gold/10 bg-surface">
                {favoriteItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <button
                      onClick={() => goToDish(item.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-parchment hover:text-gold"
                    >
                      {localized(item.name, lang)}
                    </button>
                    <span className="shrink-0 text-sm text-gold">{item.price} ₽</span>
                    <button
                      onClick={() => addItem(item.id)}
                      className="shrink-0 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white"
                    >
                      {t("add_to_cart")}
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="shrink-0 text-parchment-soft hover:text-terracotta"
                      aria-label="remove"
                    >
                      <Heart size={15} fill="currentColor" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-gold/10 bg-night px-4 pb-4 pt-2 lg:hidden">
          <div className="mb-2 flex items-center justify-between border-b border-gold/10 pb-2">
            <button
              onClick={() => {
                setMobileOpen(false);
                setFavoritesOpen(true);
              }}
              className="relative flex items-center gap-1.5 text-sm font-medium text-parchment-soft hover:text-gold"
            >
              <Heart size={16} /> {t("favorites_title")}
              {favoriteCount > 0 && (
                <span className="ml-1 rounded-full bg-terracotta px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                  {favoriteCount}
                </span>
              )}
            </button>
            {client ? (
              <Link
                href="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-parchment-soft hover:text-gold"
              >
                <User size={16} /> {t("nav_my_orders")}
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-parchment-soft hover:text-gold"
              >
                <User size={16} /> {t("nav_login")}
              </button>
            )}
          </div>
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setMobileOpen(false);
                  scrollToId(link.id);
                }}
                className="border-b border-gold/10 py-2.5 text-left text-sm font-medium text-parchment-soft hover:text-gold"
              >
                {t(link.labelKey)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <a
              href={`tel:${RESTAURANT_PHONE_TEL}`}
              className="flex items-center gap-1.5 text-sm text-parchment-soft"
            >
              <PhoneIcon size={15} className="text-gold" /> {RESTAURANT_PHONE_DISPLAY}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}

function CartButton({ itemCount, onClick, compact }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-full bg-gold text-night transition-transform hover:scale-105 active:scale-95 ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
      aria-label="Cart"
    >
      <ShoppingBag size={18} />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-terracotta px-1 text-[0.62rem] font-semibold text-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}
