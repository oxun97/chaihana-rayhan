import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/lib/app-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Browser-tab favicon. Rendered small on purpose; the large icons the web
// app manifest needs live in app/pwa-icon/[variant]/route.js.
export default function Icon() {
  return new ImageResponse(<AppIconArtwork size={size.width} inset={0.18} radius={0.22} />, {
    ...size,
  });
}
