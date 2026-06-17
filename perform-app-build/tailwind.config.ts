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
          0: "#080b12",
          1: "#0d1117",
          2: "#131922",
          3: "#1a2235",
          4: "#1e2a3d",
        },
        border: {
          DEFAULT: "#1e2d45",
          2: "#2a3f5e",
        },
        accent: {
          DEFAULT: "#2563eb",
          dim: "rgba(37,99,235,0.12)",
          dark: "#1d4ed8",
          bright: "#3b82f6",
          glow: "rgba(37,99,235,0.25)",
        },
        text: {
          1: "#e8edf5",
          2: "#8494a8",
          3: "#4a5568",
        },
        status: {
          green: "#22d3a5",
          red: "#f56565",
          amber: "#f6ad55",
          teal: "#2dd4bf",
          coral: "#fc8181",
          blue: "#63b3ed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideIn: "slideIn 0.2s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
