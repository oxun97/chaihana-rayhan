export default function robots() {
  const base = process.env.SITE_URL || "https://chaihana-rayhan.ru";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/courier"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
