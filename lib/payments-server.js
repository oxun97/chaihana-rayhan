import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createYookassaPayment, getYookassaPayment } from "@/lib/payments/yookassa";
import { priceCart, createOrder } from "@/lib/orders-server";
import { notifyOrderSaveFailed } from "@/lib/telegram";

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

  if (pending.status !== "pending") return pending; // already handled (or being handled) — nothing to do

  const payment = await getYookassaPayment(providerPaymentId);

  if (payment.status === "succeeded") {
    // The webhook and the return page's poll routinely arrive together.
    // Exactly one of them gets to move the row pending -> processing; the
    // other sees nothing to claim and backs off, so one payment can never
    // turn into two orders.
    const { data: claimed, error: claimErr } = await supabase
      .from("pending_payments")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", pending.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (!claimed) return getPendingPayment(pending.id);

    const p = pending.payload;
    const paid = Math.round(Number(payment.amount?.value));
    try {
      if (paid !== pending.amount) {
        throw new Error(`Сумма оплаты ${paid} ₽ не совпадает с суммой заказа ${pending.amount} ₽`);
      }
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
      return await settle(pending.id, { status: "completed", order_id: order.id });
    } catch (e) {
      // The guest has paid but there is no order (a dish went off the menu
      // between paying and confirming, the database refused it, ...). Not
      // retried blindly: it is parked where staff can see it, and staff are
      // told now — this needs a phone call or a refund, not silence.
      console.error("Paid online but the order could not be created:", e);
      const parked = await settle(pending.id, { status: "paid_no_order", error: e.message });
      try {
        await notifyOrderSaveFailed({
          customer: { name: p.customerName, phone: p.customerPhone },
          items: p.items,
          reason: `Оплачено онлайн ${paid} ₽ (ЮKassa ${providerPaymentId}), но заказ не создан: ${e.message}`,
        });
      } catch (alertErr) {
        console.error("Failed to alert staff about a paid order without an order:", alertErr);
      }
      return parked;
    }
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
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (updateErr) throw updateErr;
    return updated || getPendingPayment(pending.id);
  }

  // "pending" / "waiting_for_capture": still in progress. Leave it as is —
  // the webhook (or the next status poll) will settle it.
  return pending;
}

async function settle(id, patch) {
  const { data, error } = await getSupabaseAdmin()
    .from("pending_payments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingPayment(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("pending_payments").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
