import { NextResponse } from "next/server";
import { listBookings, updateBookingStatus, BOOKING_STATUSES } from "@/lib/bookings-server";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const status = new URL(request.url).searchParams.get("status");
  try {
    const bookings = await listBookings({ status: status || undefined });
    return NextResponse.json({ bookings });
  } catch (e) {
    console.error("Failed to load bookings:", e);
    return NextResponse.json({ error: "Не удалось загрузить брони." }, { status: 500 });
  }
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }
  if (!body?.id) return NextResponse.json({ error: "Не указана бронь." }, { status: 400 });
  if (!BOOKING_STATUSES.includes(body?.status)) {
    return NextResponse.json({ error: "Неизвестный статус." }, { status: 400 });
  }

  try {
    const booking = await updateBookingStatus({ id: body.id, status: body.status });
    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    console.error("Failed to update a booking:", e);
    return NextResponse.json({ error: "Не удалось обновить бронь." }, { status: 500 });
  }
}
