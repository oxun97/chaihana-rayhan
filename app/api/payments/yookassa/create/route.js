import { NextResponse } from "next/server";
import { startCardPayment } from "@/lib/payments-server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";
import { getOriginFromRequest } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const METHODS = ["delivery", "pickup"];

// Mirrors /api/orders's validate() — same checkout body shape, this is
// just a different final step (a payment page instead of an immediate
// order) for the same cart.
function validate(body) {
  const customer = body?.customer;
  if (!customer || typeof customer !== "object") return "Missing customer.";
  if (!customer.name || !customer.name.trim()) return "Missing customer name.";
  if (!customer.phone || !customer.phone.trim()) return "Missing customer phone.";
  if (!METHODS.includes(customer.method)) return "Invalid order method.";

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) return "Cart is empty.";
  for (const it of items) {
    if (!it || typeof it.id !== "string" || !it.id) return "Invalid item.";
    if (!Number.isInteger(it.qty) || it.qty <= 0) return "Invalid item quantity.";
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const clientToken = request.cookies.get(CLIENT_COOKIE)?.value;
  const clientSession = await getClientSession(clientToken);

  const origin = getOriginFromRequest(request) || process.env.SITE_URL;
  if (!origin) {
    return NextResponse.json({ error: "Не удалось определить адрес сайта." }, { status: 500 });
  }

  try {
    const { confirmationUrl, pendingId } = await startCardPayment({
      customerName: body.customer.name.trim(),
      customerPhone: body.customer.phone.trim(),
      method: body.customer.method,
      address: body.customer.address?.trim() || null,
      comment: body.customer.comment?.trim() || null,
      lang: body.lang,
      items: body.items,
      clientId: clientSession?.client.id,
      promoCode: typeof body.promoCode === "string" ? body.promoCode.trim() : null,
      returnUrl: `${origin}/order/payment-result`,
    });
    if (!confirmationUrl) {
      throw new Error("YooKassa did not return a confirmation URL");
    }
    return NextResponse.json({ ok: true, confirmationUrl, pendingId });
  } catch (e) {
    console.error("Failed to start card payment:", e);
    return NextResponse.json({ error: e.message || "Не удалось начать оплату." }, { status: 500 });
  }
}
