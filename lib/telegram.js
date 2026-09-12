import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
  lines.push("");
  lines.push(`<b>Итого: ${order.total} ₽</b>`);
  const text = lines.join("\n");

  await Promise.allSettled(subscribers.map((s) => sendTelegramMessage(s.chat_id, text)));
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
