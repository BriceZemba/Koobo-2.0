/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f1f8ec", 100: "#dcedcd", 200: "#bcdca3", 300: "#97c873",
          400: "#74b14a", 500: "#56962f", 600: "#3f7722", 700: "#2e7d32",
          800: "#285f1e", 900: "#1f4717",
        },
        lime: { DEFAULT: "#8BC34A", 400: "#9ccc65", 500: "#8bc34a", 600: "#7cb342" },
        soil: { DEFAULT: "#6D4C41", 400: "#8d6e63", 500: "#6d4c41", 600: "#5d4037" },
        cream: "#F7F9F3",
        sun: "#F6B93B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(46, 125, 50, 0.25)",
        card: "0 4px 24px -8px rgba(0,0,0,0.12)",
      },
      borderRadius: { "2xl": "1.25rem", "3xl": "1.75rem" },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "fade-up": { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
