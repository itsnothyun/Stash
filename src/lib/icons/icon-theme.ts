export interface WidgetColorDef {
  text: string;
  bg: string;
  border: string;
}

export const WIDGET_COLORS: Record<string, WidgetColorDef> = {
  calculator: {
    text: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  timer: {
    text: "text-rose-500",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
  swap: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  ticker: {
    text: "text-blue-500",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
  },
  countdown: {
    text: "text-orange-500",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
  },
  worldclock: {
    text: "text-cyan-500",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
  },
  unitconverter: {
    text: "text-indigo-500",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
  },
  counter: {
    text: "text-purple-500",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
  },
  browser: {
    text: "text-cyan-500",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
  },
  scratchpad: {
    text: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  meeting: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  kanban: {
    text: "text-blue-500",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
  },
  habits: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  bug: {
    text: "text-rose-500",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
  idea: {
    text: "text-yellow-500",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
  },
  api: {
    text: "text-blue-500",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
  },
  reading: {
    text: "text-indigo-500",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
  },
  palette: {
    text: "text-pink-500",
    bg: "bg-pink-500/15",
    border: "border-pink-500/30",
  },
  coderunner: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  devtools: {
    text: "text-violet-500",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
  },
  spreadsheet: {
    text: "text-teal-500",
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
  },
  expenses: {
    text: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  whiteboard: {
    text: "text-indigo-500",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
  },
  links: {
    text: "text-sky-500",
    bg: "bg-sky-500/15",
    border: "border-sky-500/30",
  },
};

/**
 * Returns the color CSS class for a given widget type depending on whether
 * the current icon set is colorful or monochrome.
 */
export function getWidgetColorClass(
  type: string,
  isColorful: boolean,
  fallback = "text-foreground"
): string {
  if (!isColorful) return fallback;
  return WIDGET_COLORS[type]?.text || fallback;
}

/**
 * Returns badge styling classes for widget badges or containers.
 */
export function getWidgetBadgeClass(
  type: string,
  isColorful: boolean,
  fallback = "bg-muted text-foreground border-border/60"
): string {
  if (!isColorful) return fallback;
  const entry = WIDGET_COLORS[type];
  if (!entry) return fallback;
  return `${entry.bg} ${entry.text} border ${entry.border}`;
}

/**
 * Returns the colorful class if isColorful is true, otherwise the fallback monochrome class.
 */
export function colorClass(
  colorfulClass: string,
  isColorful: boolean,
  fallback = "text-foreground"
): string {
  return isColorful ? colorfulClass : fallback;
}
