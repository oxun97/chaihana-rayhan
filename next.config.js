/** @type {import('next').NextConfig} */
// Baseline browser hardening for every response. No Content-Security-Policy
// yet: the theme boot script and JSON-LD are inline, and a CSP that breaks
// the page is worse than none — it needs nonces first.
const SECURITY_HEADERS = [
  // HTTPS only, for two years, subdomains included.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // The site must not be framed by another site (clickjacking the admin
  // panel or the checkout).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    // Dish/category photos are served from the Supabase Storage
    // "menu-images" public bucket (see lib/menu-server.js, app/api/admin/upload).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
    ],
  },
};

module.exports = nextConfig;
