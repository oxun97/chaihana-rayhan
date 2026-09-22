import { NextResponse } from "next/server";
import { createBooking } from "@/lib/bookings-server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const MAX_DAYS_AHEAD = 120;

function validate(body) {
  if (!body?.name?.trim()) return "Укажите имя.";
  if (!body?.phone?.trim()) return "Укажите телефон.";

  const guests = Number(body.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 40) return "Укажите количество гостей.";

  if (!body?.date || !body?.time) return "Укажите дату и время.";
  const bookedFor = new Date(`${body.date}T${body.time}`);
  if (Number.isNaN(bookedFor.getTime())) return "Некорректная дата или время.";
  if (bookedFor < new Date()) return "Выберите время в будущем.";
  if (bookedFor > new Date(Date.now() + MAX_DAYS_AHEAD * 86400000)) {
    return "Бронь возможна не более чем на 4 месяца вперёд.";
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
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // Attached to the account when the guest is signed in, resolved from the
  // cookie rather than trusted from the request body.
  const clientSession = await getClientSession(request.cookies.get(CLIENT_COOKIE)?.value);

  try {
    const booking = await createBooking({
      customerName: body.name.trim(),
      customerPhone: body.phone.trim(),
      guests: Number(body.guests),
      bookedFor: new Date(`${body.date}T${body.time}`).toISOString(),
      comment: body.comment?.trim() || null,
      clientId: clientSession?.client.id,
    });
    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    console.error("Failed to create a booking:", e);
    return NextResponse.json({ error: "Не удалось отправить заявку." }, { status: 500 });
  }
}
