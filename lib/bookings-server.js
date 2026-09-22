import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";

export const BOOKING_STATUSES = ["new", "confirmed", "declined", "done"];

export async function createBooking({
  customerName,
  customerPhone,
  guests,
  bookedFor,
  comment,
  clientId,
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      guests,
      booked_for: bookedFor,
      comment: comment || null,
      client_id: clientId || null,
    })
    .select("id, customer_name, customer_phone, guests, booked_for, comment")
    .single();
  if (error) throw error;

  // Best-effort: a Telegram outage must not lose the guest's request, which
  // is already safely stored above.
  try {
    await notifyNewBooking(data);
  } catch (e) {
    console.error("Failed to send the Telegram booking notification:", e);
  }

  return data;
}

export async function listBookings({ status } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("bookings").select("*").order("booked_for", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateBookingStatus({ id, status }) {
  if (!BOOKING_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function notifyNewBooking(booking) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const supabase = getSupabaseAdmin();
  const { data: subscribers } = await supabase
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("is_active", true);
  if (!subscribers?.length) return;

  const when = new Date(booking.booked_for).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  });

  const lines = [
    "🪑 <b>Новая заявка на бронь</b>",
    "",
    `Имя: ${escapeHtml(booking.customer_name)}`,
    `Телефон: ${escapeHtml(booking.customer_phone)}`,
    `Гостей: ${booking.guests}`,
    `Когда: ${when}`,
  ];
  if (booking.comment) lines.push(`Комментарий: ${escapeHtml(booking.comment)}`);

  await Promise.allSettled(
    subscribers.map((s) => sendTelegramMessage(s.chat_id, lines.join("\n")))
  );
}
