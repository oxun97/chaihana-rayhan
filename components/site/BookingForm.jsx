"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, Check } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function BookingForm() {
  const { t } = useLang();
  const { client } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("19:00");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Prefill from the account without overwriting anything already typed.
  useEffect(() => {
    if (!client) return;
    setName((prev) => prev || client.name || "");
    setPhone((prev) => prev || client.phone || "");
  }, [client]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, guests, date, time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("booking_submit"));
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-herb/30 bg-herb/10 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-herb text-white">
          <Check size={24} />
        </span>
        <p className="font-serif text-xl font-bold text-body">{t("booking_done_title")}</p>
        <p className="text-sm text-muted">{t("booking_done_text")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("checkout_name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("checkout_name_placeholder")}
            className="site-input"
            required
          />
        </Field>
        <Field label={t("checkout_phone")}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
            type="tel"
            className="site-input"
            required
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("booking_guests")} icon={Users}>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="site-input appearance-none"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("booking_date")} icon={CalendarDays}>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="site-input"
            required
          />
        </Field>
        <Field label={t("booking_time")} icon={Clock}>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="site-input"
            required
          />
        </Field>
      </div>

      {error && <p className="text-sm text-brand">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-full bg-brand px-7 py-3.5 text-[0.92rem] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t("booking_submitting") : t("booking_submit")}
      </button>

      <style jsx global>{`
        .site-input {
          width: 100%;
          border-radius: 0.85rem;
          border: 1px solid rgb(var(--edge));
          background: rgb(var(--card));
          color: rgb(var(--body));
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .site-input::placeholder {
          color: rgb(var(--muted));
        }
        .site-input:focus {
          border-color: rgb(var(--brand));
        }
      `}</style>
    </form>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.1em] text-muted">
        {Icon && <Icon size={13} className="text-brand" />}
        {label}
      </span>
      {children}
    </label>
  );
}
