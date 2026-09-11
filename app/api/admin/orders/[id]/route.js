import { NextResponse } from "next/server";
import { updateOrderStatus, assignCourier } from "@/lib/orders-server";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  try {
    if (body?.status) {
      const order = await updateOrderStatus({ id: params.id, status: body.status, role: "admin" });
      return NextResponse.json({ ok: true, order });
    }
    if (body?.courierId !== undefined) {
      const order = await assignCourier({ id: params.id, courierId: body.courierId || null });
      return NextResponse.json({ ok: true, order });
    }
    return NextResponse.json({ error: "Нечего обновлять." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Не удалось обновить заказ." }, { status: 400 });
  }
}
