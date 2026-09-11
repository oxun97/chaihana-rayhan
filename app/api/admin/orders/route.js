import { NextResponse } from "next/server";
import { listOrders } from "@/lib/orders-server";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const status = new URL(request.url).searchParams.get("status") || undefined;
  try {
    const orders = await listOrders({ status });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  }
}
