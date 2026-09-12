import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/password";
import { createClientSession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  const phone = (body?.phone || "").trim();
  const password = body?.password || "";
  if (!phone || !password) {
    return NextResponse.json({ error: "Введите телефон и пароль." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, phone, password_hash, role, is_active, name")
    .eq("phone", phone)
    .eq("role", "client")
    .maybeSingle();

  if (error || !user || !user.is_active || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Неверный телефон или пароль." }, { status: 401 });
  }

  const session = await createClientSession({ userId: user.id, userAgent: request.headers.get("user-agent") });
  const res = NextResponse.json({ ok: true, client: { id: user.id, name: user.name, phone: user.phone } });
  res.cookies.set(CLIENT_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expires_at),
  });
  return res;
}
