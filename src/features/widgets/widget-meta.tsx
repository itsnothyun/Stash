import React from "react";
import {
  ArrowsDownUp as ArrowUpDown,
  TrendUp as TrendingUp,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  CalendarBlank as CalendarClock,
  Kanban,
  Sparkle as Sparkles,
  Palette,
  Sun,
  Users,
  Bug,
  Lightbulb,
  CodeBlock as Code2,
  BookOpen,
  LinkSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { WidgetType } from "./types";

export const DEFAULT_WIDTHS: Record<WidgetType, number | string> = {
  swap: 320,
  ticker: 280,
  calculator: 250,
  timer: 260,
  worldclock: 270,
  unitconverter: 280,
  counter: 250,
  countdown: 280,
  kanban: 450,
  habits: 320,
  palette: 280,
  browser: 480,
  scratchpad: "100%",
  meeting: "100%",
  bug: "100%",
  idea: "100%",
  api: "100%",
  reading: "100%",
  coderunner: 380,
  devtools: 380,
  spreadsheet: 440,
  expenses: 340,
  whiteboard: 360,
  links: "100%",
};

export const SIZE_PRESETS = [
  { label: "Compact", value: 260 },
  { label: "Standard", value: 320 },
  { label: "Wide", value: 440 },
  { label: "Full Width", value: "100%" },
] as const;

export const DEFAULT_WIDGET_TITLES: Record<WidgetType, string> = {
  swap: "Currency Converter",
  ticker: "Market Tickers",
  calculator: "Quick Calculator",
  timer: "Focus & Pomodoro Timer",
  worldclock: "World Clocks",
  unitconverter: "Unit Converter",
  counter: "Tally & Goal Counter",
  countdown: "Countdown Timer",
  kanban: "Kanban Board",
  habits: "7-Day Habit Tracker",
  palette: "Color Palette",
  browser: "Web Browser (PiP)",
  scratchpad: "Daily Scratchpad",
  meeting: "Meeting Minutes",
  bug: "Bug Blitz & Triage",
  idea: "Idea Incubator",
  api: "API & Tech Blueprint",
  reading: "Book & Article Digest",
  coderunner: "Code Runner & Sandbox",
  devtools: "Developer Utilities",
  spreadsheet: "Reactive Mini Spreadsheet",
  expenses: "Expense & Budget Log",
  whiteboard: "Freehand Sketch & Canvas",
  links: "Link Collection",
};

export function getWidgetIcon(type: WidgetType, isColorful: boolean): React.ReactNode {
  const c = (color: string) => cn("h-3.5 w-3.5", isColorful ? color : "text-foreground");
  switch (type) {
    case "swap":
      return <ArrowUpDown className={c("text-emerald-500")} />;
    case "ticker":
      return <TrendingUp className={c("text-blue-500")} />;
    case "calculator":
      return <CalcIcon className={c("text-amber-500")} />;
    case "timer":
      return <TimerIcon className={c("text-rose-500")} />;
    case "worldclock":
      return <Globe className={c("text-cyan-500")} />;
    case "unitconverter":
      return <Ruler className={c("text-indigo-500")} />;
    case "counter":
      return <Target className={c("text-purple-500")} />;
    case "countdown":
      return <CalendarClock className={c("text-orange-500")} />;
    case "kanban":
      return <Kanban className={c("text-blue-500")} />;
    case "habits":
      return <Sparkles className={c("text-emerald-500")} />;
    case "palette":
      return <Palette className={c("text-pink-500")} />;
    case "browser":
      return <Globe className={c("text-cyan-500")} />;
    case "scratchpad":
      return <Sun className={c("text-amber-500")} />;
    case "meeting":
      return <Users className={c("text-emerald-500")} />;
    case "bug":
      return <Bug className={c("text-rose-500")} />;
    case "idea":
      return <Lightbulb className={c("text-yellow-500")} />;
    case "api":
      return <Code2 className={c("text-blue-500")} />;
    case "reading":
      return <BookOpen className={c("text-indigo-500")} />;
    case "coderunner":
      return <Code2 className={c("text-emerald-500")} />;
    case "devtools":
      return <Code2 className={c("text-violet-500")} />;
    case "spreadsheet":
      return <Kanban className={c("text-teal-500")} />;
    case "expenses":
      return <ArrowUpDown className={c("text-amber-500")} />;
    case "whiteboard":
      return <Palette className={c("text-indigo-500")} />;
    case "links":
      return <LinkSimple className={c("text-sky-500")} />;
    default:
      return null;
  }
}
