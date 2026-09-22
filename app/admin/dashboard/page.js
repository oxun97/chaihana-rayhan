"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";

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
    <AdminShell title="Дашборд" active="dashboard">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!stats && !error ? (
          <p className="text-sm text-muted">Загрузка…</p>
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
              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <h2 className="font-serif text-base font-bold text-body">Активные заказы по статусам</h2>
                {Object.keys(stats.activeStatusCounts).length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Сейчас нет активных заказов.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {Object.entries(stats.activeStatusCounts).map(([status, count]) => (
                      <li key={status} className="flex items-center justify-between text-sm">
                        <span className="text-body">{STATUS_LABELS[status] || status}</span>
                        <span className="font-semibold text-brand">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <h2 className="font-serif text-base font-bold text-body">
                  Популярные блюда <span className="text-xs font-normal text-muted">(30 дней)</span>
                </h2>
                {stats.topDishes.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Пока нет данных о заказах.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {stats.topDishes.map((d, i) => (
                      <li key={d.name} className="flex items-center justify-between text-sm">
                        <span className="text-body">
                          <span className="mr-2 text-muted">{i + 1}.</span>
                          {d.name}
                        </span>
                        <span className="font-semibold text-brand">{d.qty} шт.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
    </AdminShell>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-body">{value}</p>
    </div>
  );
}
