"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const { t } = useLang();
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setAuthModalOpen(false);
    setError("");
    setSubmitting(false);
  };

  const switchTab = (next) => {
    setTab(next);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (tab === "login") {
        await login({ phone, password });
      } else {
        await register({ name, phone, password });
      }
      setName("");
      setPhone("");
      setPassword("");
      close();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && [
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[70] bg-night/70 backdrop-blur-sm"
        />,
        // Same non-animated centering wrapper pattern as CheckoutModal:
        // Framer Motion's inline transform from the y/scale animation
        // overrides a Tailwind -translate-y-1/2 class, so we center via
        // flexbox on a plain wrapper instead of top-1/2 + translate.
        <div
          key="panel-wrapper"
          className="fixed inset-x-4 inset-y-0 z-[70] flex items-center justify-center"
          onClick={close}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/15 bg-surface shadow-lift sm:max-h-[85vh]"
          >
            <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
              <h3 className="font-serif text-xl font-bold text-parchment">
                {tab === "login" ? t("auth_login_tab") : t("auth_register_tab")}
              </h3>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-parchment-soft hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="mx-6 mb-4 flex shrink-0 gap-2 rounded-full bg-night p-1">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  tab === "login" ? "bg-gold text-night" : "text-parchment-soft"
                }`}
              >
                {t("auth_login_tab")}
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  tab === "register" ? "bg-gold text-night" : "text-parchment-soft"
                }`}
              >
                {t("auth_register_tab")}
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3.5 overflow-y-auto px-6 pb-2"
            >
              {tab === "register" && (
                <Field label={t("checkout_name")}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("checkout_name_placeholder")}
                    className="auth-input"
                    required
                  />
                </Field>
              )}

              <Field label={t("checkout_phone")}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  type="tel"
                  className="auth-input"
                  required
                />
              </Field>

              <Field label={t("auth_password")}>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="auth-input"
                  required
                  minLength={6}
                />
              </Field>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 w-full rounded-full bg-gold py-3 text-sm font-semibold text-night transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tab === "login" ? t("auth_login_submit") : t("auth_register_submit")}
              </button>

              <button
                type="button"
                onClick={() => switchTab(tab === "login" ? "register" : "login")}
                className="mb-5 mt-1 text-center text-xs text-parchment-soft underline-offset-2 hover:text-gold hover:underline"
              >
                {tab === "login" ? t("auth_switch_to_register") : t("auth_switch_to_login")}
              </button>
            </form>
          </motion.div>
        </div>,
      ]}
      <style jsx global>{`
        .auth-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(200, 155, 60, 0.25);
          padding: 0.6rem 0.85rem;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          background: #0b0b0b;
          color: #f5e6c8;
        }
        .auth-input::placeholder {
          color: rgba(245, 230, 200, 0.45);
        }
        .auth-input:focus {
          border-color: #c89b3c;
        }
      `}</style>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.75rem] font-medium text-parchment-soft">{label}</span>
      {children}
    </label>
  );
}
