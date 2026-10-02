"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { localized, CATEGORY_EMOJI } from "@/lib/menu";
import { useOverlay } from "@/lib/useOverlay";

const DishModalContext = createContext({ openDish: () => {} });

export function useDishModal() {
  return useContext(DishModalContext);
}

// The dish card on the grid is deliberately terse; tapping it opens the
// full card — big picture, the whole description, add without leaving.
// A bottom sheet on phones, a centred dialog from `sm:` up.
export function DishModalProvider({ children }) {
  const [dishId, setDishId] = useState(null);
  const openDish = useCallback((id) => setDishId(id), []);
  const value = useMemo(() => ({ openDish }), [openDish]);

  return (
    <DishModalContext.Provider value={value}>
      {children}
      <DishModal dishId={dishId} onClose={() => setDishId(null)} />
    </DishModalContext.Provider>
  );
}

function DishModal({ dishId, onClose }) {
  const { lang, t } = useLang();
  const { getItem } = useMenu();
  const { getQty, addItem, setQty } = useCart();
  const item = dishId ? getItem(dishId) : null;
  useOverlay(!!item, onClose);

  const qty = item ? getQty(item.id) : 0;
  const name = item ? localized(item.name, lang) : "";
  const desc = item ? localized(item.desc, lang) : "";

  return (
    <AnimatePresence>
      {item && [
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px]"
        />,
        <div key="wrap" className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={name}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-card shadow-2xl sm:max-w-3xl sm:flex-row sm:rounded-[28px]"
          >
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-body shadow-sm backdrop-blur transition-colors hover:bg-card"
            >
              <X size={20} />
            </button>

            <div className="relative aspect-[4/3] w-full shrink-0 bg-card-sunken sm:aspect-auto sm:w-[52%]">
              {item.imgSrc ? (
                <Image src={item.imgSrc} alt={name} fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
              ) : (
                <div className="flex h-full min-h-[14rem] w-full items-center justify-center text-7xl sm:min-h-[22rem]">
                  {CATEGORY_EMOJI[item.categoryId] || "🍽️"}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <h2 className="pr-10 font-display text-[1.5rem] font-extrabold leading-tight tracking-tight text-body sm:text-[1.75rem]">
                  {name}
                </h2>
                {item.weight && <p className="mt-1 text-[0.9rem] text-muted">{item.weight}</p>}
                {desc && <p className="mt-4 text-[0.95rem] leading-relaxed text-body/80">{desc}</p>}
              </div>

              <div className="mt-5 flex items-center gap-3">
                {qty === 0 ? (
                  <button
                    onClick={() => addItem(item.id)}
                    className="flex min-h-[52px] flex-1 items-center justify-between rounded-2xl bg-brand px-5 text-[1rem] font-semibold text-white transition-transform active:scale-[0.98]"
                  >
                    <span>{t("dish_add")}</span>
                    <span>{item.price} ₽</span>
                  </button>
                ) : (
                  <>
                    <div className="flex min-h-[52px] items-center gap-1 rounded-2xl bg-card-sunken p-1">
                      <button
                        onClick={() => setQty(item.id, qty - 1)}
                        aria-label="−"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-body transition-colors hover:bg-card active:scale-90"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-[1rem] font-bold text-body">{qty}</span>
                      <button
                        onClick={() => setQty(item.id, qty + 1)}
                        aria-label="+"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-body transition-colors hover:bg-card active:scale-90"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex min-h-[52px] flex-1 items-center justify-between rounded-2xl bg-brand px-5 text-[1rem] font-semibold text-white transition-transform active:scale-[0.98]"
                    >
                      <span>{t("dish_done")}</span>
                      <span>{item.price * qty} ₽</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>,
      ]}
    </AnimatePresence>
  );
}
