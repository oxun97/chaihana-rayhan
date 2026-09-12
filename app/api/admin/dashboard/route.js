import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/orders-server";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: "Не удалось загрузить статистику." }, { status: 500 });
  }
}
