"use client";

import { useEffect, useState } from "react";

// Shown by the error boundaries when a render fails. Styled inline, with no
// dependency on the app's CSS, providers or fonts, because the thing that
// broke may be exactly one of those.
//
// The important part is the second button. A crash caused by a value the
// browser has kept (an old cart, stale favourites, a superseded service
// worker) comes back on every reload, and the guest has no way out. Clearing
// the site's own storage and caches gives them one, without having to find
// Chrome's settings.
export default function ErrorScreen({ error, reset }) {
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // The boundary swallows the error; keep the real one in the console so
    // it can still be read off a real device.
    console.error("Чайхана Райхан — сбой отрисовки:", error);
  }, [error]);

  async function hardReset() {
    setClearing(true);
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (e) {
      /* storage blocked — nothing to clear */
    }
    try {
      if (window.caches) {
        const names = await window.caches.keys();
        await Promise.all(names.map((n) => window.caches.delete(n)));
      }
    } catch (e) {
      /* ignore */
    }
    try {
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      /* ignore */
    }
    window.location.replace("/");
  }

  return (
    <div style={S.page}>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .chr-error-page { background: #1a0e09 !important; color: #f7f0e5 !important; }
          .chr-error-page .chr-muted { color: #baa58f !important; }
          .chr-error-page .chr-ghost { border-color: #4a3021 !important; color: #baa58f !important; }
        }
      `}</style>

      <div className="chr-error-page" style={S.inner}>
        <svg viewBox="0 0 48 48" style={S.mark} aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round">
            <rect x="11" y="11" width="26" height="26" rx="3" />
            <rect x="11" y="11" width="26" height="26" rx="3" transform="rotate(45 24 24)" />
          </g>
          <circle cx="24" cy="24" r="5.2" fill="currentColor" />
        </svg>

        <h1 style={S.title}>Страница не открылась</h1>
        <p className="chr-muted" style={S.lead}>
          Что-то сломалось на нашей стороне. Попробуйте обновить — а если не помогает, сбросьте
          сохранённые данные сайта: корзина очистится, всё остальное продолжит работать.
        </p>

        <div style={S.actions}>
          <button type="button" onClick={() => (reset ? reset() : window.location.reload())} style={S.primary}>
            Обновить страницу
          </button>
          <button
            type="button"
            onClick={hardReset}
            disabled={clearing}
            className="chr-ghost"
            style={{ ...S.ghost, opacity: clearing ? 0.6 : 1 }}
          >
            {clearing ? "Сбрасываем…" : "Сбросить данные сайта"}
          </button>
        </div>

        <p className="chr-muted" style={S.phone}>
          Заказать можно по телефону:{" "}
          <a href="tel:+79015165789" style={S.link}>
            +7 (901) 516-57-89
          </a>
        </p>

        {error?.digest && (
          <p className="chr-muted" style={S.digest}>
            код ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background: "#f7f0e5",
    color: "#24140d",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  inner: { maxWidth: "26rem", textAlign: "center", background: "transparent" },
  mark: { width: 52, height: 52, margin: "0 auto 18px", color: "#b51f24", display: "block" },
  title: {
    margin: "0 0 10px",
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: "1.55rem",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  lead: { margin: "0 0 22px", fontSize: "0.92rem", lineHeight: 1.6, color: "#7a6354" },
  actions: { display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" },
  primary: {
    padding: "14px 22px",
    border: 0,
    borderRadius: 999,
    background: "#b51f24",
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  ghost: {
    padding: "13px 22px",
    borderRadius: 999,
    border: "1px solid #e8d5ba",
    background: "transparent",
    color: "#7a6354",
    fontSize: "0.88rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  phone: { margin: "22px 0 0", fontSize: "0.85rem", color: "#7a6354" },
  link: { color: "#b51f24", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" },
  digest: { margin: "10px 0 0", fontSize: "0.7rem", color: "#7a6354", fontVariantNumeric: "tabular-nums" },
};
