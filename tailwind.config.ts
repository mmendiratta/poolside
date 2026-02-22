import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        ink: "#0D0D0D",
        chalk: "#F5F2EB",
        felt: "#1A3A2A",
        "felt-light": "#2A5A40",
        gold: "#C8A84B",
        "gold-light": "#E8C86B",
        muted: "#6B6B5A",
        border: "#E0DDD4",
        danger: "#C0392B",
        pending: "#8B6914",
      },
      borderRadius: { card: "16px" },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
