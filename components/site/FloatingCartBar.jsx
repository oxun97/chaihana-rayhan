"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

// Phones: once something is in the basket, a full-width cart button rides
// at the bottom of the screen — always one tap from checkout, as in the
// delivery apps. Hidden while the cart or checkout is already open.
export default function FloatingCartBar() {
  const { t } = useLang();
  const { itemCount, total, discount, isCartOpen, isCheckoutOpen, setCartOpen } = useCart();
  const visible = itemCount > 0 && !isCartOpen && !isCheckoutOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="flex h-14 w-full items-center gap-3 rounded-2xl bg-brand px-4 text-white shadow-[0_12px_30px_-10px_rgba(200,32,38,0.6)] transition-transform active:scale-[0.98]"
          >
            <span className="relative">
              <ShoppingBag size={21} />
              <span className="absolute -right-2 -top-1.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-white px-1 text-[0.62rem] font-bold text-brand">
                {itemCount}
              </span>
            </span>
            <span className="flex-1 text-left text-[0.98rem] font-semibold">{t("cart_title")}</span>
            <span className="text-[0.98rem] font-bold">{Math.max(0, total - discount)} ₽</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
