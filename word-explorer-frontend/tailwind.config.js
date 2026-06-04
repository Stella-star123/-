/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      primary: {
        DEFAULT: "#6C5CE7",
        50: "#F0EDFF",
        100: "#E0DAFF",
        200: "#C4B5FF",
        300: "#A78BFA",
        400: "#8B5CF6",
        500: "#6C5CE7",
        600: "#5B4FCF",
        700: "#4C3FB0",
        800: "#3D2F91",
        900: "#2E1F72",
      },
      secondary: {
        DEFAULT: "#FF6B35",
        50: "#FFF0E8",
        100: "#FFD9C2",
        200: "#FFB894",
        300: "#FF8A5C",
        400: "#FF6B35",
        500: "#F54D1C",
        600: "#CC3A10",
        700: "#992C0C",
        800: "#661D08",
        900: "#330F04",
      },
      background: {
        DEFAULT: "#F8F9FE",
        card: "#FFFFFF",
      },
      text: {
        DEFAULT: "#2D3436",
        secondary: "#636E72",
      },
      border: {
        DEFAULT: "#E2E8F0",
      },
      fontFamily: {
        sans: ["PingFang SC", "Roboto", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      animation: {
        "breathe": "breathe 2s ease-in-out infinite",
        "streak-flame": "streak-flame 0.6s ease-in-out infinite alternate",
      },
      keyframes: {
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        "streak-flame": {
          "0%": { transform: "scale(1) rotate(-2deg)" },
          "100%": { transform: "scale(1.15) rotate(2deg)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
