import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2a2419 0%, #2a2419 55%, #134a47 100%)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: "#c9a96e",
            transform: "rotate(45deg)",
            borderRadius: 6,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Чайхана{" "}
          <span style={{ color: "#e8d5a3", marginLeft: 20 }}>Райхан</span>
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 30, color: "rgba(255,255,255,0.7)" }}>
          Доставка восточной кухни в Москве
        </div>
      </div>
    ),
    { ...size }
  );
}
