/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 240 3.7% 15.9%))",
        input: "hsl(var(--input, 240 3.7% 15.9%))",
        ring: "hsl(var(--ring, 240 4.9% 83.9%))",
        background: "hsl(var(--background, 240 10% 3.9%))",
        foreground: "hsl(var(--foreground, 0 0% 98%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 0 0% 98%))",
          foreground: "hsl(var(--primary-foreground, 240 5.9% 10%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 240 3.7% 15.9%))",
          foreground: "hsl(var(--secondary-foreground, 0 0% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 240 3.7% 15.9%))",
          foreground: "hsl(var(--muted-foreground, 240 5% 64.9%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 240 3.7% 15.9%))",
          foreground: "hsl(var(--accent-foreground, 0 0% 98%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 240 10% 4.9%))",
          foreground: "hsl(var(--card-foreground, 0 0% 98%))",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Host Grotesk", "Inter", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        squircle: "18px",
      },
      boxShadow: {
        glow: "0 0 50px -12px rgba(255, 255, 255, 0.12)",
        "glow-cyan": "0 0 60px -15px rgba(6, 182, 212, 0.25)",
        "glow-emerald": "0 0 60px -15px rgba(16, 185, 129, 0.25)",
        "glow-amber": "0 0 60px -15px rgba(245, 158, 11, 0.25)",
        "window-chrome": "0 24px 70px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
