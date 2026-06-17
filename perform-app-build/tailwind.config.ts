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
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
        "accent-sheen": "linear-gradient(135deg, #60a5fa 0%, #2563eb 60%, #6366f1 100%)",
        "surface-glow": "radial-gradient(120% 120% at 50% 0%, rgba(37,99,235,0.10) 0%, rgba(8,11,18,0) 60%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        lift: "0 1px 0 rgba(255,255,255,0.05) inset, 0 16px 40px -16px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(37,99,235,0.4), 0 8px 28px -8px rgba(37,99,235,0.45)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
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
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(37,99,235,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(37,99,235,0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideIn: "slideIn 0.2s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        scaleIn: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        float: "float 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
