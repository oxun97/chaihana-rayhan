import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";
import { createClientSession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

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

  if (!name) return NextResponse.json({ error: "Укажите имя." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Укажите телефон." }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не короче 6 символов." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .insert({ name, phone, password_hash: hashPassword(password), role: "client" })
    .select("id, name, phone")
    .single();

  if (error) {
    const message = error.code === "23505" ? "Аккаунт с таким телефоном уже есть." : "Не удалось зарегистрироваться.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const session = await createClientSession({ userId: user.id, userAgent: request.headers.get("user-agent") });
  const res = NextResponse.json({ ok: true, client: user });
  res.cookies.set(CLIENT_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expires_at),
  });
  return res;
}
