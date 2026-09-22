import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon. No corner rounding here — iOS masks the icon
// itself, and rounding it twice leaves a visible cocoa fringe.
export default function AppleIcon() {
  return new ImageResponse(<AppIconArtwork size={size.width} inset={0.22} radius={0} />, {
    ...size,
  });
}
