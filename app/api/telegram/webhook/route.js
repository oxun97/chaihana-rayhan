import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  sendTelegramMessage,
  linkClientTelegram,
  unlinkTelegramByChatId,
  verifyWebhookRequest,
  escapeHtml,
} from "@/lib/telegram";

// Telegram posts updates here (see setWebhook in /api/admin/telegram/setup).
// Two kinds of chat use this bot:
//   - customers, who arrive through a personal "/start <token>" link from
//     the site and get updates about their own orders only;
//   - restaurant staff, who send a bare "/start" and get every new order —
//     names, phones, addresses. Anyone can message a bot, so a staff chat
//     only receives those once an admin approves it in /admin/telegram.
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await verifyWebhookRequest(request))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

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
    await unlinkTelegramByChatId(chat.id);
    await sendTelegramMessage(chat.id, "Вы отписаны от уведомлений.");
    return NextResponse.json({ ok: true });
  }

  const startPayload = text.startsWith("/start ") ? text.slice("/start ".length).trim() : "";
  if (startPayload) {
    const result = await linkClientTelegram({ token: startPayload, chatId: chat.id });
    const replies = {
      chat_taken: "Этот Telegram уже привязан к другому аккаунту. Отключите уведомления там или войдите в тот аккаунт.",
      invalid: "Ссылка недействительна или устарела. Откройте «Мои заказы» на сайте и получите новую.",
    };
    await sendTelegramMessage(
      chat.id,
      result.ok
        ? `✅ Готово${result.name ? `, ${escapeHtml(result.name)}` : ""}! Будем присылать сюда статус ваших заказов.\n\nЧтобы отписаться, отправьте /stop.`
        : replies[result.reason]
    );
    return NextResponse.json({ ok: true });
  }

  // A customer's own notification chat writing to the bot is not a staff
  // sign-up request.
  const { data: customer } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_chat_id", chat.id)
    .maybeSingle();
  if (customer) {
    await sendTelegramMessage(
      chat.id,
      "Здесь приходят уведомления о ваших заказах в Чайхане Райхан. Чтобы отписаться, отправьте /stop."
    );
    return NextResponse.json({ ok: true });
  }

  if (text !== "/start") {
    // Anything else from an unknown chat: say what the bot does and stop.
    await sendTelegramMessage(
      chat.id,
      "Это служебный бот Чайханы Райхан. Чтобы получать статус своего заказа, нажмите «Подключить Telegram» в разделе «Мои заказы» на сайте."
    );
    return NextResponse.json({ ok: true });
  }

  // Staff sign-up request. `approved` is deliberately absent from the
  // upsert: a new chat starts unapproved (column default), and a re-sent
  // /start never changes an existing chat's approval either way.
  await supabase.from("telegram_subscribers").upsert(
    {
      chat_id: chat.id,
      username: chat.username || null,
      first_name: chat.first_name || null,
      is_active: true,
    },
    { onConflict: "chat_id" }
  );
  const { data: sub } = await supabase
    .from("telegram_subscribers")
    .select("approved")
    .eq("chat_id", chat.id)
    .maybeSingle();

  await sendTelegramMessage(
    chat.id,
    sub?.approved
      ? "✅ Вы подписаны на уведомления о новых заказах — Чайхана Райхан.\n\nЧтобы отписаться, отправьте /stop."
      : "Заявка принята. Уведомления о заказах начнут приходить, как только администратор подтвердит этот чат в панели управления сайта."
  );

  return NextResponse.json({ ok: true });
}
