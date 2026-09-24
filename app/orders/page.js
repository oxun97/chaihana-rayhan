"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, PackageOpen, Send, Check, RotateCcw } from "lucide-react";
import { fetchFresh } from "@/lib/fetchFresh";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";

const STATUS_KEYS = {
  new: "status_new",
  confirmed: "status_confirmed",
  preparing: "status_preparing",
  ready: "status_ready",
  on_delivery: "status_on_delivery",
  delivered: "status_delivered",
  cancelled: "status_cancelled",
};

const STATUS_COLORS = {
  new: "bg-saffron/20 text-brand",
  confirmed: "bg-saffron/20 text-brand",
  preparing: "bg-saffron/20 text-brand",
  ready: "bg-saffron/25 text-brand",
  on_delivery: "bg-brand/15 text-brand",
  delivered: "bg-herb/15 text-herb",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function OrdersPage() {
  const { t } = useLang();
  const { client, logout, setAuthModalOpen } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  // Keyed on the account id rather than the client object: the Telegram
  // card below polls the session while waiting for the link, and every poll
  // hands back a fresh object — depending on it would re-fetch the whole
  // order list on each tick.
  const clientId = client === undefined ? undefined : client?.id ?? null;

  useEffect(() => {
    if (clientId === undefined) return;
    if (clientId === null) {
      setOrders(null);
      return;
    }
    fetchFresh("/api/auth/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        else setError(data.error || "Не удалось загрузить заказы.");
      })
      .catch(() => setError("Не удалось загрузить заказы."));
  }, [clientId]);

  return (
    <main className="min-h-screen bg-paper px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="-ml-2 flex items-center gap-1.5 px-2 py-3 text-sm font-medium text-muted hover:text-brand"
          >
            <ArrowLeft size={16} /> {t("hero_title")}
          </Link>
          {client && (
            <button
              onClick={logout}
              className="-mr-2 flex items-center gap-1.5 px-2 py-3 text-sm font-medium text-muted hover:text-brand"
            >
              <LogOut size={16} /> {t("nav_logout")}
            </button>
          )}
        </div>

        <h1 className="mb-6 font-serif text-2xl font-bold text-body sm:text-3xl">
          {t("my_orders_title")}
        </h1>

        {client === undefined && (
          <p className="text-sm text-muted">…</p>
        )}

        {client === null && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-edge/70 bg-card px-6 py-14 text-center">
            <PackageOpen size={40} className="text-brand" />
            <p className="text-sm text-muted">{t("my_orders_login_hint")}</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("nav_login")}
            </button>
          </div>
        )}

        {client && <TelegramCard />}

        {client && error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {client && !error && orders === null && (
          <p className="text-sm text-muted">…</p>
        )}

        {client && orders && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge/70 bg-card px-6 py-14 text-center">
            <PackageOpen size={40} className="text-brand" />
            <p className="text-sm text-muted">{t("my_orders_empty")}</p>
          </div>
        )}

        {client && orders && orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

// Waiting for the customer to press Start inside Telegram: the link only
// completes on Telegram's side, so the page polls its own session until the
// webhook has recorded the chat. Capped so a closed Telegram tab doesn't
// leave a request loop running forever.
const LINK_POLL_INTERVAL_MS = 3000;
const LINK_POLL_TIMEOUT_MS = 120000;

function TelegramCard() {
  const { t } = useLang();
  const { client, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);
  const linked = !!client?.telegramLinked;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  };

  useEffect(() => {
    if (linked) stopPolling();
  }, [linked]);

  // Clear the interval if the customer navigates away mid-wait.
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function connect() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/telegram-link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("tg_notify_unavailable"));

      window.open(data.url, "_blank", "noopener,noreferrer");
      setWaiting(true);

      const startedAt = Date.now();
      pollRef.current = setInterval(() => {
        if (Date.now() - startedAt > LINK_POLL_TIMEOUT_MS) {
          stopPolling();
          return;
        }
        refresh();
      }, LINK_POLL_INTERVAL_MS);
    } catch (e) {
      setError(e.message || t("tg_notify_unavailable"));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setError("");
    setBusy(true);
    stopPolling();
    try {
      const res = await fetch("/api/auth/telegram-link", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("tg_notify_unavailable"));
      }
      refresh();
    } catch (e) {
      setError(e.message || t("tg_notify_unavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-edge/70 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              linked ? "bg-herb/15 text-herb" : "bg-saffron/20 text-brand"
            }`}
          >
            {linked ? <Check size={17} /> : <Send size={16} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-body">
              {linked ? t("tg_notify_connected") : t("tg_notify_title")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {waiting ? t("tg_notify_waiting") : linked ? "" : t("tg_notify_hint")}
            </p>
          </div>
        </div>

        <button
          onClick={linked ? disconnect : connect}
          disabled={busy}
          className={`min-h-[44px] shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            linked
              ? "border border-edge text-muted hover:text-brand"
              : "bg-brand text-white"
          }`}
        >
          {linked ? t("tg_notify_disconnect") : t("tg_notify_connect")}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function OrderCard({ order }) {
  const { t, lang } = useLang();
  const { addItem, setCartOpen } = useCart();
  const { getItem } = useMenu();
  const [repeatNote, setRepeatNote] = useState("");
  const date = new Date(order.created_at).toLocaleString(
    lang === "uz" ? "uz-UZ" : "ru-RU",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
  );

  // Re-orders by dish id, not by the line snapshot: a dish that has since
  // been removed or taken off sale is skipped and reported rather than
  // silently dropped or added at its old price.
  function repeat() {
    const lines = order.order_items || [];
    let added = 0;
    for (const line of lines) {
      if (line.dish_id && getItem(line.dish_id)) {
        addItem(line.dish_id, line.qty);
        added += 1;
      }
    }

    if (added === 0) {
      setRepeatNote(t("repeat_none"));
      return;
    }
    setRepeatNote(added < lines.length ? t("repeat_partial") : t("repeat_added"));
    setCartOpen(true);
  }

  return (
    <li className="rounded-2xl border border-edge/70 bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-serif text-base font-semibold text-body">
            №{order.order_number}
          </span>
          <span className="ml-2 text-xs text-muted">{date}</span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[order.status] || "bg-white/5 text-muted"
          }`}
        >
          {t(STATUS_KEYS[order.status] || "status_new")}
        </span>
      </div>

      <ul className="mb-3 flex flex-col gap-1 border-y border-edge/70 py-3 text-sm">
        {(order.order_items || []).map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-muted">
              {it.name_snapshot} × {it.qty}
            </span>
            <span className="shrink-0 text-body">{it.price_snapshot * it.qty} ₽</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {order.method === "pickup" ? t("checkout_method_pickup") : t("checkout_method_delivery")}
          {order.address ? ` · ${order.address}` : ""}
        </span>
        <span className="font-semibold text-brand">{order.total} ₽</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-edge/70 pt-3">
        <span className="text-xs text-muted">{repeatNote}</span>
        <button
          onClick={repeat}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-xs font-semibold text-body transition-colors hover:border-brand hover:text-brand"
        >
          <RotateCcw size={14} />
          {t("repeat_order")}
        </button>
      </div>
    </li>
  );
}
