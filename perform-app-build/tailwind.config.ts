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
        // Vital Signal — Ink / surface ramp (lifted navy-slate)
        bg: {
          0: "#0e1623", // void — app backdrop
          1: "#1a2433", // surface-1 — panels / sidebar
          2: "#1f2b3c", // surface-2 — cards
          3: "#27344a", // surface-3 — raised / hover
          4: "#323f59", // surface-4 — active wells
        },
        border: {
          DEFAULT: "#2d3e58", // line
          2: "#3d5070", // line-2
        },
        accent: {
          DEFAULT: "#189bf5", // Pulse Blue
          dim: "rgba(24,155,245,0.12)",
          dark: "#1346d8", // Deep Royal (pressed / gradient end)
          bright: "#3aa6f7",
          glow: "rgba(24,155,245,0.30)",
        },
        text: {
          1: "#eef3fa", // near-bone
          2: "#aebccd", // steel
          3: "#6c7f99", // muted
        },
        status: {
          green: "#2fe3a8", // Vital Mint — on-track / in-range
          red: "#f56565", // overdue / out-of-range
          amber: "#f6ad55", // due soon / borderline
          teal: "#2dd4bf",
          coral: "#fc8181",
          blue: "#63b3ed",
        },
        // No violet in Vital Signal — aliased to blue so any legacy usage stays on-brand
        violet: {
          DEFAULT: "#189bf5",
          bright: "#3aa6f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        // Vital Signal "current" — Pulse Blue → Deep Royal
        "accent-gradient": "linear-gradient(135deg, #189bf5 0%, #1346d8 100%)",
        "accent-sheen": "linear-gradient(135deg, #3aa6f7 0%, #189bf5 55%, #1346d8 100%)",
        "surface-glow": "radial-gradient(120% 120% at 50% 0%, rgba(24,155,245,0.10) 0%, rgba(14,22,35,0) 60%)",
        // Brand current — blue → royal, mint rationed to a faint tail
        "brand-gradient": "linear-gradient(120deg, #7cc2fb 0%, #189bf5 42%, #1346d8 88%, #2fe3a8 140%)",
        // Ambient signal glow — blue + royal, a whisper of mint (the void it glows within)
        "aurora": "radial-gradient(40% 60% at 20% 10%, rgba(24,155,245,0.18), transparent 60%), radial-gradient(45% 55% at 85% 15%, rgba(19,70,216,0.16), transparent 60%), radial-gradient(50% 60% at 50% 110%, rgba(47,227,168,0.06), transparent 60%)",
        "hairline": "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 40%)",
        "shine": "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.22) 48%, transparent 72%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -14px rgba(0,0,0,0.7)",
        lift: "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -22px rgba(0,0,0,0.8)",
        // Vital glow-blue — the brand's real elevation is light, not shadow
        glow: "0 0 0 1px rgba(24,155,245,0.35), 0 0 24px rgba(24,155,245,0.22)",
        "glow-violet": "0 0 0 1px rgba(24,155,245,0.35), 0 0 24px rgba(24,155,245,0.22)",
        ring: "0 0 0 1px rgba(255,255,255,0.06)",
      },
      borderRadius: {
        xl: "12px", // Vital --r-lg (cards)
        "2xl": "16px", // Vital --r-xl (panels / modals)
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(24,155,245,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(24,155,245,0)" },
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
