// Web app manifest, generated so the theme colours stay in one place with
// the rest of the app rather than duplicated in a static JSON file.
export default function manifest() {
  return {
    name: "Чайхана Райхан — доставка восточной кухни",
    short_name: "Чайхана Райхан",
    description:
      "Плов, шашлык, лагман, манты и другие блюда узбекской кухни с доставкой в Москве. Заказ онлайн и бронирование столика.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ru",
    background_color: "#F7F0E5",
    theme_color: "#B51F24",
    categories: ["food", "shopping"],
    // Sizes must match the real bitmaps: Chrome verifies them and refuses to
    // install the app when no icon is at least 192px. See
    // app/pwa-icon/[variant]/route.js.
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
