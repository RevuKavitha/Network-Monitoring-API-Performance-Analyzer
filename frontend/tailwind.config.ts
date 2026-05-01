import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#f3f7fb",
          panel: "#ffffff",
          ink: "#0f172a",
          ok: "#15803d",
          bad: "#b91c1c",
          accent: "#0f766e"
        },
      },
    },
  },
  plugins: [],
};

export default config;
