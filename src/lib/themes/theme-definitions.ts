export type AppTheme =
  | "system"
  | "dark"
  | "light"
  | "terminal"
  | "amber-crt"
  | "cyberpunk"
  | "dracula"
  | "nord"
  | "monokai"
  | "solarized-dark"
  | "solarized-light"
  | "matcha"
  | "synthwave"
  | "rose-pine"
  | "e-ink";

export type ThemeCategory = "all" | "terminal" | "code" | "dark" | "light" | "retro";

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  tagline: string;
  category: "terminal" | "code" | "dark" | "light" | "retro";
  isDark: boolean;
  badge?: string;
  swatches: {
    bg: string;
    surface: string;
    accent: string;
    fg: string;
    border: string;
  };
  recommendedFont?: "sans" | "mono" | "serif" | "rounded";
  isTerminalStyle?: boolean;
}

export const THEMES_LIST: ThemeDefinition[] = [
  // Terminal Themes
  {
    id: "terminal",
    name: "Terminal Matrix",
    tagline: "Obsidian CRT phosphor green with sharp hacker CLI aesthetics",
    category: "terminal",
    isDark: true,
    badge: "HACKER CLI",
    swatches: {
      bg: "#060906",
      surface: "#0b120c",
      accent: "#22c55e",
      fg: "#4ade80",
      border: "#166534",
    },
    recommendedFont: "mono",
    isTerminalStyle: true,
  },
  {
    id: "amber-crt",
    name: "Terminal Amber (VT100)",
    tagline: "Vintage 1980s DEC mainframe phosphor amber glow and sharp corners",
    category: "terminal",
    isDark: true,
    badge: "RETRO CRT",
    swatches: {
      bg: "#0a0702",
      surface: "#140e04",
      accent: "#f59e0b",
      fg: "#fbbf24",
      border: "#78350f",
    },
    recommendedFont: "mono",
    isTerminalStyle: true,
  },

  // Dark & Code Themes
  {
    id: "dark",
    name: "Obsidian Dark",
    tagline: "Default sober indigo-tinted dark shell with soft depth",
    category: "dark",
    isDark: true,
    badge: "DEFAULT",
    swatches: {
      bg: "#101014",
      surface: "#15151a",
      accent: "#6366f1",
      fg: "#f4f4f5",
      border: "#27272a",
    },
    recommendedFont: "sans",
  },
  {
    id: "dracula",
    name: "Dracula Gothic",
    tagline: "The famous high-contrast gothic palette with pastel purples and pinks",
    category: "code",
    isDark: true,
    badge: "POPULAR",
    swatches: {
      bg: "#282a36",
      surface: "#343746",
      accent: "#bd93f9",
      fg: "#f8f8f2",
      border: "#44475a",
    },
    recommendedFont: "sans",
  },
  {
    id: "nord",
    name: "Nord Arctic",
    tagline: "Cold arctic aurora polar night with glacial frost turquoise",
    category: "code",
    isDark: true,
    badge: "ARCTIC",
    swatches: {
      bg: "#2e3440",
      surface: "#3b4252",
      accent: "#88c0d0",
      fg: "#eceff4",
      border: "#4c566a",
    },
    recommendedFont: "sans",
  },
  {
    id: "monokai",
    name: "Monokai Pro",
    tagline: "Sublime developer palette with warm slate, yellow, and radiant mint",
    category: "code",
    isDark: true,
    badge: "DEV FAVORITE",
    swatches: {
      bg: "#272822",
      surface: "#30322a",
      accent: "#ffd866",
      fg: "#f8f8f2",
      border: "#49483e",
    },
    recommendedFont: "mono",
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    tagline: "Ethan Schoonover's scientifically calibrated precision teal palette",
    category: "code",
    isDark: true,
    badge: "CALIBRATED",
    swatches: {
      bg: "#002b36",
      surface: "#073642",
      accent: "#2aa198",
      fg: "#93a1a1",
      border: "#0e4756",
    },
    recommendedFont: "mono",
  },

  // Retro & Neon Themes
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    tagline: "Electric neon yellow, laser magenta, and high-tech midnight violet",
    category: "retro",
    isDark: true,
    badge: "NEON",
    swatches: {
      bg: "#080612",
      surface: "#120f24",
      accent: "#fcee0a",
      fg: "#00f0ff",
      border: "#ff007f",
    },
    recommendedFont: "mono",
    isTerminalStyle: true,
  },
  {
    id: "synthwave",
    name: "Synthwave '84",
    tagline: "Outrun neon grid sunset with hot pink, laser cyan, and violet skies",
    category: "retro",
    isDark: true,
    badge: "OUTRUN",
    swatches: {
      bg: "#241b35",
      surface: "#2c2242",
      accent: "#ff7edb",
      fg: "#f92aad",
      border: "#49356d",
    },
    recommendedFont: "sans",
  },
  {
    id: "rose-pine",
    name: "Rosé Pine Moon",
    tagline: "Cozy Scandinavian twilight with dusty rose, pine, and warm gold",
    category: "dark",
    isDark: true,
    badge: "LO-FI",
    swatches: {
      bg: "#191724",
      surface: "#1f1d2e",
      accent: "#ebbcba",
      fg: "#e0def4",
      border: "#312f44",
    },
    recommendedFont: "sans",
  },
  {
    id: "matcha",
    name: "Matcha Zen",
    tagline: "Calming Japanese forest ceremony with soothing jade and bamboo tones",
    category: "dark",
    isDark: true,
    badge: "ZEN",
    swatches: {
      bg: "#152017",
      surface: "#1e2c21",
      accent: "#7da379",
      fg: "#d8e2dc",
      border: "#2d4231",
    },
    recommendedFont: "sans",
  },

  // Light & Minimalist Themes
  {
    id: "light",
    name: "Paper Minimal Light",
    tagline: "Crisp natural paper white with warm neutral surfaces and indigo accents",
    category: "light",
    isDark: false,
    badge: "DEFAULT LIGHT",
    swatches: {
      bg: "#ffffff",
      surface: "#f8f8f9",
      accent: "#4f46e5",
      fg: "#18181b",
      border: "#e4e4e7",
    },
    recommendedFont: "sans",
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    tagline: "Warm archival parchment cream with calibrated blue and cyan inks",
    category: "light",
    isDark: false,
    badge: "PARCHMENT",
    swatches: {
      bg: "#fdf6e3",
      surface: "#eee8d5",
      accent: "#268bd2",
      fg: "#586e75",
      border: "#d5ccb6",
    },
    recommendedFont: "sans",
  },
  {
    id: "e-ink",
    name: "E-Ink Minimalist",
    tagline: "High-contrast distraction-free e-paper monochrome without saturation",
    category: "light",
    isDark: false,
    badge: "DISTRACTION-FREE",
    swatches: {
      bg: "#f8f8f8",
      surface: "#eeeeee",
      accent: "#171717",
      fg: "#111111",
      border: "#737373",
    },
    recommendedFont: "mono",
    isTerminalStyle: true,
  },
];

export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: "all", label: "All Themes" },
  { id: "terminal", label: "Terminal & Hacker" },
  { id: "code", label: "Developer & Code" },
  { id: "retro", label: "Cyber & Synthwave" },
  { id: "dark", label: "Dark & Cozy" },
  { id: "light", label: "Light & Minimal" },
];

export interface TerminalUXSettings {
  crtScanlines: boolean;
  promptSymbol: string;
  blinkingBlockCursor: boolean;
  sharpBorders: boolean;
  glowEffects: boolean;
}

export const DEFAULT_TERMINAL_SETTINGS: TerminalUXSettings = {
  crtScanlines: false,
  promptSymbol: "stash@cli:~$",
  blinkingBlockCursor: true,
  sharpBorders: true,
  glowEffects: true,
};

export const TERMINAL_PROMPTS = [
  { id: "stash@cli:~$", label: "stash@cli:~$" },
  { id: "❯", label: "❯ (Pure Shell)" },
  { id: "$", label: "$ (Standard Bash)" },
  { id: ">>", label: ">> (Interpreter)" },
  { id: "C:\\STASH>", label: "C:\\STASH> (DOS)" },
];
