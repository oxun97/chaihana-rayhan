import { getSupabaseAdmin } from "@/lib/supabase-admin";
import i18n from "@/data/i18n.json";

function apiUrl(method) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendTelegramMessage(chatId, text) {
  const url = apiUrl("sendMessage");
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function setTelegramWebhook(webhookUrl) {
  const url = apiUrl("setWebhook");
  if (!url) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram setWebhook failed.");
  return data;
}

// Telegram's own view of the webhook: where it delivers, how many updates
// are stuck in the queue, and why the last delivery failed. This is the
// only reliable way to tell "nobody messaged the bot" apart from "Telegram
// is being turned away by our host".
export async function getTelegramWebhookInfo() {
  const url = apiUrl("getWebhookInfo");
  if (!url) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram getWebhookInfo failed.");
  return data.result;
}

export async function getTelegramBotInfo() {
  const url = apiUrl("getMe");
  if (!url) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram getMe failed.");
  return data.result; // { id, username, first_name, ... }
}

// Best-effort fan-out to every subscribed chat — a Telegram outage or a
// blocked bot in one chat must never affect order creation.
export async function notifyNewOrder(order, items) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const supabase = getSupabaseAdmin();
  const { data: subscribers } = await supabase
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("is_active", true);
  if (!subscribers?.length) return;

  const lines = [];
  lines.push(`🔔 <b>Новый заказ №${order.order_number}</b>`);
  lines.push("");
  lines.push(`Имя: ${escapeHtml(order.customer_name)}`);
  lines.push(`Телефон: ${escapeHtml(order.customer_phone)}`);
  lines.push(`Способ: ${order.method === "pickup" ? "Самовывоз" : "Доставка"}`);
  if (order.address) lines.push(`Адрес: ${escapeHtml(order.address)}`);
  if (order.comment) lines.push(`Комментарий: ${escapeHtml(order.comment)}`);
  lines.push("");
  lines.push("<b>Состав заказа:</b>");
  for (const it of items) {
    lines.push(`• ${escapeHtml(it.name_snapshot)} × ${it.qty} — ${it.price_snapshot * it.qty} ₽`);
  }
  if (order.discount > 0) {
    lines.push(
      `Скидка${order.promo_code ? ` (${escapeHtml(order.promo_code)})` : ""}: -${order.discount} ₽`
    );
  }
  lines.push("");
  lines.push(`<b>Итого: ${order.total} ₽</b>`);
  lines.push(
    `Оплата: ${order.payment_method === "card_courier" ? "картой курьеру" : "наличными"}`
  );
  const text = lines.join("\n");

  await Promise.allSettled(subscribers.map((s) => sendTelegramMessage(s.chat_id, text)));
}

const STATUS_EMOJI = {
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "🍽️",
  on_delivery: "🚗",
  delivered: "🎉",
  cancelled: "❌",
};

// Statuses worth interrupting a customer for. "new" is skipped: they just
// placed the order and already saw the confirmation.
const CLIENT_NOTIFIED_STATUSES = Object.keys(STATUS_EMOJI);

// Tells the customer their order moved on, in the language they ordered in.
// Only reaches customers who linked their Telegram themselves; everyone
// else silently no-ops.
export async function notifyOrderStatus(order) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  if (!order?.client_id) return;
  if (!CLIENT_NOTIFIED_STATUSES.includes(order.status)) return;

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase
    .from("users")
    .select("telegram_chat_id")
    .eq("id", order.client_id)
    .maybeSingle();
  if (!client?.telegram_chat_id) return;

  const t = (key) => i18n.ui[order.lang]?.[key] || i18n.ui.ru[key] || key;
  const lines = [
    `${STATUS_EMOJI[order.status]} <b>${t("tg_order_label")} №${order.order_number}</b>`,
    "",
    `${t("tg_status_label")}: <b>${t(`status_${order.status}`)}</b>`,
    "",
    `${t("cart_total")}: ${order.total} ₽`,
  ];

  await sendTelegramMessage(client.telegram_chat_id, lines.join("\n"));
}

// Links a Telegram chat to the account that generated `token`.
// Returns { ok: true, name } or { ok: false, reason: "invalid" | "chat_taken" }.
export async function linkClientTelegram({ token, chatId }) {
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("telegram_link_tokens")
    .select("token, user_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!row || row.used_at) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at) < new Date()) return { ok: false, reason: "invalid" };

  // If this chat already belongs to a different account, the partial unique
  // index rejects the update (23505) — a chat can never be taken over by
  // whoever pastes a token into it.
  const { error } = await supabase
    .from("users")
    .update({ telegram_chat_id: chatId })
    .eq("id", row.user_id);
  if (error) {
    return { ok: false, reason: error.code === "23505" ? "chat_taken" : "invalid" };
  }

  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", row.token);

  const { data: user } = await supabase
    .from("users")
    .select("name")
    .eq("id", row.user_id)
    .maybeSingle();

  return { ok: true, name: user?.name || "" };
}

export async function unlinkTelegramByChatId(chatId) {
  const supabase = getSupabaseAdmin();
  await supabase.from("users").update({ telegram_chat_id: null }).eq("telegram_chat_id", chatId);
}

// Messages are sent with parse_mode: "HTML", so anything user-supplied
// (customer names, addresses, comments) has to be escaped or Telegram
// rejects the whole message on an unclosed tag.
export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
