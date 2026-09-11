import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Hero from "@/components/Hero";
import CategoryRow from "@/components/CategoryRow";
import PopularDishes from "@/components/PopularDishes";
import MenuSection from "@/components/MenuSection";
import CartSidebar from "@/components/CartSidebar";
import AboutSection from "@/components/AboutSection";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
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
  let menuError = false;
  try {
    categories = await readMenuCategories();
  } catch (e) {
    console.error("Failed to load menu from the database:", e);
    menuError = true;
  }

  const featuredDishes = getFeaturedDishes(categories);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Toast />
      <main className="pb-20 lg:pb-0">
        <Hero />
        {!menuError && <CategoryRow />}

        {menuError ? (
          <div className="mx-auto max-w-xl px-4 py-16 text-center">
            <p className="font-serif text-lg font-semibold text-parchment">
              Меню временно недоступно
            </p>
            <p className="mt-2 text-sm text-parchment-soft">
              Пожалуйста, позвоните нам, чтобы сделать заказ, или попробуйте обновить
              страницу через несколько минут.
            </p>
          </div>
        ) : (
          <div
            id="menu-top"
            className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-6 sm:px-6 lg:flex lg:items-start lg:gap-8"
          >
            <div className="min-w-0 flex-1">
              <PopularDishes dishes={featuredDishes} />
              {categories.map((cat) => (
                <MenuSection key={cat.id} category={cat} />
              ))}
            </div>
            <div className="lg:w-[320px] lg:shrink-0">
              <CartSidebar />
            </div>
          </div>
        )}

        <AboutSection />
        <ReviewsSection />
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
      <MobileNav />
    </>
  );
}
