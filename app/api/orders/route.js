import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders-server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const METHODS = ["delivery", "pickup"];

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

  // Attach the order to the logged-in customer's account (if any) so it
  // shows up in their order history — resolved server-side from the
  // session cookie, never trusted from the request body.
  const clientToken = request.cookies.get(CLIENT_COOKIE)?.value;
  const clientSession = await getClientSession(clientToken);

  try {
    const order = await createOrder({
      customerName: body.customer.name.trim(),
      customerPhone: body.customer.phone.trim(),
      method: body.customer.method,
      address: body.customer.address?.trim() || null,
      comment: body.customer.comment?.trim() || null,
      lang: body.lang,
      items: body.items,
      clientId: clientSession?.client.id,
      // Only the code travels from the browser — create_order() re-validates
      // it and computes the discount itself.
      promoCode: typeof body.promoCode === "string" ? body.promoCode.trim() : null,
    });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error("Failed to create order:", e);
    return NextResponse.json({ error: "Не удалось сохранить заказ." }, { status: 500 });
  }
}
