"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  LogOut,
  PackageOpen,
  Send,
  Check,
  RotateCcw,
  Clock,
  BadgeCheck,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCircle2,
  XCircle,
  Store,
  MapPin,
} from "lucide-react";
import { fetchFresh } from "@/lib/fetchFresh";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { CATEGORY_EMOJI } from "@/lib/menu";

const STATUS_KEYS = {
  new: "status_new",
  confirmed: "status_confirmed",
  preparing: "status_preparing",
  ready: "status_ready",
  on_delivery: "status_on_delivery",
  delivered: "status_delivered",
  cancelled: "status_cancelled",
};

// The pipeline a live order moves through, used to draw the progress bar.
// "cancelled" is a dead end handled separately, not a step on this track.
const STATUS_STEPS = ["new", "confirmed", "preparing", "ready", "on_delivery", "delivered"];

const STATUS_META = {
  new: { icon: Clock, tone: "saffron" },
  confirmed: { icon: BadgeCheck, tone: "saffron" },
  preparing: { icon: ChefHat, tone: "brand" },
  ready: { icon: PackageCheck, tone: "brand" },
  on_delivery: { icon: Bike, tone: "herb" },
  delivered: { icon: CheckCircle2, tone: "herb" },
  cancelled: { icon: XCircle, tone: "red" },
};

const TONE_CLASSES = {
  saffron: { badge: "bg-saffron/20 text-saffron", bar: "bg-saffron" },
  brand: { badge: "bg-brand/15 text-brand", bar: "bg-brand" },
  herb: { badge: "bg-herb/15 text-herb", bar: "bg-herb" },
  red: { badge: "bg-red-500/15 text-red-400", bar: "bg-red-400" },
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

  const initials =
    client?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <main className="min-h-screen bg-paper px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="-ml-2 flex items-center gap-1.5 rounded-full px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-brand"
          >
            <ArrowLeft size={16} /> {t("hero_title")}
          </Link>
          {client && (
            <button
              onClick={logout}
              className="-mr-2 flex items-center gap-1.5 rounded-full px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-brand"
            >
              <LogOut size={16} /> {t("nav_logout")}
            </button>
          )}
        </div>

        <h1 className="mb-1 font-serif text-2xl font-bold text-body sm:text-3xl">
          {t("my_orders_title")}
        </h1>

        {client && orders !== null && (
          <div className="mb-6 mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-cocoa font-serif text-sm font-bold text-white shadow-soft">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-body">{client.name}</p>
              {orders.length > 0 && (
                <p className="text-xs text-muted">
                  {t("my_orders_subtitle")}: {orders.length}
                </p>
              )}
            </div>
          </div>
        )}

        {(client === undefined || (client && !error && orders === null)) && (
          <div className="mt-6">
            <OrdersSkeleton />
          </div>
        )}

        {client === null && (
          <EmptyState icon={PackageOpen} text={t("my_orders_login_hint")}>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="mt-1 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("nav_login")}
            </button>
          </EmptyState>
        )}

        {client && <TelegramCard />}

        {client && error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {client && orders && orders.length === 0 && (
          <EmptyState icon={PackageOpen} text={t("my_orders_empty")} />
        )}

        {client && orders && orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {orders.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function EmptyState({ icon: Icon, text, children }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[22px] border border-edge/70 bg-card px-6 py-14 text-center shadow-soft">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-saffron/25 to-brand/10 text-brand ring-1 ring-edge/60">
        <Icon size={28} />
      </div>
      <p className="max-w-[22rem] text-sm text-muted">{text}</p>
      {children}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[20px] border border-edge/70 bg-card p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-card-sunken" />
            <div className="h-5 w-20 rounded-full bg-card-sunken" />
          </div>
          <div className="mb-4 h-1.5 w-full rounded-full bg-card-sunken" />
          <div className="flex flex-col gap-2.5 border-y border-edge/70 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-card-sunken" />
              <div className="h-3.5 flex-1 rounded-full bg-card-sunken" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-card-sunken" />
              <div className="h-3.5 flex-1 rounded-full bg-card-sunken" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="h-3.5 w-24 rounded-full bg-card-sunken" />
            <div className="h-3.5 w-14 rounded-full bg-card-sunken" />
          </div>
        </div>
      ))}
    </div>
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
    <div
      className={`mb-5 rounded-[20px] border p-4 shadow-soft transition-colors sm:p-5 ${
        linked ? "border-herb/25 bg-herb/5" : "border-edge/70 bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              linked ? "bg-herb/15 text-herb ring-1 ring-herb/25" : "bg-saffron/20 text-brand"
            }`}
          >
            {linked ? <Check size={18} /> : <Send size={17} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-body">
              {linked ? t("tg_notify_connected") : t("tg_notify_title")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {waiting ? t("tg_notify_waiting") : linked ? t("tg_notify_linked_hint") : t("tg_notify_hint")}
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

function OrderCard({ order, index }) {
  const { t, lang } = useLang();
  const { addItem, setCartOpen } = useCart();
  const { getItem } = useMenu();
  const [repeatNote, setRepeatNote] = useState("");
  const date = new Date(order.created_at).toLocaleString(
    lang === "uz" ? "uz-UZ" : "ru-RU",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
  );

  const meta = STATUS_META[order.status] || STATUS_META.new;
  const tone = TONE_CLASSES[meta.tone];
  const StatusIcon = meta.icon;
  const isCancelled = order.status === "cancelled";
  const stepIndex = STATUS_STEPS.indexOf(order.status);

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
    <li
      className="overflow-hidden rounded-[20px] border border-edge/70 bg-card opacity-0 shadow-soft transition-all duration-300 [animation-fill-mode:forwards] hover:-translate-y-0.5 hover:shadow-card animate-fadeUp"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-serif text-base font-semibold text-body">
              №{order.order_number}
            </span>
            <span className="ml-2 text-xs text-muted">{date}</span>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
          >
            <StatusIcon size={12} />
            {t(STATUS_KEYS[order.status] || "status_new")}
          </span>
        </div>

        {!isCancelled && (
          <div className="mb-4 flex gap-1">
            {STATUS_STEPS.map((step, i) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= stepIndex ? tone.bar : "bg-edge/70"
                }`}
              />
            ))}
          </div>
        )}

        <ul className="mb-3 flex flex-col gap-2.5 border-y border-edge/70 py-3">
          {(order.order_items || []).map((it, i) => {
            const dish = it.dish_id ? getItem(it.dish_id) : null;
            const emoji = (dish && CATEGORY_EMOJI[dish.categoryId]) || "🍽️";
            return (
              <li key={i} className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-card-sunken">
                  {dish?.imgSrc ? (
                    <Image src={dish.imgSrc} alt={it.name_snapshot} fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base">{emoji}</div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">
                  {it.name_snapshot} <span className="text-body">× {it.qty}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-body">{it.price_snapshot * it.qty} ₽</span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-muted">
            {order.method === "pickup" ? <Store size={14} className="shrink-0" /> : <MapPin size={14} className="shrink-0" />}
            <span className="truncate">
              {order.method === "pickup" ? t("checkout_method_pickup") : t("checkout_method_delivery")}
              {order.address ? ` · ${order.address}` : ""}
            </span>
          </span>
          <span className="shrink-0 font-serif text-base font-bold text-brand">{order.total} ₽</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-edge/70 bg-card-sunken/40 px-4 py-3 sm:px-5">
        <span className="text-xs text-muted">{repeatNote}</span>
        <button
          onClick={repeat}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw size={14} />
          {t("repeat_order")}
        </button>
      </div>
    </li>
  );
}
