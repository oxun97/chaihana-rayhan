import { NextResponse } from "next/server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";
import { listOrders } from "@/lib/orders-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(CLIENT_COOKIE)?.value;
  const session = await getClientSession(token);
  if (!session) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });

  try {
    const orders = await listOrders({ clientId: session.client.id });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  }
}
