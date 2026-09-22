import { NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promos-server";

export const dynamic = "force-dynamic";

// Preview only: tells the checkout what a code is worth so it can show the
// discount line. The order's real price is recomputed inside create_order(),
// so a tampered response here cannot buy a cheaper order.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }

  const code = String(body?.code || "").trim();
  if (!code) return NextResponse.json({ error: "Введите промокод." }, { status: 400 });

  try {
    const result = await validatePromoCode({ code, subtotal: Number(body?.subtotal) || 0 });
    return NextResponse.json(result);
  } catch (e) {
    console.error("Failed to validate a promo code:", e);
    return NextResponse.json({ error: "Не удалось проверить промокод." }, { status: 500 });
  }
}
