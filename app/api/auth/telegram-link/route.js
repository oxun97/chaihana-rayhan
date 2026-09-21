import { NextResponse } from "next/server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTelegramBotInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MINUTES = 30;

async function requireClient(request) {
  const token = request.cookies.get(CLIENT_COOKIE)?.value;
  return getClientSession(token);
}

// Hands the signed-in customer a personal t.me deep link. The chat id is
// never taken from the browser: it only becomes known (and trusted) when
// Telegram itself delivers "/start <token>" to our webhook.
export async function POST(request) {
  const session = await requireClient(request);
  if (!session) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });

  let bot;
  try {
    bot = await getTelegramBotInfo();
  } catch (e) {
    console.error("Failed to read Telegram bot info:", e);
    return NextResponse.json({ error: "Бот не настроен." }, { status: 503 });
  }
  if (!bot?.username) {
    return NextResponse.json({ error: "Бот не настроен." }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("telegram_link_tokens")
    .insert({ user_id: session.client.id, expires_at: expiresAt })
    .select("token")
    .single();
  if (error) {
    console.error("Failed to create a Telegram link token:", error);
    return NextResponse.json({ error: "Не удалось создать ссылку." }, { status: 500 });
  }

  return NextResponse.json({ url: `https://t.me/${bot.username}?start=${data.token}` });
}

export async function DELETE(request) {
  const session = await requireClient(request);
  if (!session) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({ telegram_chat_id: null })
    .eq("id", session.client.id);
  if (error) {
    return NextResponse.json({ error: "Не удалось отключить уведомления." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
