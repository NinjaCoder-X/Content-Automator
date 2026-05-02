import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0b14",
        surface: "#11131f",
        elevated: "#161827",
        border: "#1f2235",
        muted: "#7a7f9c",
        text: "#e6e9f5",
        primary: {
          DEFAULT: "#7c5cff",
          50: "#f3efff",
          100: "#e2d8ff",
          400: "#9a82ff",
          500: "#7c5cff",
          600: "#6440ff",
          700: "#4d2bdb",
        },
        accent: "#22d3ee",
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#f87171",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(124,92,255,0.18), transparent 60%)",
        "hero-glow":
          "radial-gradient(ellipse 800px 400px at 50% -10%, rgba(124,92,255,0.35), transparent 60%), radial-gradient(ellipse 600px 300px at 80% 10%, rgba(34,211,238,0.18), transparent 60%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(8, 10, 25, 0.45)",
        glow: "0 0 40px rgba(124,92,255,0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-up": "slide-up 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
