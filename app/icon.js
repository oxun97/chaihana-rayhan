import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a2419",
          borderRadius: 14,
        }}
      >
        {/* CSS-drawn diamond mark — avoids depending on a font glyph (e.g.
            the ✦ character) that may be missing or require a network fetch
            of a Google Font at build/edge-render time. */}
        <div
          style={{
            width: 24,
            height: 24,
            background: "#c9a96e",
            transform: "rotate(45deg)",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
