"use client";

import { useEffect, useState } from "react";

const STATUS_LABELS = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  on_delivery: "В доставке",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch((e) => setError(e.message || "Не удалось загрузить статистику."));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gold/15 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <h1 className="font-serif text-lg font-bold text-ink">Дашборд — Чайхана Райхан</h1>
        <a href="/admin" className="text-xs text-ink-soft underline hover:text-gold">
          Меню
        </a>
        <a href="/admin/orders" className="text-xs text-ink-soft underline hover:text-gold">
          Заказы
        </a>
        <a href="/admin/telegram" className="text-xs text-ink-soft underline hover:text-gold">
          Telegram
        </a>
        <a href="/" className="text-xs text-ink-soft underline hover:text-gold">
          Открыть сайт
        </a>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!stats && !error ? (
          <p className="text-sm text-ink-soft">Загрузка…</p>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile label="Заказов сегодня" value={stats.ordersToday} />
              <StatTile label="Выручка сегодня" value={`${stats.revenueToday} ₽`} />
              <StatTile label="Заказов за 7 дней" value={stats.ordersWeek} />
              <StatTile label="Выручка за 7 дней" value={`${stats.revenueWeek} ₽`} />
              <StatTile label="Средний чек" value={`${stats.avgOrderValue} ₽`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-soft">
                <h2 className="font-serif text-base font-bold text-ink">Активные заказы по статусам</h2>
                {Object.keys(stats.activeStatusCounts).length === 0 ? (
                  <p className="mt-3 text-sm text-ink-soft">Сейчас нет активных заказов.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {Object.entries(stats.activeStatusCounts).map(([status, count]) => (
                      <li key={status} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{STATUS_LABELS[status] || status}</span>
                        <span className="font-semibold text-gold">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-soft">
                <h2 className="font-serif text-base font-bold text-ink">
                  Популярные блюда <span className="text-xs font-normal text-ink-soft">(30 дней)</span>
                </h2>
                {stats.topDishes.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-soft">Пока нет данных о заказах.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {stats.topDishes.map((d, i) => (
                      <li key={d.name} className="flex items-center justify-between text-sm">
                        <span className="text-ink">
                          <span className="mr-2 text-ink-soft">{i + 1}.</span>
                          {d.name}
                        </span>
                        <span className="font-semibold text-gold">{d.qty} шт.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
