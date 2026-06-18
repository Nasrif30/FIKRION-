/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // FIKRION Design System
        bg: {
          base: "#09090B",
          elevated: "#111113",
          overlay: "#18181B",
        },
        brand: {
          DEFAULT: "#0A84FF",
          dim: "rgba(10,132,255,0.15)",
          glow: "rgba(10,132,255,0.08)",
        },
        threat: {
          critical: "#FF3B30",
          high: "#FF6B35",
          medium: "#FF9F0A",
          low: "#FFD60A",
          info: "#636366",
        },
        safe: "#30D158",
        warning: "#FF9F0A",
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          subtle: "rgba(255,255,255,0.04)",
          strong: "rgba(255,255,255,0.12)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "rgba(255,255,255,0.6)",
          tertiary: "rgba(255,255,255,0.35)",
          disabled: "rgba(255,255,255,0.2)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
        pill: "9999px",
      },
      backdropBlur: {
        xs: "4px",
        DEFAULT: "12px",
        md: "16px",
        lg: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-up": "fadeUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        thinking: "thinking 1.4s ease-in-out infinite",
        "ring-fill": "ringFill 1.5s ease-out forwards",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        thinking: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        ringFill: {
          "0%": { "stroke-dashoffset": "565" },
          "100%": { "stroke-dashoffset": "var(--target-offset)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        card: "0 1px 3px rgba(0,0,0,0.5)",
        brand: "0 0 20px rgba(10,132,255,0.25)",
        threat: "0 0 20px rgba(255,59,48,0.25)",
        safe: "0 0 20px rgba(48,209,88,0.2)",
      },
    },
  },
  plugins: [],
};
