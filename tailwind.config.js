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
          DEFAULT: "#c9a96e",
          light: "#e8d5a3",
          dark: "#a9895a",
        },
        cream: "#faf8f3",
        ink: {
          DEFAULT: "#2a2419",
          text: "#3d3527",
          soft: "#7a6f5a",
        },
        bg: "#fdfcf8",
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
      },
      animation: {
        heroZoom: "heroZoom 20s ease-in-out infinite alternate",
        fadeUp: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
