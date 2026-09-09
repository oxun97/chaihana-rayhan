"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Nav({ categories = [] }) {
  const { t, lang } = useLang();
  const { itemCount, setCartOpen } = useCart();
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navScrollRef = useRef(null);
  const linkRefs = useRef({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = categories.map((c) => document.getElementById(c.id)).filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = linkRefs.current[activeId];
    if (el && navScrollRef.current) {
      const container = navScrollRef.current;
      const offset = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [activeId]);

  const scrollToSection = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 z-40 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-gold/15 bg-cream/95 shadow-soft backdrop-blur-md"
          : "border-transparent bg-cream/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-serif text-base font-bold text-ink sm:text-lg"
        >
          <span className="text-gold" aria-hidden="true">
            ✦
          </span>
          {(() => {
            const words = t("hero_title").split(" ");
            const last = words.pop();
            return (
              <>
                {words.length ? `${words.join(" ")} ` : ""}
                <span className="text-gold">{last}</span>
              </>
            );
          })()}
        </a>

        <button
          className="ml-auto shrink-0 p-1 text-xl text-ink md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          ☰
        </button>

        <div
          ref={navScrollRef}
          className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto md:flex"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => (linkRefs.current[cat.id] = el)}
              onClick={() => scrollToSection(cat.id)}
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[0.72rem] font-medium tracking-wide transition-colors ${
                activeId === cat.id
                  ? "bg-gold/10 text-gold"
                  : "text-ink-soft hover:bg-gold/10 hover:text-gold"
              }`}
            >
              {cat.title[lang] || cat.title.ru}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <CartIconButton itemCount={itemCount} onClick={() => setCartOpen(true)} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartIconButton itemCount={itemCount} onClick={() => setCartOpen(true)} compact />
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gold/10 bg-cream px-4 pb-3 pt-1 md:hidden">
          <div className="flex flex-col">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className={`border-b border-gold/10 py-2 text-left text-[0.85rem] font-medium ${
                  activeId === cat.id ? "text-gold" : "text-ink-soft"
                }`}
              >
                {cat.title[lang] || cat.title.ru}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}

function CartIconButton({ itemCount, onClick, compact }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-full bg-ink text-cream transition-transform hover:scale-105 active:scale-95 ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
      aria-label="Cart"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 4H5L5.4 6M5.4 6H19L17 13H7M5.4 6L7 13M7 13L4.7 15.3C4.1 15.9 4.5 17 5.4 17H17M17 17C15.9 17 15 17.9 15 19C15 20.1 15.9 21 17 21C18.1 21 19 20.1 19 19C19 17.9 18.1 17 17 17ZM9 19C9 20.1 8.1 21 7 21C5.9 21 5 20.1 5 19C5 17.9 5.9 17 7 17C8.1 17 9 17.9 9 19Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[0.62rem] font-semibold text-ink">
          {itemCount}
        </span>
      )}
    </button>
  );
}
