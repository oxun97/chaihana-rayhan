import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createYookassaPayment, getYookassaPayment } from "@/lib/payments/yookassa";
import { priceCart, createOrder } from "@/lib/orders-server";

// Starts an online-card checkout: prices the cart server-side (the only
// number that ever reaches YooKassa), stages the checkout in
// pending_payments, and asks YooKassa for a hosted payment page. The real
// `orders` row does not exist yet — see confirmCardPayment() — so a guest
// who abandons the payment page never leaves a half-finished order behind.
export async function startCardPayment({
  customerName,
  customerPhone,
  method,
  address,
  comment,
  lang,
  items,
  clientId,
  promoCode,
  returnUrl,
}) {
  const supabase = getSupabaseAdmin();

  const priced = await priceCart({ customerName, customerPhone, method, address, comment, lang, items, promoCode });

  const { data: pending, error: insertErr } = await supabase
    .from("pending_payments")
    .insert({
      amount: priced.total,
      payload: { customerName, customerPhone, method, address, comment, lang, items, clientId, promoCode },
    })
    .select()
    .single();
  if (insertErr) throw insertErr;

  let payment;
  try {
    payment = await createYookassaPayment({
      amount: priced.total,
      description: `Заказ в Чайхана Райхан — ${priced.total} ₽`,
      returnUrl: `${returnUrl}?pending=${pending.id}`,
      metadata: { pending_id: pending.id },
      // Stable per attempt: retrying this exact call (e.g. a network
      // blip) reuses the row's own id instead of risking a second charge.
      idempotenceKey: pending.id,
    });
  } catch (e) {
    await supabase
      .from("pending_payments")
      .update({ status: "failed", error: e.message, updated_at: new Date().toISOString() })
      .eq("id", pending.id);
    throw e;
  }

  const { error: updateErr } = await supabase
    .from("pending_payments")
    .update({ provider_payment_id: payment.id, updated_at: new Date().toISOString() })
    .eq("id", pending.id);
  if (updateErr) throw updateErr;

  return { pendingId: pending.id, confirmationUrl: payment.confirmation?.confirmation_url };
}

// Called from both the webhook and the return-page's status poll — either
// way, the only thing that decides whether an order gets created is what
// YooKassa's own API says right now, fetched with our own credentials.
// Idempotent: a payment already marked "completed" is a no-op, so it's
// safe to call this from two places for the same event.
export async function confirmCardPayment(providerPaymentId) {
  const supabase = getSupabaseAdmin();
  const { data: pending, error } = await supabase
    .from("pending_payments")
    .select("*")
    .eq("provider_payment_id", providerPaymentId)
    .single();
  if (error || !pending) throw new Error(`No pending payment for ${providerPaymentId}`);

  if (pending.status !== "pending") return pending; // already completed/failed — nothing to do

  const payment = await getYookassaPayment(providerPaymentId);

  if (payment.status === "succeeded") {
    const p = pending.payload;
    const order = await createOrder({
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      method: p.method,
      address: p.address,
      comment: p.comment,
      lang: p.lang,
      items: p.items,
      clientId: p.clientId,
      promoCode: p.promoCode,
      paymentMethod: "card_online",
    });
    const { data: updated, error: updateErr } = await supabase
      .from("pending_payments")
      .update({ status: "completed", order_id: order.id, updated_at: new Date().toISOString() })
      .eq("id", pending.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return updated;
  }

  if (payment.status === "canceled") {
    const { data: updated, error: updateErr } = await supabase
      .from("pending_payments")
      .update({
        status: "failed",
        error: payment.cancellation_details?.reason || "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return updated;
  }

  // "pending" / "waiting_for_capture": still in progress. Leave it as is —
  // the webhook (or the next status poll) will settle it.
  return pending;
}

export async function getPendingPayment(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("pending_payments").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
