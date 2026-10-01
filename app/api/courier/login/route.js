import { NextResponse } from "next/server";
import { createCourierSession, findUserByPhoneAndPassword, COURIER_COOKIE } from "@/lib/auth-server";
import { normalizePhone } from "@/lib/phone";
import { allowAttempt, clientIp, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit";

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

  try {
    const ip = clientIp(request);
    const [ipOk, phoneOk] = await Promise.all([
      allowAttempt(`login-ip:${ip}`, 30, 900),
      allowAttempt(`login:courier:${normalizePhone(phone) || phone}`, 8, 900),
    ]);
    if (!ipOk || !phoneOk) {
      return NextResponse.json({ error: TOO_MANY_ATTEMPTS }, { status: 429 });
    }

    const user = await findUserByPhoneAndPassword({ phone, password, role: "courier" });
    if (!user) {
      return NextResponse.json({ error: "Неверный телефон или пароль." }, { status: 401 });
    }

    const session = await createCourierSession({
      userId: user.id,
      userAgent: request.headers.get("user-agent"),
    });

    const res = NextResponse.json({ ok: true, courier: { id: user.id, name: user.name, phone: user.phone } });
    res.cookies.set(COURIER_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expires_at),
    });
    return res;
  } catch (e) {
    console.error("Courier login failed:", e);
    return NextResponse.json({ error: "Не удалось войти. Попробуйте ещё раз." }, { status: 500 });
  }
}
