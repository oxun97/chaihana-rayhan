import { NextResponse } from "next/server";
import { getCourierSession, COURIER_COOKIE } from "@/lib/auth-server";
import { listCourierOrders } from "@/lib/orders-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(COURIER_COOKIE)?.value;
  const session = await getCourierSession(token);
  if (!session) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });

  try {
    const orders = await listCourierOrders(session.courier.id);
    return NextResponse.json(orders);
  } catch (e) {
    return NextResponse.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  }
}
