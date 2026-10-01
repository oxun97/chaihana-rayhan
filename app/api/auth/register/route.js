import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";
import { createClientSession, CLIENT_COOKIE } from "@/lib/auth-server";
import { normalizePhone, phoneVariants } from "@/lib/phone";
import { allowAttempt, clientIp, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  const name = (body?.name || "").trim().slice(0, 80);
  const phone = normalizePhone(body?.phone);
  const password = body?.password || "";

  if (!name) return NextResponse.json({ error: "Укажите имя." }, { status: 400 });
  if (!phone) {
    return NextResponse.json({ error: "Укажите телефон полностью, например +7 900 123-45-67." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не короче 6 символов." }, { status: 400 });
  }

  try {
    if (!(await allowAttempt(`register-ip:${clientIp(request)}`, 10, 3600))) {
      return NextResponse.json({ error: TOO_MANY_ATTEMPTS }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();
    // The unique index only sees exact strings; an older account may hold
    // the same number spelled differently.
    const { data: existing, error: lookupErr } = await supabase
      .from("users")
      .select("id")
      .in("phone", phoneVariants(phone))
      .eq("role", "client")
      .limit(1);
    if (lookupErr) throw lookupErr;
    if (existing?.length) {
      return NextResponse.json({ error: "Аккаунт с таким телефоном уже есть." }, { status: 400 });
    }

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
    // A brand-new account has no Telegram link yet, but the field is always
    // present so the client shape is identical across login/register/me.
    const res = NextResponse.json({ ok: true, client: { ...user, telegramLinked: false } });
    res.cookies.set(CLIENT_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expires_at),
    });
    return res;
  } catch (e) {
    console.error("Registration failed:", e);
    return NextResponse.json({ error: "Не удалось зарегистрироваться. Попробуйте ещё раз." }, { status: 500 });
  }
}
