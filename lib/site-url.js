// Where the public site lives, for things that must keep working across
// deploys — above all the Telegram webhook.
//
// VERCEL_PROJECT_PRODUCTION_URL is set by Vercel itself and always names
// the project's stable production domain (the custom domain once one is
// attached). It is deliberately preferred over a hand-entered SITE_URL,
// because the easy mistake is to paste the deployment-specific URL shown
// after a build (project-<hash>-owner.vercel.app): that address serves one
// immutable build, so a webhook registered against it starts returning 404
// and silently stops delivering.
//
// Never use VERCEL_URL here — that is exactly the per-deployment address.
export function getPublicOrigin() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production.replace(/\/$/, "")}`;

  const manual = process.env.SITE_URL;
  if (manual) return manual.replace(/\/$/, "");

  return null;
}

// A deployment-specific Vercel address: the project name, then a build
// hash, then the account slug. Used to warn when a webhook is pointed at
// one of these instead of the production domain.
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
