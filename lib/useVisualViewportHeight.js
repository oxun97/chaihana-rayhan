"use client";

import { useEffect, useState } from "react";

// CSS vh/dvh turned out to be unreliable across the mobile browsers real
// customers use (some don't shrink for the address bar at all, dvh
// support/behavior varies) — window.visualViewport is the API built
// specifically to report the *actually visible* height, and it's what we
// fall back to trust instead. Returns null on the server / before mount.
export function useVisualViewportHeight() {
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => setHeight(vv ? vv.height : window.innerHeight);
    update();

    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      };
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return height;
}
