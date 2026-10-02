"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { LogoMark } from "@/components/site/Logo";

const DISMISSED_KEY = "chaihana_install_hint";
const VISITS_KEY = "chaihana_visits";
const VISIT_COUNTED_KEY = "chaihana_visit_counted";
// Fired by the checkout once an order has gone out.
export const ORDER_PLACED_EVENT = "chaihana:order-placed";
// A guest who said "not now" is not asked again for a fortnight.
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const APPEAR_DELAY_MS = 4000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode and reports it here instead.
    window.navigator.standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ claims to be a Mac; the touch points give it away.
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
  );
}

function snoozed() {
  try {
    const at = Number(window.localStorage.getItem(DISMISSED_KEY));
    return Boolean(at) && Date.now() - at < SNOOZE_MS;
  } catch (e) {
    // Private mode: treat as "never dismissed" rather than crashing.
    return false;
  }
}

// Counts distinct sessions, so a reload in the same tab is not a "return".
function countVisit() {
  try {
    const seen = Number(window.localStorage.getItem(VISITS_KEY)) || 0;
    if (window.sessionStorage.getItem(VISIT_COUNTED_KEY)) return Math.max(seen, 1);
    window.sessionStorage.setItem(VISIT_COUNTED_KEY, "1");
    window.localStorage.setItem(VISITS_KEY, String(seen + 1));
    return seen + 1;
  } catch (e) {
    return 1;
  }
}

/**
 * Invitation to install the site as an app.
 *
 * Only offered to guests who have shown they will be back — a returning
 * visit, or right after placing an order — never to someone who arrived
 * seconds ago to look at the menu. Kept to one compact row so it can never
 * cover the page's own buttons.
 *
 * Two platforms, two flows: Chrome hands us a `beforeinstallprompt` event
 * we can fire on demand, while iOS Safari can only be told where the Share
 * menu is. Anything already running standalone sees nothing at all.
 */
export default function InstallPrompt() {
  const { t } = useLang();
  const { itemCount } = useCart();
  const [mode, setMode] = useState(null); // "prompt" | "ios" | null
  const promptEvent = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (isStandalone() || snoozed()) return;

    let engaged = countVisit() >= 2;
    let available = isIos() ? "ios" : null;

    const reveal = () => {
      if (!engaged || !available || timer.current) return;
      timer.current = window.setTimeout(() => setMode(available), APPEAR_DELAY_MS);
    };

    const onBeforeInstallPrompt = (event) => {
      // Without this Chrome shows its own mini-infobar instead of letting us
      // place the invitation where it fits the design.
      event.preventDefault();
      promptEvent.current = event;
      available = "prompt";
      reveal();
    };

    const onOrderPlaced = () => {
      engaged = true;
      reveal();
    };

    const onInstalled = () => {
      setMode(null);
      try {
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch (e) {
        /* nothing to persist to; the banner is gone for this session anyway */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(ORDER_PLACED_EVENT, onOrderPlaced);
    reveal();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(ORDER_PLACED_EVENT, onOrderPlaced);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  function dismiss() {
    setMode(null);
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch (e) {
      /* see above */
    }
  }

  async function install() {
    const event = promptEvent.current;
    if (!event) return;
    promptEvent.current = null;
    setMode(null);
    try {
      await event.prompt();
    } catch (e) {
      console.error("Install prompt failed:", e);
    }
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          // Rides above the floating cart bar when there is one, otherwise
          // just above the home indicator.
          className={`fixed inset-x-3 z-40 transition-[bottom] duration-300 lg:hidden ${
            itemCount > 0
              ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
              : "bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          }`}
          role="dialog"
          aria-label={t("install_title")}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-edge bg-card/95 py-2 pl-2 pr-1.5 shadow-[0_14px_32px_-16px_rgba(36,20,13,0.45)] backdrop-blur-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cocoa text-saffron">
              <LogoMark className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[0.84rem] font-semibold leading-tight text-body">{t("install_title")}</p>
              {mode === "ios" && (
                <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] leading-snug text-muted">
                  <Share size={12} className="shrink-0" />
                  <span className="truncate">{t("install_ios_lead")}</span>
                </p>
              )}
            </div>

            {mode === "prompt" && (
              <button
                onClick={install}
                className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[0.78rem] font-semibold text-white transition-transform active:scale-95"
              >
                <Download size={14} />
                {t("install_action")}
              </button>
            )}

            <button
              onClick={dismiss}
              aria-label={t("install_dismiss")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:text-brand"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
