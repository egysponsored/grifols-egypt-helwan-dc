import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#071a2b",
          800: "#0b2742",
          700: "#103459",
          600: "#174372",
          500: "#1e558f",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
