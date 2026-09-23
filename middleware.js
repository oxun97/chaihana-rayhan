import { NextResponse } from "next/server";

// `export const dynamic = "force-dynamic"` on a route handler stops Next.js
// from caching it on the server, but it does not put anything on the wire
// telling Vercel's edge network or a browser not to cache the response
// either — that needs its own explicit Cache-Control header, and every API
// route here was missing it. Every read (an order list, `/api/auth/me`,
// dashboard stats, …) was one dropped header away from being served stale
// by an intermediary that a client-side hard refresh cannot bypass, because
// the stale copy lives upstream of the browser, not in it. Set centrally so
// no future route can forget it the same way.
function withNoStore(response) {
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

// Protects /admin and /api/admin with HTTP Basic Auth, gated by a single
// password stored in the ADMIN_PASSWORD environment variable — no database,
// no user accounts. Must be served over HTTPS in production so the
// credentials aren't sent in the clear.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      return new NextResponse(
        "Admin panel is not configured. Set ADMIN_PASSWORD in your environment.",
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Basic ")) {
      const encoded = authHeader.slice("Basic ".length);
      let decoded = "";
      try {
        decoded = atob(encoded);
      } catch {
        decoded = "";
      }
      const separatorIndex = decoded.indexOf(":");
      const suppliedPassword = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
      if (suppliedPassword === password) {
        return withNoStore(NextResponse.next());
      }
    }

    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Chaihana Rayhan Admin"' },
    });
  }

  // Every other /api/* route (courier, client auth, orders, bookings,
  // promo codes, the Telegram webhook) — no auth gate here, just the same
  // no-store guarantee.
  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
