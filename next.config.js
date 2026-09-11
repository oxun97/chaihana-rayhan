/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
