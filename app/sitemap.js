export default function sitemap() {
  const base = process.env.SITE_URL || "https://chaihana-rayhan.ru";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
