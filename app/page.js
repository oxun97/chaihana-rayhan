import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import Toast from "@/components/Toast";
import { readMenuCategories } from "@/lib/menu-server";

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
  const categories = await readMenuCategories();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav categories={categories} />
      <Toast />
      <main>
        <Hero />
        {categories.map((cat) => (
          <MenuSection key={cat.id} category={cat} />
        ))}
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </>
  );
}
