"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Users, Clock } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const STATUS_LABELS = {
  new: "Новая",
  confirmed: "Подтверждена",
  declined: "Отклонена",
  done: "Завершена",
};

const STATUS_STYLES = {
  new: "bg-saffron/20 text-body",
  confirmed: "bg-herb/15 text-herb",
  declined: "bg-brand/15 text-brand",
  done: "bg-card-sunken text-muted",
};

const FILTERS = ["all", "new", "confirmed", "declined", "done"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  // A second tap before the first response would send a duplicate PATCH, so
  // the guard is a ref: state would only disable the button a render later.
  const inFlight = useRef(false);

  const load = (f = filter) => {
    const qs = f === "all" ? "" : `?status=${f}`;
    fetch(`/api/admin/bookings${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBookings(data.bookings);
      })
      .catch((e) => setError(e.message || "Не удалось загрузить брони."));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function setStatus(id, status) {
    if (inFlight.current) return;
    inFlight.current = true;
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load(filter);
    } catch (e) {
      setError(e.message || "Не удалось обновить бронь.");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <AdminShell title="Бронирования" active="bookings">
      {error && (
        <p className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </p>
      )}

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex min-h-[44px] shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-brand text-white"
                : "border border-edge text-muted hover:border-brand hover:text-brand"
            }`}
          >
            {f === "all" ? "Все" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {bookings === null ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-2xl border border-edge/70 bg-card px-4 py-10 text-center text-sm text-muted">
          Заявок нет.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-2xl border border-edge/70 bg-card p-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-body">{b.customer_name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                >
                  {STATUS_LABELS[b.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                <a
                  href={`tel:${b.customer_phone}`}
                  className="-my-2.5 flex items-center gap-1.5 py-2.5 text-brand hover:underline"
                >
                  <Phone size={14} /> {b.customer_phone}
                </a>
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {b.guests}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {new Date(b.booked_for).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {b.comment && <p className="mt-2 text-sm text-muted">{b.comment}</p>}

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === "new" && (
                  <>
                    <button
                      onClick={() => setStatus(b.id, "confirmed")}
                      className="min-h-[44px] rounded-full bg-herb px-4 text-xs font-semibold text-white"
                    >
                      Подтвердить
                    </button>
                    <button
                      onClick={() => setStatus(b.id, "declined")}
                      className="min-h-[44px] rounded-full border border-edge px-4 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
                    >
                      Отклонить
                    </button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <button
                    onClick={() => setStatus(b.id, "done")}
                    className="min-h-[44px] rounded-full border border-edge px-4 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
                  >
                    Завершить
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
