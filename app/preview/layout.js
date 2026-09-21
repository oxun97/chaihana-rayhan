import PreviewSwitcher from "@/components/preview/PreviewSwitcher";
import CheckoutModal from "@/components/CheckoutModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Превью дизайна — Чайхана Райхан",
  robots: { index: false, follow: false },
};

// Temporary: two design directions served side by side on real menu data so
// the owner can pick one on their own phone. Both this layout and
// app/preview/* come out once a direction is chosen.
export default function PreviewLayout({ children }) {
  return (
    <div className="min-h-screen bg-night">
      <PreviewSwitcher />
      {children}
      <CheckoutModal />
    </div>
  );
}
