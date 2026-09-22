"use client";

import ErrorScreen from "@/components/site/ErrorScreen";

// Catches failures in the root layout itself — including the context
// providers mounted there, which is where a value restored from the
// browser's storage can throw. app/error.js sits inside that layout and
// never sees those, so this boundary renders its own document.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>
        <ErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
