/** @type {import('tailwindcss').Config} */

/** Every stash color exposes the same five semantic slots. */
const stashColor = (name) => ({
  surface: `var(--stash-${name}-surface)`,
  hover: `var(--stash-${name}-hover)`,
  border: `var(--stash-${name}-border)`,
  fg: `var(--stash-${name}-fg)`,
  muted: `var(--stash-${name}-muted)`,
  dot: `var(--stash-${name}-dot)`,
});

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}", "./website/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        subtle: "hsl(var(--subtle-foreground))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
          hover: "hsl(var(--surface-hover))",
          sunken: "hsl(var(--surface-sunken))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
          muted: "hsl(var(--brand-muted))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        editor: {
          DEFAULT: "hsl(var(--editor))",
          foreground: "hsl(var(--editor-foreground))",
          placeholder: "hsl(var(--editor-placeholder))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
          hover: "hsl(var(--sidebar-hover))",
          border: "hsl(var(--sidebar-border))",
        },
        stash: {
          paper: stashColor("paper"),
          sand: stashColor("sand"),
          lemon: stashColor("lemon"),
          sage: stashColor("sage"),
          mint: stashColor("mint"),
          sky: stashColor("sky"),
          lavender: stashColor("lavender"),
          rose: stashColor("rose"),
          graphite: stashColor("graphite"),
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        none: "none",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI Variable Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "GeistMono",
          "ui-monospace",
          "SFMono-Regular",
          "Cascadia Code",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        // Tight desktop-utility scale; metadata sits at 11px, body at 13px.
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.005em" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.5rem" }],
      },
      transitionTimingFunction: {
        // Apple-ish deceleration: fast out of the gate, long soft landing.
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        "toast-in": "toast-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
