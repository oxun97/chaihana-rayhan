import { NextResponse } from "next/server";
import { setTelegramWebhook, getTelegramBotInfo } from "@/lib/telegram";
import { getOriginFromRequest, isDeploymentSpecificUrl } from "@/lib/site-url";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function POST(request) {
  // Registered against the address the admin is browsing right now, which
  // is by definition a host that serves this app — env vars kept pointing
  // at a single build or at a detached custom domain, and Telegram
  // answered both with 404.
  const origin = getOriginFromRequest(request);
  if (!origin) {
    return NextResponse.json({ error: "Не удалось определить адрес сайта." }, { status: 400 });
  }

  if (isDeploymentSpecificUrl(origin)) {
    return NextResponse.json(
      {
        error:
          "Вы открыли админку по адресу отдельной сборки — с него Telegram перестанет доставлять после следующего деплоя. Откройте админку по постоянному адресу сайта и нажмите кнопку снова.",
      },
      { status: 400 }
    );
  }

  const webhookUrl = `${origin}/api/telegram/webhook`;
  try {
    await setTelegramWebhook(webhookUrl);
    const bot = await getTelegramBotInfo();
    return NextResponse.json({ ok: true, username: bot.username, webhookUrl });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Не удалось настроить бота." }, { status: 400 });
  }
}
