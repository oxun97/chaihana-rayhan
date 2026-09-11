import { NextResponse } from "next/server";
import { getCourierSession, COURIER_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(COURIER_COOKIE)?.value;
  const session = await getCourierSession(token);
  if (!session) return NextResponse.json({ courier: null });
  return NextResponse.json({
    courier: { id: session.courier.id, name: session.courier.name, phone: session.courier.phone },
  });
}
