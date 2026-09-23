export interface FontOption {
  label: string;
  value: string;
  description?: string;
  previewFamily: string;
}

export const FONT_FAMILIES: FontOption[] = [
  {
    label: "Default (Sans)",
    value: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    description: "Clean & modern",
    previewFamily: "Inter, sans-serif",
  },
  {
    label: "Serif (Editorial)",
    value: "Georgia, Cambria, 'Times New Roman', Times, serif",
    description: "Classic & elegant",
    previewFamily: "Georgia, serif",
  },
  {
    label: "Monospace (Code)",
    value: "ui-monospace, SFMono-Regular, Cascadia Code, Menlo, Consolas, monospace",
    description: "Technical & crisp",
    previewFamily: "monospace",
  },
  {
    label: "Handwritten",
    value: "'Caveat', 'Comic Sans MS', 'Segoe Script', cursive",
    description: "Casual & personal",
    previewFamily: "cursive",
  },
  {
    label: "Slab (Trebuchet)",
    value: "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', sans-serif",
    description: "Crisp & distinctive",
    previewFamily: "'Trebuchet MS', sans-serif",
  },
  {
    label: "Modern Gothic",
    value: "'Century Gothic', 'Apple Gothic', Futura, sans-serif",
    description: "Geometric & stylish",
    previewFamily: "'Century Gothic', sans-serif",
  },
  {
    label: "Display / Bold",
    value: "Impact, 'Arial Black', sans-serif",
    description: "Heavy headlines",
    previewFamily: "Impact, sans-serif",
  },
];

export interface FontSizeOption {
  label: string;
  value: string;
  numeric: number;
}

export const FONT_SIZES: FontSizeOption[] = [
  { label: "10px", value: "10px", numeric: 10 },
  { label: "11px", value: "11px", numeric: 11 },
  { label: "12px", value: "12px", numeric: 12 },
  { label: "13px (Default)", value: "13px", numeric: 13 },
  { label: "14px", value: "14px", numeric: 14 },
  { label: "16px", value: "16px", numeric: 16 },
  { label: "18px", value: "18px", numeric: 18 },
  { label: "20px", value: "20px", numeric: 20 },
  { label: "24px", value: "24px", numeric: 24 },
  { label: "28px", value: "28px", numeric: 28 },
  { label: "32px", value: "32px", numeric: 32 },
  { label: "36px", value: "36px", numeric: 36 },
  { label: "44px", value: "44px", numeric: 44 },
];

export interface ColorOption {
  label: string;
  value: string;
}

export const TEXT_COLORS: ColorOption[] = [
  { label: "Default", value: "" },
  { label: "Charcoal", value: "#18181b" },
  { label: "Slate Gray", value: "#64748b" },
  { label: "Crimson Red", value: "#ef4444" },
  { label: "Flame Orange", value: "#f97316" },
  { label: "Amber Yellow", value: "#f59e0b" },
  { label: "Forest Green", value: "#10b981" },
  { label: "Emerald", value: "#059669" },
  { label: "Sky Blue", value: "#0ea5e9" },
  { label: "Royal Blue", value: "#3b82f6" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Violet Purple", value: "#8b5cf6" },
  { label: "Rose Pink", value: "#ec4899" },
  { label: "Ruby", value: "#e11d48" },
];

export const HIGHLIGHT_COLORS: ColorOption[] = [
  { label: "None", value: "" },
  { label: "Sun Yellow", value: "#fef08a" },
  { label: "Peach Orange", value: "#fed7aa" },
  { label: "Lime Green", value: "#bbf7d0" },
  { label: "Fresh Mint", value: "#a7f3d0" },
  { label: "Cyan Aqua", value: "#bae6fd" },
  { label: "Lavender", value: "#e9d5ff" },
  { label: "Soft Pink", value: "#fbcfe8" },
  { label: "Subtle Gray", value: "#e4e4e7" },
];
