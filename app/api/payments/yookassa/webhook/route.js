import { NextResponse } from "next/server";
import { confirmCardPayment } from "@/lib/payments-server";

export const dynamic = "force-dynamic";

// YooKassa's own notification. Deliberately does not branch on
// `body.event` or trust `body.object.status` — confirmCardPayment() always
// re-fetches the payment from YooKassa's API with our own credentials
// before acting on it, so a forged POST to this URL can trigger at most an
// extra (harmless, authenticated) status check, never a fabricated order.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }

  const paymentId = body?.object?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id." }, { status: 400 });
  }

  try {
    await confirmCardPayment(paymentId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to process YooKassa webhook:", e);
    // A non-2xx tells YooKassa to retry — the right response for a
    // transient failure (a Supabase blip, a momentary network error). The
    // handler is idempotent, so a retried delivery is always safe.
    return NextResponse.json({ error: "Не удалось обработать уведомление." }, { status: 500 });
  }
}
