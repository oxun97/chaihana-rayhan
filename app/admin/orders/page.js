"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_LABELS = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  on_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const STATUS_COLORS = {
  new: "bg-gold/15 text-gold-dark",
  confirmed: "bg-teal/15 text-teal-dark",
  preparing: "bg-teal/15 text-teal-dark",
  ready: "bg-gold/25 text-ink",
  on_delivery: "bg-terracotta/15 text-terracotta-dark",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

// Mirrors ADMIN_TRANSITIONS in lib/orders-server.js — the server is the
// source of truth; this is only used to decide which buttons to show.
const ADMIN_NEXT = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled"],
  on_delivery: ["cancelled"],
  delivered: [],
  cancelled: [],
};

const STATUS_FILTERS = ["all", "new", "confirmed", "preparing", "ready", "on_delivery", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [couriers, setCouriers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const loadOrders = () => {
    const qs = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/admin/orders${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrders(data.orders);
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message || "Не удалось загрузить заказы."));
  };

  const loadCouriers = () => {
    fetch("/api/admin/couriers")
      .then((res) => res.json())
      .then((data) => setCouriers(data.couriers || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadOrders();
    const id = setInterval(loadOrders, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    loadCouriers();
  }, []);

  async function changeStatus(orderId, status) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadOrders();
    } catch (e) {
      alert(e.message || "Не удалось изменить статус.");
    } finally {
      setBusyId(null);
    }
  }

  async function assignCourier(orderId, courierId) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId: courierId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadOrders();
    } catch (e) {
      alert(e.message || "Не удалось назначить курьера.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gold/15 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <h1 className="font-serif text-lg font-bold text-ink">Заказы — Чайхана Райхан</h1>
        <a href="/admin" className="text-xs text-ink-soft underline hover:text-gold">
          Меню
        </a>
        <a href="/" className="text-xs text-ink-soft underline hover:text-gold">
          Открыть сайт
        </a>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s ? "bg-ink text-cream" : "bg-white text-ink-soft hover:bg-gold/10"
              }`}
            >
              {s === "all" ? "Все" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loadError && <p className="text-sm text-red-500">{loadError}</p>}

        {orders === null ? (
          <p className="text-sm text-ink-soft">Загрузка…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-ink-soft">Заказов пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                couriers={couriers}
                busy={busyId === order.id}
                onChangeStatus={(status) => changeStatus(order.id, status)}
                onAssignCourier={(courierId) => assignCourier(order.id, courierId)}
              />
            ))}
          </ul>
        )}

        <CourierManager couriers={couriers} onCreated={loadCouriers} />
      </div>
    </div>
  );
}

function OrderCard({ order, couriers, busy, onChangeStatus, onAssignCourier }) {
  const next = ADMIN_NEXT[order.status] || [];
  const canAssignCourier = order.status !== "delivered" && order.status !== "cancelled";
  const createdAt = new Date(order.created_at).toLocaleString("ru-RU");

  return (
    <li className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-bold text-ink">№{order.order_number}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">{createdAt}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-ink">{order.customer_name}</p>
          <a href={`tel:${order.customer_phone}`} className="text-gold hover:underline">
            {order.customer_phone}
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
        <span>{order.method === "pickup" ? "Самовывоз" : "Доставка"}</span>
        {order.address && <span>{order.address}</span>}
        {order.comment && <span>Комментарий: {order.comment}</span>}
      </div>

      <ul className="mt-3 flex flex-col gap-0.5 border-t border-gold/10 pt-2 text-sm text-ink">
        {(order.order_items || []).map((it) => (
          <li key={it.id} className="flex justify-between">
            <span>
              {it.name_snapshot} × {it.qty}
            </span>
            <span className="text-ink-soft">{it.price_snapshot * it.qty} ₽</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex justify-between border-t border-gold/10 pt-2 text-sm font-semibold text-ink">
        <span>Итого</span>
        <span className="text-gold">{order.total} ₽</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {next.map((status) => (
          <button
            key={status}
            disabled={busy}
            onClick={() => onChangeStatus(status)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              status === "cancelled"
                ? "border border-red-300 text-red-500 hover:bg-red-50"
                : "bg-gold text-ink hover:bg-gold-dark hover:text-white"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}

        {canAssignCourier && (
          <select
            value={order.courier_id || ""}
            disabled={busy}
            onChange={(e) => onAssignCourier(e.target.value)}
            className="admin-input ml-auto"
          >
            <option value="">Курьер не назначен</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <style jsx global>{`
        .admin-input {
          border-radius: 0.5rem;
          border: 1px solid rgba(201, 169, 110, 0.3);
          padding: 0.4rem 0.65rem;
          font-size: 0.8rem;
          outline: none;
          background: #fdfcf8;
        }
      `}</style>
    </li>
  );
}

function CourierManager({ couriers, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      setPhone("");
      setPassword("");
      setOpen(false);
      onCreated();
    } catch (e) {
      setError(e.message || "Не удалось создать курьера.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base font-bold text-ink">Курьеры</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-gold hover:text-gold"
        >
          {open ? "Отмена" : "+ Курьер"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleCreate} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-ink-soft">
            Имя
            <input value={name} onChange={(e) => setName(e.target.value)} className="admin-input" required />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-soft">
            Телефон
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
              className="admin-input"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-soft">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              required
              minLength={6}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-dark hover:text-white disabled:opacity-50"
          >
            {saving ? "Создание…" : "Создать"}
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </form>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {couriers.length === 0 && <li className="text-xs text-ink-soft">Курьеров пока нет.</li>}
        {couriers.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-sm text-ink">
            <span>{c.name}</span>
            <span className="text-ink-soft">{c.phone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
