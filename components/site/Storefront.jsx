"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import { localized } from "@/lib/menu";
import Hero from "@/components/site/Hero";
import { CategoryTabs, CategorySidebar } from "@/components/site/CategoryTabs";
import DishCard from "@/components/site/DishCard";
import PromoCard from "@/components/site/PromoCard";
import BookingForm from "@/components/site/BookingForm";
import ContactBlock from "@/components/site/ContactBlock";
import { CartPanel } from "@/components/CartDrawer";

const sectionDomId = (id) => `section-${id}`;

// How far below the top of the viewport a section heading should land when
// jumped to: the sticky header plus, under xl, the sticky tab strip.
function stickyOffset() {
  if (typeof window === "undefined") return 0;
  const header = window.innerWidth >= 1024 ? 72 : 56;
  const tabs = window.innerWidth >= 1280 ? 0 : 56;
  return header + tabs + 12;
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
}

// The restaurant page, laid out like a delivery app: the menu as one long
// list of sections with a navigator that follows the scroll — a sticky tab
// strip on phones, a left column on wide screens — and the cart as a
// permanent right-hand column from laptop width up.
export default function Storefront({ featured, promos }) {
  const { t, lang } = useLang();
  const { categories } = useMenu();

  const sections = useMemo(() => {
    const list = categories.map((c) => ({ id: c.id, label: localized(c.title, lang) }));
    return featured.length ? [{ id: "popular", label: t("popular_title") }, ...list] : list;
  }, [categories, featured.length, lang, t]);

  const [active, setActive] = useState(sections[0]?.id || null);

  // Scroll-spy: the active section is the last one whose top has passed
  // under the sticky bars.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = stickyOffset() + 8;
      let current = sections[0]?.id || null;
      for (const s of sections) {
        const el = document.getElementById(sectionDomId(s.id));
        if (el && el.getBoundingClientRect().top - line <= 0) current = s.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(sectionDomId(id));
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - stickyOffset(), behavior: "smooth" });
  }, []);

  const grid = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <main>
      <Hero />

      <div
        id="menu"
        className="mx-auto max-w-[90rem] px-4 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:px-6 xl:grid-cols-[13rem_minmax(0,1fr)_22rem] xl:px-8"
      >
        <div className="hidden xl:block">
          <CategorySidebar sections={sections} active={active} onSelect={goTo} />
        </div>

        <div className="min-w-0">
          {promos.length > 0 && (
            <section id="promos" className="scroll-mt-24">
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
                {promos.map((promo) => (
                  <PromoCard
                    key={promo.id}
                    promo={promo}
                    onAction={() => promo.target && (promo.target === "menu" ? goTo(sections[0]?.id) : scrollToId(promo.target))}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="sticky top-14 z-20 -mx-4 mt-4 border-b border-edge bg-paper/95 px-4 py-2 backdrop-blur-md lg:top-[4.5rem] lg:mx-0 lg:rounded-none lg:px-0 xl:hidden">
            <CategoryTabs sections={sections} active={active} onSelect={goTo} />
          </div>

          {categories.length === 0 && <p className="py-14 text-center text-sm text-muted">{t("menu_empty")}</p>}

          {featured.length > 0 && (
            <section id={sectionDomId("popular")} className="pt-6 xl:pt-4">
              <h2 className="mb-3 font-display text-[1.45rem] font-extrabold tracking-tight text-body sm:text-[1.7rem]">
                {t("popular_title")}
              </h2>
              <div className={grid}>
                {featured.map((item) => (
                  <DishCard key={item.id} item={item} categoryId={item.categoryId} domId={`popular-${item.id}`} />
                ))}
              </div>
            </section>
          )}

          {categories.map((cat) => (
            <section key={cat.id} id={sectionDomId(cat.id)} className="pt-8">
              <h2 className="mb-3 font-display text-[1.45rem] font-extrabold tracking-tight text-body sm:text-[1.7rem]">
                {localized(cat.title, lang)}
              </h2>
              <div className={grid}>
                {cat.items.map((item) => (
                  <DishCard key={item.id} item={item} categoryId={cat.id} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="hidden lg:block">
          <CartPanel />
        </div>
      </div>

      <section id="booking" className="mx-auto max-w-[90rem] scroll-mt-24 px-4 pt-14 lg:px-6 xl:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] bg-card-sunken p-6 sm:p-8">
            <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-body sm:text-[1.9rem]">
              {t("booking_title")}
            </h2>
            <p className="mt-1 text-[0.92rem] text-muted">{t("booking_lead")}</p>
            <div className="mt-5">
              <BookingForm />
            </div>
          </div>

          <div id="contacts" className="scroll-mt-24">
            <ContactBlock />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-3xl scroll-mt-24 px-4 pt-14 text-center sm:px-6">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-body sm:text-[1.9rem]">
          {t("about_title")}
        </h2>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">{t("about_text")}</p>
      </section>
    </main>
  );
}
