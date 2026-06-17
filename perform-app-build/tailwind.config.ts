import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#0a0a0f",
          1: "#111118",
          2: "#18181f",
          3: "#22222c",
          4: "#2a2a36",
        },
        border: {
          DEFAULT: "#2e2e3d",
          2: "#3a3a4d",
        },
        accent: {
          DEFAULT: "#7c6af7",
          dim: "rgba(124,106,247,0.12)",
          dark: "#5c4fd4",
        },
        text: {
          1: "#e8e8f0",
          2: "#9898b0",
          3: "#5a5a72",
        },
        status: {
          green: "#4ade80",
          red: "#f87171",
          amber: "#fbbf24",
          teal: "#2dd4bf",
          coral: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
