import { NextResponse } from "next/server";
import { getPendingPayment, confirmCardPayment } from "@/lib/payments-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Polled by the /order/payment-result page after YooKassa redirects the
// guest back. The webhook is the primary way a payment gets confirmed, but
// webhook delivery isn't guaranteed to be prompt (or to arrive at all) —
// so a guest sitting on the return page re-checks directly instead of
// being stuck watching a spinner for a webhook that's still in flight.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get("pending");
  if (!id) {
    return NextResponse.json({ error: "Missing pending id." }, { status: 400 });
  }

  try {
    let pending = await getPendingPayment(id);
    if (pending.status === "pending" && pending.provider_payment_id) {
      pending = await confirmCardPayment(pending.provider_payment_id);
    }

    let orderNumber = null;
    if (pending.order_id) {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase
        .from("orders")
        .select("order_number")
        .eq("id", pending.order_id)
        .single();
      orderNumber = order?.order_number ?? null;
    }

    return NextResponse.json({ status: pending.status, orderNumber });
  } catch (e) {
    console.error("Failed to check payment status:", e);
    return NextResponse.json({ error: "Не удалось проверить статус оплаты." }, { status: 500 });
  }
}
