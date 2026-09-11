/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#c89b3c",
          light: "#e0bd6f",
          dark: "#9c771f",
        },
        // Light-theme tokens — used by the internal /admin and /courier
        // back-office panels only. Keep these as a light theme: they're
        // out of scope for the storefront's dark "Luxury Oriental" redesign
        // and rely on this exact light-bg/dark-text contrast.
        cream: "#faf8f3",
        ink: {
          DEFAULT: "#2a2419",
          text: "#3d3527",
          soft: "#7a6f5a",
        },
        bg: "#fdfcf8",
        // Dark-theme tokens — the public storefront (Header, Hero, menu,
        // cart, footer). "night" is the page ground, "surface" is card
        // backgrounds, "parchment" is the light text color on that ground.
        night: "#0b0b0b",
        surface: {
          DEFAULT: "#151515",
          light: "#1e1e1e",
        },
        parchment: {
          DEFAULT: "#f5e6c8",
          soft: "rgba(245,230,200,0.62)",
        },
        // Uzbek majolica-tile teal, used sparingly alongside gold for
        // category identity.
        teal: {
          DEFAULT: "#1f6f6b",
          light: "#4fa89f",
          dark: "#134a47",
        },
        terracotta: {
          DEFAULT: "#c9573d",
          light: "#e18063",
          dark: "#9c3f28",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0,0,0,0.06)",
        card: "0 8px 30px rgba(42,36,25,0.08)",
        lift: "0 20px 50px rgba(42,36,25,0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        heroZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        drift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "120px 120px" },
        },
      },
      animation: {
        heroZoom: "heroZoom 20s ease-in-out infinite alternate",
        fadeUp: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
        drift: "drift 60s linear infinite",
      },
    },
  },
  plugins: [],
};
