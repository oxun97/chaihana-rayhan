import { NextResponse } from "next/server";
import { getTelegramBotInfo, getTelegramWebhookInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Diagnostics for the order-notification bot. Behind the admin Basic Auth
// (see middleware.js) because the reply names the webhook URL.
export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не задан." }, { status: 503 });
  }

  const expectedUrl = process.env.SITE_URL
    ? `${process.env.SITE_URL.replace(/\/$/, "")}/api/telegram/webhook`
    : null;

  try {
    const [bot, webhook] = await Promise.all([getTelegramBotInfo(), getTelegramWebhookInfo()]);
    return NextResponse.json({
      bot: { username: bot.username },
      webhook: {
        url: webhook.url || "",
        pendingUpdateCount: webhook.pending_update_count ?? 0,
        lastErrorMessage: webhook.last_error_message || "",
        lastErrorDate: webhook.last_error_date
          ? new Date(webhook.last_error_date * 1000).toISOString()
          : null,
      },
      expectedUrl,
      matches: !!expectedUrl && webhook.url === expectedUrl,
    });
  } catch (e) {
    console.error("Failed to read Telegram webhook info:", e);
    return NextResponse.json({ error: e.message || "Не удалось получить статус." }, { status: 502 });
  }
}
