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
        violet: {
          DEFAULT: "#7c5cff",
          bright: "#9d7bff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
        "accent-sheen": "linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #7c5cff 100%)",
        "surface-glow": "radial-gradient(120% 120% at 50% 0%, rgba(37,99,235,0.10) 0%, rgba(8,11,18,0) 60%)",
        // Signature multi-stop brand gradient (blue → indigo → violet)
        "brand-gradient": "linear-gradient(120deg, #3b82f6 0%, #4f6bff 38%, #7c5cff 72%, #22d3a5 130%)",
        "aurora": "radial-gradient(40% 60% at 20% 10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(45% 55% at 85% 15%, rgba(124,92,255,0.16), transparent 60%), radial-gradient(50% 60% at 50% 110%, rgba(34,211,165,0.10), transparent 60%)",
        "hairline": "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 40%)",
        "shine": "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.22) 48%, transparent 72%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -14px rgba(0,0,0,0.7)",
        lift: "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -22px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(37,99,235,0.4), 0 10px 32px -8px rgba(37,99,235,0.5)",
        "glow-violet": "0 0 0 1px rgba(124,92,255,0.4), 0 10px 32px -8px rgba(124,92,255,0.45)",
        ring: "0 0 0 1px rgba(255,255,255,0.06)",
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
        auroraDrift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.9" },
          "50%": { transform: "translate3d(2%, -2%, 0) scale(1.08)", opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shineSweep: {
          "0%": { transform: "translateX(-120%)" },
          "60%, 100%": { transform: "translateX(120%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideIn: "slideIn 0.2s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        scaleIn: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        float: "float 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        aurora: "auroraDrift 14s ease-in-out infinite",
        "gradient-shift": "gradientShift 6s ease infinite",
        shine: "shineSweep 4.5s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
