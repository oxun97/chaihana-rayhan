"use client";

import ErrorScreen from "@/components/site/ErrorScreen";

// Page-level failures: the layout and its providers survive, so only the
// page is replaced. Root-layout failures are handled by global-error.js.
export default function Error({ error, reset }) {
  return <ErrorScreen error={error} reset={reset} />;
}
