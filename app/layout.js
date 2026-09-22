import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/playfair-display/cyrillic-400.css";
import "@fontsource/playfair-display/cyrillic-600.css";
import "@fontsource/playfair-display/cyrillic-700.css";
import "./globals.css";
import { LangProvider } from "@/context/LangContext";
import { CartProvider } from "@/context/CartContext";
import { MenuProvider } from "@/context/MenuContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "@/context/ThemeContext";
import ServiceWorker from "@/components/ServiceWorker";
import { readMenuCategories } from "@/lib/menu-server";

// The menu is editable at runtime via /admin, so this layout (and everything
// under it) must be rendered per-request rather than baked in at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://chaihana-rayhan.ru"),
  title: "Чайхана Райхан — Доставка восточной кухни | Москва",
  description:
    "Чайхана Райхан — доставка восточной кухни в Москве. Плов, шашлык, лагман, манты, салаты и десерты. Заказ онлайн или по телефону.",
  openGraph: {
    title: "Чайхана Райхан — Доставка восточной кухни в Москве",
    description:
      "Плов, шашлык, лагман, манты и другие блюда узбекской и восточной кухни с доставкой в Москве.",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#B51F24",
  viewportFit: "cover",
};

export default async function RootLayout({ children }) {
  let categories = [];
  try {
    categories = await readMenuCategories();
  } catch (e) {
    console.error("Failed to load menu from the database:", e);
  }

  return (
    <html lang="ru" data-theme="day" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <ServiceWorker />
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>
              <MenuProvider categories={categories}>
                <FavoritesProvider>
                  <CartProvider>{children}</CartProvider>
                </FavoritesProvider>
              </MenuProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
