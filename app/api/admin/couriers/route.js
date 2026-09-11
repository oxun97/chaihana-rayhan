import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone, is_active, created_at")
    .eq("role", "courier")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Не удалось загрузить курьеров." }, { status: 500 });
  return NextResponse.json({ couriers: data });
}

// Couriers log in by phone (the schema only enforces a unique login for
// role='admin' — for clients/couriers it's `phone` that's unique), so that
// doubles as their username here.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  const name = (body?.name || "").trim();
  const phone = (body?.phone || "").trim();
  const password = body?.password || "";

  if (!name) return NextResponse.json({ error: "Укажите имя курьера." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Укажите телефон курьера." }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не короче 6 символов." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      phone,
      password_hash: hashPassword(password),
      role: "courier",
    })
    .select("id, name, phone, is_active, created_at")
    .single();

  if (error) {
    const message = error.code === "23505" ? "Курьер с таким телефоном уже есть." : "Не удалось создать курьера.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, courier: data });
}
