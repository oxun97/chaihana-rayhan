"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { LogoMark } from "@/components/site/Logo";

const DISMISSED_KEY = "chaihana_install_hint";
// A guest who said "not now" is not asked again for a fortnight.
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
// Long enough that the banner never competes with the hero for attention.
const APPEAR_DELAY_MS = 6000;

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

/**
 * Invitation to install the site as an app.
 *
 * Two different platforms, two different flows: Chrome hands us a
 * `beforeinstallprompt` event we can fire on demand, while iOS Safari has no
 * such API and can only be told where the Share menu is. Anything already
 * running standalone sees nothing at all.
 */
export default function InstallPrompt() {
  const { t } = useLang();
  const [mode, setMode] = useState(null); // "prompt" | "ios" | null
  const promptEvent = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (isStandalone() || snoozed()) return;

    const show = (next) => {
      timer.current = window.setTimeout(() => setMode(next), APPEAR_DELAY_MS);
    };

    const onBeforeInstallPrompt = (event) => {
      // Without this Chrome shows its own mini-infobar instead of letting us
      // place the invitation where it fits the design.
      event.preventDefault();
      promptEvent.current = event;
      show("prompt");
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

    if (isIos()) show("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer.current) window.clearTimeout(timer.current);
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          // Clears the mobile tab bar, plus the home indicator below it.
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 lg:hidden"
        >
          <div className="flex items-start gap-3 rounded-[20px] border border-edge bg-card/95 p-3.5 shadow-[0_18px_40px_-18px_rgba(36,20,13,0.45)] backdrop-blur-md">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-saffron">
              <LogoMark className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-serif text-[0.95rem] font-semibold leading-snug">
                {t("install_title")}
              </p>
              <p className="mt-1 text-[0.76rem] leading-relaxed text-muted">
                {mode === "ios" ? t("install_ios_lead") : t("install_lead")}
              </p>

              {mode === "prompt" ? (
                <button
                  onClick={install}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[0.78rem] font-semibold text-white transition-transform active:scale-95"
                >
                  <Download size={14} />
                  {t("install_action")}
                </button>
              ) : (
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-card-sunken px-3 py-1.5 text-[0.74rem] font-medium text-muted">
                  <Share size={13} />
                  {t("install_action")}
                </span>
              )}
            </div>

            <button
              onClick={dismiss}
              aria-label={t("install_dismiss")}
              className="-mr-0.5 -mt-0.5 shrink-0 rounded-full p-1.5 text-muted transition-colors active:text-brand"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
