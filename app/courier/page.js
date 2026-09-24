"use client";

import { useEffect, useRef, useState } from "react";
import { fetchFresh } from "@/lib/fetchFresh";

export default function CourierPage() {
  const [courier, setCourier] = useState(undefined); // undefined = loading, null = logged out

  const loadMe = () => {
    fetchFresh("/api/courier/me")
      .then((res) => res.json())
      .then((data) => setCourier(data.courier))
      .catch(() => setCourier(null));
  };

  useEffect(() => {
    loadMe();
  }, []);

  if (courier === undefined) {
    return <CenteredMessage>Загрузка…</CenteredMessage>;
  }

  if (!courier) {
    return <LoginForm onLoggedIn={setCourier} />;
  }

  return <OrdersBoard courier={courier} onLoggedOut={() => setCourier(null)} />;
}

function LoginForm({ onLoggedIn }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/courier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLoggedIn(data.courier);
    } catch (e) {
      setError(e.message || "Не удалось войти.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-card p-6 shadow-soft"
      >
        <h1 className="mb-1 text-center font-serif text-xl font-bold text-body">
          Вход для курьера
        </h1>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Телефон
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
            className="courier-input"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="courier-input"
            required
          />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Входим…" : "Войти"}
        </button>
        <style jsx global>{`
          .courier-input {
            border-radius: 0.6rem;
            border: 1px solid rgb(var(--edge));
            padding: 0.55rem 0.75rem;
            font-size: 0.85rem;
            outline: none;
            background: rgb(var(--card));
          }
        `}</style>
      </form>
    </div>
  );
}

function OrdersBoard({ courier, onLoggedOut }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  // Same race as /admin/orders: the 12s poll and the reload after take()/
  // complete() can resolve out of order and silently undo the courier's
  // own action on screen. See the comment there.
  const loadTicket = useRef(0);

  const load = () => {
    const ticket = ++loadTicket.current;
    fetchFresh("/api/courier/orders")
      .then((res) => res.json())
      .then((d) => {
        if (ticket !== loadTicket.current) return;
        if (d.error) throw new Error(d.error);
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (ticket !== loadTicket.current) return;
        setError(e.message || "Не удалось загрузить заказы.");
      });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, []);

  async function take(orderId) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/courier/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "on_delivery" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch (e) {
      alert(e.message || "Не удалось взять заказ.");
    } finally {
      setBusyId(null);
    }
  }

  async function complete(orderId) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/courier/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch (e) {
      alert(e.message || "Не удалось завершить заказ.");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/courier/logout", { method: "POST" }).catch(() => {});
    onLoggedOut();
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-lg font-bold text-body">Привет, {courier.name}</h1>
          <button onClick={logout} className="-mr-2 flex min-h-[44px] items-center px-2 text-xs text-muted underline hover:text-brand">
            Выйти
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Мои заказы</h2>
          {!data ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : data.mine.length === 0 ? (
            <p className="text-sm text-muted">Нет заказов в доставке.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.mine.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <button
                    disabled={busyId === order.id}
                    onClick={() => complete(order.id)}
                    className="min-h-[48px] w-full rounded-full bg-brand py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Доставлено
                  </button>
                </OrderCard>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Доступные заказы</h2>
          {!data ? null : data.available.length === 0 ? (
            <p className="text-sm text-muted">Пока нет заказов, готовых к доставке.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.available.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <button
                    disabled={busyId === order.id}
                    onClick={() => take(order.id)}
                    className="min-h-[48px] w-full rounded-full border-2 border-edge py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
                  >
                    Взять в доставку
                  </button>
                </OrderCard>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function OrderCard({ order, children }) {
  return (
    <li className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-bold text-body">№{order.order_number}</span>
        <span className="text-sm font-semibold text-brand">{order.total} ₽</span>
      </div>
      <p className="mt-1 text-sm text-body">{order.customer_name}</p>
      <a
        href={`tel:${order.customer_phone}`}
        className="-my-2.5 inline-block py-2.5 text-sm text-brand hover:underline"
      >
        {order.customer_phone}
      </a>
      {order.address && <p className="mt-1 text-sm text-muted">{order.address}</p>}
      {order.comment && <p className="mt-1 text-xs text-muted">Комментарий: {order.comment}</p>}
      <div className="mt-3">{children}</div>
    </li>
  );
}

function CenteredMessage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}
