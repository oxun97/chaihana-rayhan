import Header from "@/components/site/Header";
import Storefront from "@/components/site/Storefront";
import Footer from "@/components/site/Footer";
import MobileBottomNav from "@/components/site/MobileBottomNav";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import AuthModal from "@/components/AuthModal";
import Toast from "@/components/Toast";
import { readMenuCategories, getFeaturedDishes } from "@/lib/menu-server";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Чайхана Райхан",
  description: "Восточная кухня с душой — доставка узбекской кухни в Москве",
  servesCuisine: ["Восточная", "Узбекская", "Кавказская", "Азиатская"],
  telephone: "+79015165789",
  priceRange: "₽₽",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2-я Магистральная ул., 1/3, с1",
    addressLocality: "Москва",
    addressCountry: "RU",
    postalCode: "123290",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "23:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    ratingCount: "156",
  },
};

export default async function HomePage() {
  let categories = [];
  try {
    categories = await readMenuCategories();
  } catch (e) {
    console.error("Failed to load menu from the database:", e);
  }

  const featured = getFeaturedDishes(categories);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Toast />
      <Storefront featured={featured} />
      <Footer />
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />
      <MobileBottomNav />
    </>
  );
}
