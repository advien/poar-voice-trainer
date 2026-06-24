import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f766e",
          light: "#14b8a6",
          dark: "#0d5d56",
        },
      },
    },
  },
  plugins: [],
};

export default config;
