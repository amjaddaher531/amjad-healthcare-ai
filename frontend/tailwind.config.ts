import type { Config } from "tailwindcss";

// Design tokens for Amjad Healthcare AI:
// A clinical-trust palette — deep teal/ink for authority, a single amber
// accent reserved for "needs attention" states, and a slate scale for
// everything structural. Deliberately avoids the generic cream/terracotta
// AI-app look; this reads like instrument-panel software, not a landing page.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#071A19",
          900: "#0B2726",
          800: "#0F3532",
          700: "#154846",
        },
        teal: {
          600: "#0E7C74",
          500: "#12968C",
          400: "#22B3A6",
          300: "#63D4C8",
        },
        amber: {
          500: "#C2760F",
          400: "#E08E1D",
        },
        slate: {
          50: "#F6F8F8",
          100: "#EAEEED",
          200: "#D6DEDC",
          300: "#B3C0BD",
          400: "#889694",
          500: "#5E6C6A",
          600: "#3F4B49",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
