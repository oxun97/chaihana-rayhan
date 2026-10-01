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

// Server-to-server callbacks: they come from Telegram / YooKassa, carry no
// Origin, and authenticate themselves in their own handlers.
const CROSS_ORIGIN_ALLOWED = ["/api/telegram/webhook", "/api/payments/yookassa/webhook"];
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Cross-site request forgery: a page on another site making the browser
// send a state-changing request here, riding on the guest's cookies — or,
// for /admin, on the Basic-Auth password the browser has cached and
// attaches by itself. Browsers mark where a request came from; anything
// writing data must come from this site.
function isCrossSite(request) {
  const origin = request.headers.get("origin");
  if (origin) {
    if (origin === "null") return true;
    try {
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      return new URL(origin).host !== host;
    } catch {
      return true;
    }
  }
  return request.headers.get("sec-fetch-site") === "cross-site";
}

// Compares in time independent of where the strings first differ, so the
// password cannot be recovered one character at a time from response times.
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.ip || "unknown";
}

// Middleware runs on the edge, where the Node Supabase client is not
// loaded; a plain REST call to the two rate-limit functions is enough.
async function rpc(fn, args) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const ADMIN_MAX_FAILURES = 10;
const ADMIN_WINDOW_SECONDS = 900;
// Per-instance memo of "this IP is not locked out", so the admin panel's
// own polling does not cost a database round trip on every request.
const notBlockedUntil = new Map();

async function adminLocked(ip) {
  const now = Date.now();
  if ((notBlockedUntil.get(ip) || 0) > now) return false;
  const blocked = await rpc("rl_blocked", {
    p_key: `admin:${ip}`,
    p_max: ADMIN_MAX_FAILURES,
    p_window_seconds: ADMIN_WINDOW_SECONDS,
  });
  if (blocked !== true) notBlockedUntil.set(ip, now + 30_000);
  return blocked === true;
}

// Protects /admin and /api/admin with HTTP Basic Auth, gated by a single
// password stored in the ADMIN_PASSWORD environment variable — no database,
// no user accounts. Must be served over HTTPS in production so the
// credentials aren't sent in the clear.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    !SAFE_METHODS.includes(request.method) &&
    !CROSS_ORIGIN_ALLOWED.includes(pathname) &&
    isCrossSite(request)
  ) {
    return new NextResponse("Cross-site request blocked.", { status: 403 });
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      return new NextResponse(
        "Admin panel is not configured. Set ADMIN_PASSWORD in your environment.",
        { status: 500 }
      );
    }

    const ip = clientIp(request);
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

      if (safeEqual(suppliedPassword, password)) {
        // Even the right password is refused while this address is locked
        // out — otherwise a lockout would just tell a guesser when they won.
        if (await adminLocked(ip)) {
          return new NextResponse("Too many failed attempts. Try again in 15 minutes.", { status: 429 });
        }
        return withNoStore(NextResponse.next());
      }

      // A wrong password (not the browser's first, credential-less request).
      notBlockedUntil.delete(ip);
      await rpc("rl_hit", {
        p_key: `admin:${ip}`,
        p_max: ADMIN_MAX_FAILURES,
        p_window_seconds: ADMIN_WINDOW_SECONDS,
      });
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
