import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            background: "#c9a96e",
            transform: "rotate(45deg)",
            borderRadius: 10,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
