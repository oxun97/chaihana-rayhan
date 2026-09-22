"use client";

import { useEffect, useRef } from "react";

/**
 * Shared behaviour for every overlay on the site — the cart, the checkout,
 * the login modal, the search bar, the mobile menu.
 *
 * Two things that were missing everywhere:
 *
 * - Escape closes it. Without that, a keyboard user who opens the search bar
 *   has to find the ✕ with the mouse.
 * - The page behind stops scrolling while it is open. Without that, a phone
 *   scrolls the storefront under an open cart, which is the quickest way for
 *   a site to stop feeling like an app.
 */
export function useOverlay(open, onClose, { lockScroll = true } = {}) {
  // Kept in a ref so a new inline closure on every render does not tear the
  // scroll lock down and set it up again.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Locking the scroll takes the scrollbar away with it; pad the same
    // width back on so the layout behind does not jump on a desktop.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Overlays restore in reverse order of opening, so a nested one
      // handing "hidden" back to its parent is correct.
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);
}
