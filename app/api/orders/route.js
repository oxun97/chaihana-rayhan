import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders-server";

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

  try {
    const order = await createOrder({
      customerName: body.customer.name.trim(),
      customerPhone: body.customer.phone.trim(),
      method: body.customer.method,
      address: body.customer.address?.trim() || null,
      comment: body.customer.comment?.trim() || null,
      lang: body.lang,
      items: body.items,
    });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error("Failed to create order:", e);
    return NextResponse.json({ error: "Не удалось сохранить заказ." }, { status: 500 });
  }
}
