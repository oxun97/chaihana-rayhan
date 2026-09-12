"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, PackageOpen } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";

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
  new: "bg-gold/15 text-gold",
  confirmed: "bg-gold/15 text-gold",
  preparing: "bg-gold/15 text-gold",
  ready: "bg-gold/25 text-gold",
  on_delivery: "bg-terracotta/15 text-terracotta",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function OrdersPage() {
  const { t, lang } = useLang();
  const { client, logout, setAuthModalOpen } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (client === undefined) return;
    if (!client) {
      setOrders(null);
      return;
    }
    fetch("/api/auth/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        else setError(data.error || "Не удалось загрузить заказы.");
      })
      .catch(() => setError("Не удалось загрузить заказы."));
  }, [client]);

  return (
    <main className="min-h-screen bg-night px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-parchment-soft hover:text-gold"
          >
            <ArrowLeft size={16} /> {t("hero_title")}
          </Link>
          {client && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm font-medium text-parchment-soft hover:text-terracotta"
            >
              <LogOut size={16} /> {t("nav_logout")}
            </button>
          )}
        </div>

        <h1 className="mb-6 font-serif text-2xl font-bold text-parchment sm:text-3xl">
          {t("my_orders_title")}
        </h1>

        {client === undefined && (
          <p className="text-sm text-parchment-soft">…</p>
        )}

        {client === null && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gold/10 bg-surface px-6 py-14 text-center">
            <PackageOpen size={40} className="text-gold" />
            <p className="text-sm text-parchment-soft">{t("my_orders_login_hint")}</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-night transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("nav_login")}
            </button>
          </div>
        )}

        {client && error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {client && !error && orders === null && (
          <p className="text-sm text-parchment-soft">…</p>
        )}

        {client && orders && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-gold/10 bg-surface px-6 py-14 text-center">
            <PackageOpen size={40} className="text-gold" />
            <p className="text-sm text-parchment-soft">{t("my_orders_empty")}</p>
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

function OrderCard({ order }) {
  const { t, lang } = useLang();
  const date = new Date(order.created_at).toLocaleString(
    lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "ru-RU",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <li className="rounded-2xl border border-gold/10 bg-surface p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-serif text-base font-semibold text-parchment">
            №{order.order_number}
          </span>
          <span className="ml-2 text-xs text-parchment-soft">{date}</span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[order.status] || "bg-white/5 text-parchment-soft"
          }`}
        >
          {t(STATUS_KEYS[order.status] || "status_new")}
        </span>
      </div>

      <ul className="mb-3 flex flex-col gap-1 border-y border-gold/10 py-3 text-sm">
        {(order.order_items || []).map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-parchment-soft">
              {it.name_snapshot} × {it.qty}
            </span>
            <span className="shrink-0 text-parchment">{it.price_snapshot * it.qty} ₽</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <span className="text-parchment-soft">
          {order.method === "pickup" ? t("checkout_method_pickup") : t("checkout_method_delivery")}
          {order.address ? ` · ${order.address}` : ""}
        </span>
        <span className="font-semibold text-gold">{order.total} ₽</span>
      </div>
    </li>
  );
}
