import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#1F1B3A",
          soft: "#3A3556",
          muted: "#8B86A8",
          faint: "#B9B5CC",
        },
        violet: {
          50: "#F5F3FF",
          100: "#EFECFF",
          200: "#DED7FA",
          400: "#8B7BEA",
          500: "#6C5CE7",
          600: "#5A4BD1",
          700: "#4B3FBF",
        },
        panel: {
          DEFAULT: "#F1EFF8",
          line: "rgba(108,92,231,0.25)",
        },
        good: {
          fg: "#0F8A4C",
          bg: "#E3F7EC",
        },
        night: "#0B0A16",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(120% 100% at 15% 0%, #F3F1FF 0%, #EFECFF 35%, #ffffff 70%)",
        "brand-gradient": "linear-gradient(90deg, #6C5CE7 0%, #B24BE0 55%, #E8558C 100%)",
        "panel-gradient": "linear-gradient(160deg, #EFECFF 0%, #E3DDFB 100%)",
        "photo-gradient": "linear-gradient(160deg, #EFECFF, #DED7FA)",
      },
      boxShadow: {
        card: "0 12px 32px rgba(76,63,191,0.16)",
        "card-soft": "0 2px 8px rgba(76,63,191,0.05)",
        photo: "0 18px 40px rgba(76,63,191,0.14)",
      },
      keyframes: {
        "helix-drift": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.05)" },
        },
        "dash": {
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "helix-drift": "helix-drift 8s ease-in-out infinite",
        "blob-drift": "blob-drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
