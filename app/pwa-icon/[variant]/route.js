import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/lib/app-icon";

// Icons for the web app manifest. They live in their own route rather than
// in app/icon.js because a manifest has to advertise the real pixel size of
// every icon: Chrome checks it, and refuses to install the app when no icon
// is at least 192px. The favicon stays small, these are the large ones.
//
// The maskable variant carries a wider margin and no corner rounding: the
// platform applies its own mask and may crop anything outside the inner 80%
// circle. The rosette is inscribed in a circle of its own full extent, so an
// inset of 0.22 (a 56% span) sits comfortably inside that safe zone.
const VARIANTS = {
  192: { size: 192, inset: 0.19, radius: 0.22 },
  512: { size: 512, inset: 0.19, radius: 0.22 },
  "512-maskable": { size: 512, inset: 0.22, radius: 0 },
};

export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export function GET(request, { params }) {
  const variant = VARIANTS[params.variant];
  if (!variant) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<AppIconArtwork {...variant} />, {
    width: variant.size,
    height: variant.size,
  });
}
