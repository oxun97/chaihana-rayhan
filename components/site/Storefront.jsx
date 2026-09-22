"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useMenu } from "@/context/MenuContext";
import Hero from "@/components/site/Hero";
import QuickActions from "@/components/site/QuickActions";
import CategoryTabs from "@/components/site/CategoryTabs";
import DishCard from "@/components/site/DishCard";
import PromoCard from "@/components/site/PromoCard";
import BookingForm from "@/components/site/BookingForm";
import ContactBlock from "@/components/site/ContactBlock";
import { PROMOS } from "@/data/promos";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
}

export default function Storefront({ featured }) {
  const { t, lang } = useLang();
  const { categories } = useMenu();
  const [activeCat, setActiveCat] = useState(null);

  const shownCategories = useMemo(
    () => (activeCat ? categories.filter((c) => c.id === activeCat) : categories),
    [categories, activeCat]
  );

  const promos = PROMOS[lang] || PROMOS.ru;

  return (
    <main className="pb-24 lg:pb-0">
      <Hero />
      <QuickActions />

      {/* Popular — only real dishes flagged in the admin panel */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-16">
          <header className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[1.7rem] font-bold tracking-tight text-body sm:text-[2.1rem]">
                {t("popular_title")}
              </h2>
              <p className="mt-0.5 text-[0.86rem] text-muted">{t("popular_subtitle")}</p>
            </div>
            <button
              onClick={() => scrollToId("menu")}
              className="flex shrink-0 items-center gap-1.5 text-[0.85rem] font-semibold text-brand hover:underline"
            >
              {t("see_all")}
              <ArrowRight size={15} />
            </button>
          </header>

          <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {featured.map((item) => (
              <div key={item.id} className="w-[15rem] shrink-0 sm:w-auto">
                <DishCard item={item} categoryId={item.categoryId} domId={`popular-${item.id}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <h2 className="mb-4 font-serif text-[1.7rem] font-bold tracking-tight text-body sm:text-[2.1rem]">
          {t("menu_section_title")}
        </h2>

        <div className="sticky top-[4.4rem] z-20 -mx-4 bg-paper/95 px-4 py-3 backdrop-blur-md lg:top-[5.5rem] lg:mx-0 lg:px-0">
          <CategoryTabs active={activeCat} onChange={setActiveCat} />
        </div>

        {categories.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted">{t("menu_empty")}</p>
        ) : (
          shownCategories.map((cat) => (
            <div key={cat.id} className="pt-7">
              {!activeCat && (
                <h3 className="mb-3.5 font-serif text-[1.3rem] font-bold text-body">
                  {cat.title?.[lang] || cat.title?.ru}
                </h3>
              )}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {cat.items.map((item) => (
                  <DishCard key={item.id} item={item} categoryId={cat.id} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Promos */}
      <section id="promos" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-serif text-[1.7rem] font-bold tracking-tight text-body sm:text-[2.1rem]">
          {t("promos_title")}
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {promos.map((promo) => (
            <div key={promo.id} className="flex w-[17rem] shrink-0 lg:w-auto">
              <PromoCard promo={promo} onAction={() => promo.target && scrollToId(promo.target)} />
            </div>
          ))}
        </div>
      </section>

      {/* Booking + contacts */}
      <section
        id="booking"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 lg:px-8"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[22px] border border-edge/70 bg-card p-6 sm:p-7">
            <div className="pattern-lattice-soft absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative">
              <h2 className="font-serif text-[1.6rem] font-bold tracking-tight text-body sm:text-[1.9rem]">
                {t("booking_title")}
              </h2>
              <p className="mt-1 text-[0.88rem] text-muted">{t("booking_lead")}</p>
              <div className="mt-5">
                <BookingForm />
              </div>
            </div>
          </div>

          <div id="contacts" className="scroll-mt-24">
            <ContactBlock />
          </div>
        </div>
      </section>

      {/* Delivery + about, anchored for the header links */}
      <section id="delivery" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["advantage_delivery_title", "advantage_delivery_desc"],
            ["advantage_fresh_title", "advantage_fresh_desc"],
            ["advantage_recipes_title", "advantage_recipes_desc"],
            ["advantage_trust_title", "advantage_trust_desc"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-[20px] border border-edge/70 bg-card p-5">
              <p className="font-semibold text-body">{t(title)}</p>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">{t(desc)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14 text-center sm:px-6">
        <h2 className="font-serif text-[1.7rem] font-bold tracking-tight text-body sm:text-[2.1rem]">
          {t("about_title")}
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{t("about_text")}</p>
      </section>
    </main>
  );
}
