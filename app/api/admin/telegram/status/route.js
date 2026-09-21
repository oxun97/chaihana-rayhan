import { NextResponse } from "next/server";
import { getTelegramBotInfo, getTelegramWebhookInfo } from "@/lib/telegram";
import { getPublicOrigin, isDeploymentSpecificUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

// Diagnostics for the order-notification bot. Behind the admin Basic Auth
// (see middleware.js) because the reply names the webhook URL.
export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не задан." }, { status: 503 });
  }

  const origin = getPublicOrigin();
  const expectedUrl = origin ? `${origin}/api/telegram/webhook` : null;

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
      // A webhook pointed at a single build's address stops working as
      // soon as that build is superseded, so call it out even when it
      // happens to match what we would register right now.
      deploymentSpecific: !!webhook.url && isDeploymentSpecificUrl(webhook.url),
    });
  } catch (e) {
    console.error("Failed to read Telegram webhook info:", e);
    return NextResponse.json({ error: e.message || "Не удалось получить статус." }, { status: 502 });
  }
}
