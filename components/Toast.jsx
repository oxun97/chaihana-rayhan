"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";

export default function Toast() {
  const { lang, t } = useLang();
  const { lastAdded } = useCart();
  const { getItem, localized } = useMenu();
  const item = lastAdded ? getItem(lastAdded) : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
      <AnimatePresence>
        {item && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.8rem] text-white shadow-lift"
          >
            <span className="text-gold">✓</span>
            <span>
              {localized(item.name, lang)} — {t("toast_added")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
