"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, Wallet, CreditCard, ShieldCheck, Lock } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { localized } from "@/lib/menu";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { useVisualViewportHeight } from "@/lib/useVisualViewportHeight";
import { useOverlay } from "@/lib/useOverlay";
import StepIndicator from "@/components/site/StepIndicator";

const STEP_CART = 0;
const STEP_DELIVERY = 1;
const STEP_PAYMENT = 2;

export default function CheckoutModal() {
  const { lang, t } = useLang();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    minDeliveryOrder,
    setQty,
    removeItem,
    isCheckoutOpen,
    setCheckoutOpen,
    clearCart,
  } = useCart();
  const { client } = useAuth();
  const viewportHeight = useVisualViewportHeight();

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [bodyMaxHeight, setBodyMaxHeight] = useState(null);

  const [step, setStep] = useState(STEP_CART);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState("cash");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);

  // Preview only: create_order() re-prices the code, so nothing charged
  // depends on these numbers.
  // CartContext's own deliveryFee always assumes delivery (it has no
  // notion of pickup vs. delivery) — correct for the mini-cart preview
  // before checkout starts, but wrong once "Самовывоз" is picked here.
  const effectiveDeliveryFee = method === "pickup" ? 0 : deliveryFee;
  const effectiveTotal = subtotal + effectiveDeliveryFee;
  const discount = promo?.discount || 0;
  const payable = Math.max(0, effectiveTotal - discount);

  // A courier trip costs the restaurant money regardless of what's in the
  // bag, so delivery (not pickup) carries a minimum — mirrors the same
  // rule enforced in create_order(), which is the real guard.
  const belowMinDelivery = method === "delivery" && subtotal < minDeliveryOrder;

  // Flex's flex-1/min-h-0 shrink math did not reliably constrain height on
  // every mobile browser we tested — the footer ended up clipped with no
  // way to scroll to it. Measuring header/footer in pixels and giving the
  // scrolling body an explicit max-height works everywhere.
  useEffect(() => {
    if (!isCheckoutOpen || !viewportHeight) return;
    const measure = () => {
      const panelMax = viewportHeight * 0.9;
      const headerH = headerRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setBodyMaxHeight(Math.max(140, Math.round(panelMax - headerH - footerH)));
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [isCheckoutOpen, viewportHeight, step, method, items.length]);

  // Prefill from the account when the modal opens, without clobbering
  // anything the customer has already typed.
  useEffect(() => {
    if (!isCheckoutOpen || !client) return;
    setName((prev) => prev || client.name || "");
    setPhone((prev) => prev || client.phone || "");
  }, [isCheckoutOpen, client]);

  // An emptied cart cannot be on a later step.
  useEffect(() => {
    if (items.length === 0 && step !== STEP_CART) setStep(STEP_CART);
  }, [items.length, step]);

  const close = () => {
    setCheckoutOpen(false);
    setStep(STEP_CART);
    setError("");
  };

  useOverlay(isCheckoutOpen, close);

  async function applyPromo() {
    setPromoError("");
    setPromoChecking(true);
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("promo_invalid"));

      if (data.valid) {
        setPromo(data);
      } else {
        setPromo(null);
        const reasons = {
          expired: t("promo_expired"),
          exhausted: t("promo_exhausted"),
          min_subtotal: `${t("promo_min_subtotal")} ${data.min_subtotal} ₽`,
        };
        setPromoError(reasons[data.reason] || t("promo_invalid"));
      }
    } catch (e) {
      setPromo(null);
      setPromoError(e.message || t("promo_invalid"));
    } finally {
      setPromoChecking(false);
    }
  }

  function goNext() {
    setError("");
    if (step === STEP_CART) {
      if (items.length === 0) return;
      setStep(STEP_DELIVERY);
      return;
    }
    if (step === STEP_DELIVERY) {
      if (!name.trim() || !phone.trim()) {
        setError(t("checkout_required"));
        return;
      }
      if (belowMinDelivery) {
        setError(`${t("checkout_min_order")} — ${minDeliveryOrder} ₽`);
        return;
      }
      setStep(STEP_PAYMENT);
    }
  }

  async function submit() {
    setError("");
    setSubmitting(true);

    const customer = { name, phone, method, address, comment };

    // Online card payment takes a different path entirely: no order
    // exists yet (see lib/payments-server.js — it's only created once
    // YooKassa confirms the charge), so there is nothing to send to
    // WhatsApp and the cart must survive an abandoned or failed payment.
    if (payment === "card_online") {
      try {
        const res = await fetch("/api/payments/yookassa/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            items,
            lang,
            promoCode: promo?.code || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.confirmationUrl) {
          throw new Error(data.error || t("checkout_payment_error"));
        }
        // Full navigation, not clearCart()/close(): the guest is leaving
        // for YooKassa's own page and coming back to /order/payment-result
        // — the cart stays intact until payment is actually confirmed.
        window.location.href = data.confirmationUrl;
      } catch (e) {
        setError(e.message || t("checkout_payment_error"));
        setSubmitting(false);
      }
      return;
    }

    // Persisting the order is best-effort: WhatsApp is the guaranteed
    // channel to the restaurant, so a database hiccup must never block the
    // order — it just won't carry an order number.
    let orderNumber = null;
    let priced = { subtotal, deliveryFee: effectiveDeliveryFee, discount: 0, total: effectiveTotal };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items,
          lang,
          promoCode: promo?.code || null,
          paymentMethod: payment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderNumber = data.order?.order_number ?? null;
        if (data.order) {
          priced = {
            subtotal: data.order.subtotal,
            deliveryFee: data.order.delivery_fee,
            discount: data.order.discount || 0,
            total: data.order.total,
          };
        }
      }
    } catch (e) {
      /* offline or API unreachable — still send via WhatsApp below */
    }

    const url = buildWhatsAppOrderUrl({
      lang,
      customer,
      items,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      discount: priced.discount,
      promoCode: priced.discount > 0 ? promo?.code : null,
      paymentLabel: payment === "cash" ? t("pay_cash") : t("pay_card_courier"),
      total: priced.total,
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
    setPromoInput("");
    setPromo(null);
  }

  return (
    <AnimatePresence>
      {isCheckoutOpen && [
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[60] bg-cocoa/60 backdrop-blur-sm"
        />,
        /* Plain flexbox centering, not top-1/2 + a Tailwind translate class:
           Framer Motion writes its own `transform` inline style for the
           panel's y/scale animation, which replaces (not merges with) a
           `-translate-y-1/2` class on the same element — the panel was never
           actually shifted up and its bottom half overflowed off-screen. */
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
            className="checkout-panel flex w-full max-w-md flex-col overflow-hidden rounded-[22px] border border-edge bg-card shadow-lift"
            style={viewportHeight ? { maxHeight: Math.round(viewportHeight * 0.9) } : undefined}
          >
            <div ref={headerRef} className="shrink-0 px-5 pb-4 pt-5">
              <div className="mb-4 flex items-center justify-between">
                {step > STEP_CART ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
                  >
                    <ArrowLeft size={16} /> {t("step_back")}
                  </button>
                ) : (
                  <h3 className="font-serif text-lg font-bold text-body">{t("checkout_title")}</h3>
                )}
                <button
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-card-sunken"
                >
                  ✕
                </button>
              </div>

              <StepIndicator step={step} onStepClick={setStep} />
            </div>

            {/* Only this section scrolls; the footer stays pinned so the
                primary button is always reachable. */}
            <div
              className="checkout-body flex flex-col gap-3.5 overflow-y-auto px-5"
              style={bodyMaxHeight ? { maxHeight: bodyMaxHeight } : undefined}
            >
              {step === STEP_CART && (
                <>
                  {items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted">{t("cart_step_empty")}</p>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center gap-3 rounded-2xl bg-card-sunken/60 p-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.88rem] font-medium text-body">
                              {localized(it.name, lang)}
                            </p>
                            <p className="text-[0.8rem] font-semibold text-body">
                              {it.price * it.qty} ₽
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-full border border-edge bg-card p-1">
                            <button
                              onClick={() => setQty(it.id, it.qty - 1)}
                              aria-label="−"
                              className="flex h-7 w-7 items-center justify-center rounded-full text-body hover:text-brand"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-[1.1rem] text-center text-sm font-semibold text-body">
                              {it.qty}
                            </span>
                            <button
                              onClick={() => setQty(it.id, it.qty + 1)}
                              aria-label="+"
                              className="flex h-7 w-7 items-center justify-center rounded-full text-body hover:text-brand"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(it.id)}
                            aria-label="delete"
                            className="shrink-0 text-muted hover:text-brand"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {items.length > 0 && (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value);
                            setPromo(null);
                            setPromoError("");
                          }}
                          placeholder={t("promo_placeholder")}
                          className="input uppercase"
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          disabled={promoChecking || !promoInput.trim()}
                          className="shrink-0 rounded-xl bg-card-sunken px-4 text-[0.8rem] font-semibold text-body transition-colors hover:text-brand disabled:opacity-50"
                        >
                          {t("promo_apply")}
                        </button>
                      </div>
                      {promo && (
                        <p className="text-sm font-medium text-herb">
                          {t("promo_applied")}: −{promo.discount} ₽
                        </p>
                      )}
                      {promoError && <p className="text-sm text-brand">{promoError}</p>}
                    </>
                  )}
                </>
              )}

              {step === STEP_DELIVERY && (
                <>
                  <div className="flex gap-2 rounded-full bg-card-sunken p-1">
                    {[
                      { key: "delivery", label: t("checkout_method_delivery") },
                      { key: "pickup", label: t("checkout_method_pickup") },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.key}
                        onClick={() => setMethod(m.key)}
                        className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                          method === m.key ? "bg-brand text-white" : "text-muted"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {belowMinDelivery && (
                    <p className="rounded-xl bg-saffron/10 px-3.5 py-2.5 text-[0.8rem] text-cocoa">
                      {t("checkout_min_order")} — {minDeliveryOrder} ₽. {t("checkout_min_order_add")}{" "}
                      <span className="font-semibold">{minDeliveryOrder - subtotal} ₽</span>
                    </p>
                  )}

                  <Field label={t("checkout_name")}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("checkout_name_placeholder")}
                      className="input"
                    />
                  </Field>

                  <Field label={t("checkout_phone")}>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 900 000-00-00"
                      type="tel"
                      className="input"
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
                </>
              )}

              {step === STEP_PAYMENT && (
                <>
                  <p className="text-[0.72rem] font-medium uppercase tracking-[0.1em] text-muted">
                    {t("pay_method")}
                  </p>
                  {[
                    { key: "cash", label: t("pay_cash"), icon: Wallet },
                    { key: "card_courier", label: t("pay_card_courier"), icon: CreditCard },
                    { key: "card_online", label: t("pay_card_online"), icon: ShieldCheck },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setPayment(key)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                        payment === key
                          ? "border-brand bg-brand/5"
                          : "border-edge hover:border-brand/50"
                      }`}
                    >
                      <Icon size={19} className={payment === key ? "text-brand" : "text-muted"} />
                      <span className="flex-1 text-[0.9rem] font-medium text-body">{label}</span>
                      <span
                        className={`h-4 w-4 rounded-full border-[5px] ${
                          payment === key ? "border-brand" : "border-edge"
                        }`}
                      />
                    </button>
                  ))}

                  <dl className="mt-1 flex flex-col gap-1.5 rounded-2xl bg-card-sunken/60 p-3.5 text-sm">
                    <Row label={t("cart_subtotal")} value={`${subtotal} ₽`} />
                    {discount > 0 && (
                      <Row label={t("promo_discount")} value={`−${discount} ₽`} accent="herb" />
                    )}
                    <Row
                      label={t("cart_delivery")}
                      value={effectiveDeliveryFee === 0 ? "—" : `${effectiveDeliveryFee} ₽`}
                    />
                  </dl>
                </>
              )}

              {error && <p className="text-sm text-brand">{error}</p>}
              <div className="pb-1" />
            </div>

            <div ref={footerRef} className="shrink-0 border-t border-edge/70 px-5 pb-5 pt-3.5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted">{t("cart_total")}</span>
                <span className="font-serif text-xl font-bold text-body">{payable} ₽</span>
              </div>

              {step < STEP_PAYMENT ? (
                <button
                  onClick={goNext}
                  disabled={items.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[0.92rem] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("step_next")} <ArrowRight size={17} />
                </button>
              ) : (
                <>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[0.92rem] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? payment === "card_online"
                        ? t("checkout_redirecting")
                        : t("checkout_submitting")
                      : payment === "card_online"
                        ? t("checkout_pay_online")
                        : t("checkout_submit")}
                    {!submitting && <ArrowRight size={17} />}
                  </button>
                  <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[0.72rem] text-muted">
                    <Lock size={12} /> {t("checkout_secure")}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>,
      ]}
      <style jsx global>{`
        .checkout-panel {
          /* vh is computed against the layout viewport, which on mobile can
             be taller than what is actually visible once the address bar is
             showing — that pushed the pinned footer below the screen edge.
             dvh tracks the visible viewport; vh stays as the fallback. */
          max-height: 90vh;
        }
        @supports (height: 100dvh) {
          .checkout-panel {
            max-height: 90dvh;
          }
        }
        /* Fallback for the moment before JS measures header/footer. */
        .checkout-body {
          max-height: 60vh;
        }
        @supports (height: 100dvh) {
          .checkout-body {
            max-height: 60dvh;
          }
        }
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(var(--edge));
          padding: 0.65rem 0.85rem;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          background: rgb(var(--card));
          color: rgb(var(--body));
        }
        .input::placeholder {
          color: rgb(var(--muted));
        }
        .input:focus {
          border-color: rgb(var(--brand));
        }
      `}</style>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent === "herb" ? "font-medium text-herb" : "text-body"}>{value}</dd>
    </div>
  );
}
