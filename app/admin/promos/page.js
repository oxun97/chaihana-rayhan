"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { fetchFresh } from "@/lib/fetchFresh";

const TONES = [
  { value: "red", label: "Красная" },
  { value: "green", label: "Зелёная" },
  { value: "gold", label: "Золотая" },
];

const emptyCode = {
  code: "",
  kind: "percent",
  value: 10,
  minSubtotal: 0,
  maxUses: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState(null);
  const [codes, setCodes] = useState([]);
  const [draft, setDraft] = useState(emptyCode);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    fetchFresh("/api/admin/promos")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPromos(data.promos);
        setCodes(data.codes);
      })
      .catch((e) => setError(e.message || "Не удалось загрузить данные."));
  };

  useEffect(load, []);

  function patchPromo(id, patch) {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSaved(false);
  }

  async function savePromos() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
    } catch (e) {
      setError(e.message || "Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCode(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(emptyCode);
      load();
    } catch (e) {
      setError(e.message || "Не удалось сохранить промокод.");
    }
  }

  async function removeCode(code) {
    if (!window.confirm(`Удалить промокод ${code}?`)) return;
    await fetch(`/api/admin/promos?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    load();
  }

  return (
    <AdminShell title="Акции и промокоды" active="promos">
      {error && (
        <p className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-edge/70 bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-body">Акции на главной</h2>
          <button
            onClick={savePromos}
            disabled={saving || !promos}
            className="min-h-[44px] rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Сохраняем…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </div>

        {promos === null ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {promos.map((p) => (
              <div key={p.id} className="rounded-xl border border-edge/70 p-3.5">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-card-sunken px-2 py-0.5 text-xs text-muted">{p.id}</code>
                  <select
                    value={p.tone}
                    onChange={(e) => patchPromo(p.id, { tone: e.target.value })}
                    className="admin-field"
                  >
                    {TONES.map((tone) => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex min-h-[44px] items-center gap-1.5 py-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={p.is_active}
                      onChange={(e) => patchPromo(p.id, { is_active: e.target.checked })}
                    />
                    Показывать
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={p.title_ru || ""}
                    onChange={(e) => patchPromo(p.id, { title_ru: e.target.value })}
                    placeholder="Заголовок (RU)"
                    className="admin-field"
                  />
                  <input
                    value={p.title_uz || ""}
                    onChange={(e) => patchPromo(p.id, { title_uz: e.target.value })}
                    placeholder="Sarlavha (UZ)"
                    className="admin-field"
                  />
                  <input
                    value={p.body_ru || ""}
                    onChange={(e) => patchPromo(p.id, { body_ru: e.target.value })}
                    placeholder="Описание (RU)"
                    className="admin-field"
                  />
                  <input
                    value={p.body_uz || ""}
                    onChange={(e) => patchPromo(p.id, { body_uz: e.target.value })}
                    placeholder="Tavsif (UZ)"
                    className="admin-field"
                  />
                  <input
                    value={p.action_ru || ""}
                    onChange={(e) => patchPromo(p.id, { action_ru: e.target.value })}
                    placeholder="Кнопка (RU), пусто — без кнопки"
                    className="admin-field"
                  />
                  <input
                    value={p.action_uz || ""}
                    onChange={(e) => patchPromo(p.id, { action_uz: e.target.value })}
                    placeholder="Tugma (UZ)"
                    className="admin-field"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-edge/70 bg-card p-4 sm:p-5">
        <h2 className="mb-4 font-serif text-lg font-bold text-body">Промокоды</h2>

        <form onSubmit={saveCode} className="mb-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            placeholder="КОД"
            className="admin-field uppercase"
            required
          />
          <select
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
            className="admin-field"
          >
            <option value="percent">Процент</option>
            <option value="fixed">Сумма ₽</option>
          </select>
          <input
            type="number"
            min="1"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            placeholder="Скидка"
            className="admin-field"
            required
          />
          <input
            type="number"
            min="0"
            value={draft.minSubtotal}
            onChange={(e) => setDraft({ ...draft, minSubtotal: e.target.value })}
            placeholder="От суммы"
            className="admin-field"
          />
          <input
            type="number"
            min="1"
            value={draft.maxUses}
            onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })}
            placeholder="Лимит"
            className="admin-field"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-brand px-4 text-sm font-semibold text-white"
          >
            Добавить
          </button>
        </form>

        {codes.length === 0 ? (
          <p className="text-sm text-muted">Промокодов пока нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-edge/60">
            {codes.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                <code className="font-semibold text-body">{c.code}</code>
                <span className="text-muted">
                  {c.kind === "percent" ? `−${c.value}%` : `−${c.value} ₽`}
                </span>
                {c.min_subtotal > 0 && (
                  <span className="text-muted">от {c.min_subtotal} ₽</span>
                )}
                <span className="text-muted">
                  использован {c.used_count}
                  {c.max_uses ? ` / ${c.max_uses}` : ""}
                </span>
                {!c.is_active && <span className="text-brand">выключен</span>}
                <button
                  onClick={() => removeCode(c.code)}
                  className="-my-2.5 ml-auto min-h-[44px] px-2 py-2.5 text-xs text-brand hover:underline"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
