import { NextResponse } from "next/server";
import { destroySession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const token = request.cookies.get(CLIENT_COOKIE)?.value;
  await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
