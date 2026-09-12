import { NextResponse } from "next/server";
import { setTelegramWebhook, getTelegramBotInfo } from "@/lib/telegram";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function POST() {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    return NextResponse.json(
      { error: "Задайте SITE_URL в переменных окружения (адрес сайта)." },
      { status: 400 }
    );
  }
  try {
    await setTelegramWebhook(`${siteUrl}/api/telegram/webhook`);
    const bot = await getTelegramBotInfo();
    return NextResponse.json({ ok: true, username: bot.username });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Не удалось настроить бота." }, { status: 400 });
  }
}
