import { NextResponse } from "next/server";
import { getClientSession, CLIENT_COOKIE } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(CLIENT_COOKIE)?.value;
  const session = await getClientSession(token);
  if (!session) return NextResponse.json({ client: null });
  return NextResponse.json({
    client: { id: session.client.id, name: session.client.name, phone: session.client.phone },
  });
}
