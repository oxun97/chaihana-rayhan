// Thin client for YooKassa's REST API (docs: yookassa.ru/developers/api).
// Server-only — YOOKASSA_SECRET_KEY must never reach the browser.
const API = "https://api.yookassa.ru/v3";

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new Error(
      "YooKassa is not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY."
    );
  }
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

// Amounts are integer rubles throughout this app (see orders.total,
// dishes.price) — YooKassa wants a decimal string with kopecks, hence the
// ".00".
function toAmountValue(rubles) {
  return `${Math.round(rubles)}.00`;
}

// Creates a payment and returns YooKassa's hosted confirmation page to
// redirect the guest to. `idempotenceKey` must be stable for one logical
// attempt — reusing the pending_payments row's own id means a retried
// request (e.g. a flaky connection) can never create two charges for the
// same order.
export async function createYookassaPayment({ amount, description, returnUrl, metadata, idempotenceKey }) {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: { value: toAmountValue(amount), currency: "RUB" },
      confirmation: { type: "redirect", return_url: returnUrl },
      capture: true,
      description,
      metadata,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.description || `YooKassa payment creation failed (${res.status})`);
  }
  return data; // { id, status, confirmation: { confirmation_url }, ... }
}

// Always call this to learn a payment's real status — never trust the
// `status`/`paid` fields on an incoming webhook body, which is an
// unauthenticated POST anyone who finds the URL could send. This call is
// authenticated with our own secret key, so its answer is the one that
// actually decides whether an order gets created.
export async function getYookassaPayment(paymentId) {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.description || `Failed to fetch YooKassa payment (${res.status})`);
  }
  return data;
}
