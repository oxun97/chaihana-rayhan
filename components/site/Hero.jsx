"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, Leaf, Truck, Sprout, HandHeart, Plus, Check } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
}

// The same eight-point rosette as the logo mark, scaled up into a tile
// medallion: two rotated squares, concentric rings and a dotted band.
function Rosette({ className = "" }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="200" cy="200" r="196" />
        <circle cx="200" cy="200" r="184" strokeDasharray="1.5 7" strokeLinecap="round" strokeWidth="2.4" />
        <circle cx="200" cy="200" r="150" />
        <rect x="94" y="94" width="212" height="212" rx="10" />
        <rect x="94" y="94" width="212" height="212" rx="10" transform="rotate(45 200 200)" />
        <rect x="128" y="128" width="144" height="144" rx="8" transform="rotate(22.5 200 200)" />
        <rect x="128" y="128" width="144" height="144" rx="8" transform="rotate(67.5 200 200)" />
        <circle cx="200" cy="200" r="58" />
        <circle cx="200" cy="200" r="22" />
      </g>
    </svg>
  );
}

// Where the positioned cards sit around the medallion, and how far out of
// step their float is so the group never bobs in unison.
const CARD_SLOTS = [
  { className: "left-0 top-[7%]", delay: "0s" },
  { className: "right-0 top-[38%]", delay: "-2s" },
  { className: "left-[8%] bottom-[5%]", delay: "-4s" },
];

function HitCard({ item, slot }) {
  const { lang, t } = useLang();
  const { getQty, addItem } = useCart();
  const qty = getQty(item.id);
  const name = localized(item.name, lang);

  return (
    <div
      className={`absolute w-[18.5rem] motion-safe:animate-float ${slot.className}`}
      style={{ animationDelay: slot.delay }}
    >
      <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#F7F0E5] p-2.5 pr-3 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.75)]">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[#EFE4D2]">
          {item.imgSrc ? (
            <Image src={item.imgSrc} alt={name} fill sizes="56px" className="object-cover" />
          ) : (
            <div className="pattern-lattice-soft flex h-full w-full items-center justify-center text-2xl">
              {CATEGORY_EMOJI[item.categoryId] || "🍽️"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#A0761F]">
            {t("badge_hit")}
          </span>
          <p className="truncate text-[0.92rem] font-semibold leading-tight text-[#24140D]">{name}</p>
          <p className="mt-0.5 text-[0.86rem] font-bold text-[#24140D]">{item.price} ₽</p>
        </div>

        <button
          onClick={() => addItem(item.id)}
          aria-label={`${t("add_to_cart")}: ${name}`}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform hover:scale-110 active:scale-90"
        >
          {qty > 0 ? <Check size={18} /> : <Plus size={19} />}
          {qty > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-saffron px-1 text-[0.65rem] font-bold text-[#24140D]">
              {qty}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// No interior or food photography exists yet, so the ground is built from
// the brand's own colours and tilework instead of a stock stand-in. On
// wide screens the right half carries the kitchen's hits as live, orderable
// cards around a tile medallion — they pick up real photos automatically
// as soon as a dish gets one in the admin panel.
export default function Hero({ featured = [] }) {
  const { t } = useLang();
  const hits = featured.slice(0, CARD_SLOTS.length);

  const advantages = [
    { icon: Truck, text: t("adv_fast") },
    { icon: Sprout, text: t("adv_fresh") },
    { icon: HandHeart, text: t("adv_taste") },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-cocoa">
      <div className="pattern-lattice absolute inset-0 opacity-[0.12]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_20%,rgba(199,154,69,0.32),transparent_62%),radial-gradient(90%_80%_at_10%_90%,rgba(181,31,36,0.28),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-6 lg:grid lg:min-h-[43rem] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="font-serif text-[2.4rem] font-bold leading-[1.05] tracking-tight text-[#F7F0E5] sm:text-[3.4rem] lg:text-[4.2rem]">
            {t("hero_h1_a")}
            <br />
            <span className="italic text-saffron">{t("hero_h1_b")}</span>
          </h1>

          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-[#F7F0E5]/75 sm:text-[1.05rem]">
            {t("hero_lead")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => scrollToId("menu")}
              className="flex items-center gap-2.5 rounded-full bg-brand px-7 py-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(181,31,36,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("nav_order_online")}
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => scrollToId("booking")}
              className="flex items-center gap-2.5 rounded-full border border-saffron/50 px-6 py-4 text-[0.92rem] font-semibold text-saffron transition-colors hover:bg-saffron/10"
            >
              <CalendarDays size={16} />
              {t("book_table")}
            </button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
            {advantages.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-[0.82rem] text-[#F7F0E5]/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-saffron/35 text-saffron">
                  <Icon size={15} />
                </span>
                <span className="max-w-[9rem] leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto hidden h-[32rem] w-full max-w-[34rem] lg:block">
          <div className="absolute left-1/2 top-1/2 h-[29rem] w-[29rem] -translate-x-1/2 -translate-y-1/2">
            <Rosette className="h-full w-full text-saffron/30 motion-safe:animate-spinSlow" />
          </div>
          <div
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,154,69,0.35),transparent_70%)]"
            aria-hidden="true"
          />

          {hits.map((item, i) => (
            <HitCard key={item.id} item={item} slot={CARD_SLOTS[i]} />
          ))}

          <div className="absolute bottom-[12%] right-[6%] flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full bg-herb text-center text-[0.68rem] font-semibold leading-tight text-[#F7F0E5] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
            <Leaf size={18} className="text-saffron" />
            {t("badge_natural")}
          </div>
        </div>

        {/* Below the wide layout the seal sits in the corner on its own. */}
        <div className="absolute bottom-8 right-5 hidden h-24 w-24 flex-col items-center justify-center gap-1 rounded-full bg-herb text-center text-[0.6rem] font-semibold leading-tight text-[#F7F0E5] sm:flex lg:hidden">
          <Leaf size={18} className="text-saffron" />
          {t("badge_natural")}
        </div>
      </div>
    </section>
  );
}
