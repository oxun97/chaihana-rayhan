"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

// Where YooKassa sends the guest back after the hosted payment page. The
// webhook is what actually confirms the payment server-side; this page
// just polls for that result — the wait is normally a couple of seconds,
// sometimes a bit longer if the webhook itself is slow, never a mystery
// (the status endpoint re-checks directly if the webhook hasn't landed
// yet, see app/api/payments/yookassa/status).
const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30s

function PaymentResultContent() {
  const { t } = useLang();
  const { clearCart } = useCart();
  const params = useSearchParams();
  const pendingId = params.get("pending");
  const [state, setState] = useState({ phase: "checking" });
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!pendingId) {
      setState({ phase: "error" });
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts++;
      try {
        const res = await fetch(`/api/payments/yookassa/status?pending=${encodeURIComponent(pendingId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "completed") {
          setState({ phase: "completed", orderNumber: data.orderNumber });
          return;
        }
        if (data.status === "failed") {
          setState({ phase: "failed" });
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setState({ phase: "timeout" });
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelled) return;
        if (attempts >= MAX_ATTEMPTS) {
          setState({ phase: "timeout" });
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [pendingId]);

  // The cart the guest paid for lived in pending_payments.payload, not in
  // this browser's own cart state — clear it here once, the same as any
  // other successful checkout, so it doesn't linger and get ordered again.
  useEffect(() => {
    if (state.phase === "completed" && !clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [state.phase, clearCart]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-[22px] border border-edge/70 bg-card p-7 text-center shadow-soft">
        {(state.phase === "checking") && (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-brand" />
            <h1 className="mt-4 font-serif text-xl font-bold text-body">Проверяем оплату…</h1>
            <p className="mt-2 text-sm text-muted">Обычно это занимает несколько секунд.</p>
          </>
        )}

        {state.phase === "completed" && (
          <>
            <CheckCircle2 size={44} className="mx-auto text-herb" />
            <h1 className="mt-4 font-serif text-xl font-bold text-body">Оплата прошла успешно</h1>
            <p className="mt-2 text-sm text-muted">
              {state.orderNumber ? `Заказ №${state.orderNumber} принят, мы уже готовим.` : "Заказ принят, мы уже готовим."}
            </p>
            <Link
              href="/orders"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              Мои заказы
            </Link>
          </>
        )}

        {state.phase === "failed" && (
          <>
            <XCircle size={44} className="mx-auto text-brand" />
            <h1 className="mt-4 font-serif text-xl font-bold text-body">Оплата не прошла</h1>
            <p className="mt-2 text-sm text-muted">
              Деньги не списаны, заказ не создан. Можно попробовать оформить его ещё раз.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              Вернуться на сайт
            </Link>
          </>
        )}

        {(state.phase === "timeout" || state.phase === "error") && (
          <>
            <Clock size={44} className="mx-auto text-saffron" />
            <h1 className="mt-4 font-serif text-xl font-bold text-body">Проверка занимает больше времени</h1>
            <p className="mt-2 text-sm text-muted">
              Если оплата прошла, заказ появится в разделе «Мои заказы» в течение пары минут. Если
              сомневаетесь — позвоните нам.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
              >
                Мои заказы
              </Link>
              <a href="tel:+79015165789" className="text-sm text-muted hover:text-brand">
                Позвонить: +7 (901) 516-57-89
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultContent />
    </Suspense>
  );
}
