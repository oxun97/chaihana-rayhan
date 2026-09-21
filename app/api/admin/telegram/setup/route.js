import { NextResponse } from "next/server";
import { setTelegramWebhook, getTelegramBotInfo } from "@/lib/telegram";
import { getPublicOrigin } from "@/lib/site-url";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function POST() {
  const origin = getPublicOrigin();
  if (!origin) {
    return NextResponse.json(
      { error: "Не удалось определить адрес сайта. Задайте SITE_URL в переменных окружения." },
      { status: 400 }
    );
  }
  try {
    await setTelegramWebhook(`${origin}/api/telegram/webhook`);
    const bot = await getTelegramBotInfo();
    return NextResponse.json({ ok: true, username: bot.username, webhookUrl: `${origin}/api/telegram/webhook` });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Не удалось настроить бота." }, { status: 400 });
  }
}
