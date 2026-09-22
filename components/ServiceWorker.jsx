"use client";

import { useEffect } from "react";

// Registers the service worker that makes the site installable. Kept out of
// the layout body so a registration failure (private mode, unsupported
// browser, blocked scope) can never break rendering.
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.error("Service worker registration failed:", e);
    });
  }, []);

  return null;
}
