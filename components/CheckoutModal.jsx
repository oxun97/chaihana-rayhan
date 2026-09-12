"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { useVisualViewportHeight } from "@/lib/useVisualViewportHeight";

export default function CheckoutModal() {
  const { lang, t } = useLang();
  const { items, subtotal, deliveryFee, total, isCheckoutOpen, setCheckoutOpen, clearCart } =
    useCart();
  const { client } = useAuth();
  const viewportHeight = useVisualViewportHeight();

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [formMaxHeight, setFormMaxHeight] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Flex's flex-1/min-h-0 shrink math (the usual way to make only the
  // middle section scroll) turned out not to reliably constrain height on
  // every mobile browser we tested against — the footer ended up clipped
  // away with no way to scroll to it. Measuring the header/footer in
  // pixels and giving the form an explicit max-height sidesteps flexbox's
  // shrink behavior entirely: plain max-height + overflow-y-auto on a
  // definite pixel value works everywhere.
  useEffect(() => {
    if (!isCheckoutOpen || !viewportHeight) return;
    const measure = () => {
      const panelMax = viewportHeight * 0.88;
      const headerH = headerRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setFormMaxHeight(Math.max(120, Math.round(panelMax - headerH - footerH)));
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [isCheckoutOpen, viewportHeight, method]);

  // Prefill from the logged-in account when the modal opens, without
  // clobbering anything the customer has already typed.
  useEffect(() => {
    if (!isCheckoutOpen || !client) return;
    setName((prev) => prev || client.name || "");
    setPhone((prev) => prev || client.phone || "");
  }, [isCheckoutOpen, client]);

  const close = () => setCheckoutOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(t("checkout_required"));
      return;
    }
    setError("");
    setSubmitting(true);

    const customer = { name, phone, method, address, comment };

    // Persisting the order is best-effort: WhatsApp is the guaranteed
    // delivery channel to the restaurant, so a database hiccup must never
    // block the order from going out — it just won't have an order number.
    let orderNumber = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        orderNumber = data.order?.order_number ?? null;
      }
    } catch (e) {
      /* offline or API unreachable — still send via WhatsApp below */
    }

    const url = buildWhatsAppOrderUrl({
      lang,
      customer,
      items,
      subtotal,
      deliveryFee,
      total,
      orderNumber,
    });

    window.open(url, "_blank", "noopener,noreferrer");
    clearCart();
    close();
    setSubmitting(false);
    setName("");
    setPhone("");
    setAddress("");
    setComment("");
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && [
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-night/70 backdrop-blur-sm"
          />,
          /* Plain flexbox centering, not top-1/2 + a Tailwind translate
             class: Framer Motion writes its own `transform` inline style
             for the panel's y/scale animation, which completely replaces
             (not merges with) a `-translate-y-1/2` class on that same
             element — so the panel was never actually shifted up by 50%
             and its bottom half silently overflowed off-screen whenever
             it was taller than half the viewport. Centering via a
             non-animated wrapper sidesteps the conflict entirely. */
          <div
            key="panel-wrapper"
            className="fixed inset-x-4 inset-y-0 z-[60] flex items-center justify-center"
            onClick={close}
          >
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="checkout-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gold/15 bg-surface shadow-lift"
              style={viewportHeight ? { maxHeight: Math.round(viewportHeight * 0.88) } : undefined}
            >
            <div ref={headerRef} className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
              <h3 className="font-serif text-xl font-bold text-parchment">{t("checkout_title")}</h3>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-parchment-soft hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Only this section scrolls — the total/submit footer below
                stays pinned so the order button is always reachable, even
                when the form is taller than the viewport (long labels,
                delivery address field, mobile browser chrome eating into
                the visible height, etc.). Height is measured in JS
                (formMaxHeight) rather than left to flexbox's flex-1/min-h-0
                shrink math, which some mobile browsers didn't apply
                correctly, letting the footer get clipped away with no way
                to scroll to it. */}
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="checkout-form-fields flex flex-col gap-3.5 overflow-y-auto px-6"
              style={formMaxHeight ? { maxHeight: formMaxHeight } : undefined}
            >
              <div className="flex gap-2 rounded-full bg-night p-1">
                {[
                  { key: "delivery", label: t("checkout_method_delivery") },
                  { key: "pickup", label: t("checkout_method_pickup") },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                      method === m.key ? "bg-gold text-night" : "text-parchment-soft"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <Field label={t("checkout_name")}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("checkout_name_placeholder")}
                  className="input"
                  required
                />
              </Field>

              <Field label={t("checkout_phone")}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  type="tel"
                  className="input"
                  required
                />
              </Field>

              {method === "delivery" && (
                <Field label={t("checkout_address")}>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("checkout_address_placeholder")}
                    className="input"
                  />
                </Field>
              )}

              <Field label={t("checkout_comment")}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("checkout_comment_placeholder")}
                  rows={2}
                  className="input resize-none"
                />
              </Field>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* Bottom padding so the last field never sits flush against
                  the pinned footer below. */}
              <div className="pb-1" />
            </form>

            <div ref={footerRef} className="shrink-0 border-t border-gold/10 px-6 pb-6 pt-4">
              <div className="flex items-center justify-between rounded-xl bg-night px-4 py-3">
                <span className="text-sm text-parchment-soft">{t("cart_total")}</span>
                <span className="text-lg font-semibold text-gold">{total} ₽</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WhatsAppIcon /> {submitting ? t("checkout_submitting") : t("checkout_submit")}
              </button>
              <p className="mt-2 text-center text-[0.72rem] text-parchment-soft">
                {t("checkout_disclaimer")}
              </p>
            </div>
            </motion.div>
          </div>,
      ]}
      <style jsx global>{`
        .checkout-panel {
          /* vh is computed against the layout viewport, which on mobile
             can be taller than what's actually visible once the browser's
             address bar is showing — that pushed the pinned total/submit
             footer below the real screen edge. dvh tracks the visible
             viewport instead; vh above stays as a fallback for browsers
             that don't support dvh yet. */
          max-height: 88vh;
        }
        @supports (height: 100dvh) {
          .checkout-panel {
            max-height: 88dvh;
          }
        }
        /* Fallback for the brief moment before JS measures the header/
           footer and sets an explicit pixel max-height inline (or if JS
           is disabled) — same reasoning as .checkout-panel above. */
        .checkout-form-fields {
          max-height: 60vh;
        }
        @supports (height: 100dvh) {
          .checkout-form-fields {
            max-height: 60dvh;
          }
        }
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(200, 155, 60, 0.25);
          padding: 0.6rem 0.85rem;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          background: #0b0b0b;
          color: #f5e6c8;
        }
        .input::placeholder {
          color: rgba(245, 230, 200, 0.45);
        }
        .input:focus {
          border-color: #c89b3c;
        }
      `}</style>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.75rem] font-medium text-parchment-soft">{label}</span>
      {children}
    </label>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31A8.2 8.2 0 1 1 20.24 12a8.2 8.2 0 0 1-8.2 8.2zm4.5-6.13c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.96-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.53.12.17 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
    </svg>
  );
}
