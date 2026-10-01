import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("telegram_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Не удалось загрузить список." }, { status: 500 });
  return NextResponse.json({ subscribers: data });
}

// Approves a staff chat that asked for order alerts with /start.
export async function PATCH(request) {
  const chatId = new URL(request.url).searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "Не указан chatId." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("telegram_subscribers")
    .update({ approved: true, is_active: true })
    .eq("chat_id", chatId);
  if (error) return NextResponse.json({ error: "Не удалось подтвердить чат." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const chatId = new URL(request.url).searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "Не указан chatId." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("telegram_subscribers").update({ is_active: false }).eq("chat_id", chatId);
  if (error) return NextResponse.json({ error: "Не удалось отписать чат." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
