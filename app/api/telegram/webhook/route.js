import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendTelegramMessage } from "@/lib/telegram";

// Telegram posts updates here (see setWebhook in /api/admin/telegram/setup).
// No secret token check on this route since Telegram doesn't sign
// requests by default; the worst a stranger who finds this URL can do is
// insert junk subscriber rows, which only ever receive order
// notifications — no data is read back out through this endpoint.
export const dynamic = "force-dynamic";

export async function POST(request) {
  let update;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update?.message;
  const chat = message?.chat;
  if (!chat) return NextResponse.json({ ok: true });

  const supabase = getSupabaseAdmin();
  const text = (message.text || "").trim();

  if (text === "/stop") {
    await supabase.from("telegram_subscribers").update({ is_active: false }).eq("chat_id", chat.id);
    await sendTelegramMessage(chat.id, "Вы отписаны от уведомлений о заказах.");
    return NextResponse.json({ ok: true });
  }

  await supabase.from("telegram_subscribers").upsert(
    {
      chat_id: chat.id,
      username: chat.username || null,
      first_name: chat.first_name || null,
      is_active: true,
    },
    { onConflict: "chat_id" }
  );

  await sendTelegramMessage(
    chat.id,
    "✅ Вы подписаны на уведомления о новых заказах — Чайхана Райхан.\n\nЧтобы отписаться, отправьте /stop."
  );

  return NextResponse.json({ ok: true });
}
