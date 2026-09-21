// The address the admin actually reached this app on. This is the most
// trustworthy source for registering a webhook: unlike an env var, a host
// that just served this request is provably serving the app right now.
// Env vars went stale twice here — a hand-entered SITE_URL pointed at a
// single immutable build, and VERCEL_PROJECT_PRODUCTION_URL kept naming a
// custom domain that had since been detached from the project. Telegram
// answered both with 404.
export function getOriginFromRequest(request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return null;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host.replace(/\/$/, "")}`;
}

// A deployment-specific Vercel address: the project name, then a build
// hash, then the account slug. Such an address serves one immutable build,
// so a webhook registered against it stops delivering after the next
// deploy — worth refusing outright rather than warning about later.
export function isDeploymentSpecificUrl(url) {
  try {
    const { hostname } = new URL(url);
    if (!hostname.endsWith(".vercel.app")) return false;
    const label = hostname.slice(0, -".vercel.app".length);
    return /-[a-z0-9]{8,}-[^.]+$/.test(label);
  } catch {
    return false;
  }
}
