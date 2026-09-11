import { NextResponse } from "next/server";
import { getCourierSession, COURIER_COOKIE } from "@/lib/auth-server";
import { updateOrderStatus } from "@/lib/orders-server";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const token = request.cookies.get(COURIER_COOKIE)?.value;
  const session = await getCourierSession(token);
  if (!session) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }
  if (!body?.status) return NextResponse.json({ error: "Не указан статус." }, { status: 400 });

  try {
    const order = await updateOrderStatus({
      id: params.id,
      status: body.status,
      role: "courier",
      courierId: session.courier.id,
    });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Не удалось обновить заказ." }, { status: 400 });
  }
}
