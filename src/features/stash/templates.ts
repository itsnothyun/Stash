import {
  Sun,
  Users,
  Bug,
  Target,
  TrendingUp,
  Code2,
  Lightbulb,
  BookOpen,
  LucideIcon,
  Kanban,
} from "lucide-react";
import { NoteColor } from "./types/color";
import { PaperPattern } from "./note-meta";
import { NoteWidgetData } from "@/features/widgets/types";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  color: NoteColor;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  emoji?: string;
  paper?: PaperPattern;
  title: string;
  plainText: string;
  tagNames?: string[];
  widgets?: NoteWidgetData[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "scratchpad",
    name: "Daily Scratchpad",
    description: "Focus timer, streak badge, priorities checklist & fleeting thoughts",
    color: "Lemon",
    icon: Sun,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/15",
    emoji: "☀️",
    paper: "lines",
    title: `Scratchpad — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    plainText: "",
    tagNames: ["daily", "scratchpad"],
    widgets: [
      {
        id: "widget-scratchpad-main",
        type: "scratchpad",
        title: "Daily Scratchpad",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "meeting",
    name: "Meeting Minutes",
    description: "Agenda countdown, attendee presence tags & action items",
    color: "Mint",
    icon: Users,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    emoji: "🤝",
    paper: "dots",
    title: "Meeting Notes",
    plainText: "",
    tagNames: ["meeting", "work"],
    widgets: [
      {
        id: "widget-meeting-main",
        type: "meeting",
        title: "Meeting Minutes",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "bug_report",
    name: "Bug & Issue Report",
    description: "P0/P1/P2 severity buttons, status toggle, repro steps & counter",
    color: "Rose",
    icon: Bug,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/15",
    emoji: "🐛",
    paper: "grid",
    title: "Bug: ",
    plainText: "",
    tagNames: ["bug", "dev"],
    widgets: [
      {
        id: "widget-bug-main",
        type: "bug",
        title: "Bug Blitz & Triage",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "weekly_review",
    name: "Weekly Review & Goals",
    description: "7-day habit consistency tracker, weekly highlights & goals",
    color: "Lavender",
    icon: Target,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/15",
    emoji: "🎯",
    title: "Weekly Review",
    plainText: "",
    tagNames: ["review", "planning"],
    widgets: [
      {
        id: "widget-habits-weekly",
        type: "habits",
        title: "Weekly Habit Consistency",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm & Idea Dump",
    description: "Hypothesis confidence slider, validation tally & theme swatches",
    color: "Lemon",
    icon: Lightbulb,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/15",
    emoji: "💡",
    title: "Idea: ",
    plainText: "",
    tagNames: ["ideas", "brainstorm"],
    widgets: [
      {
        id: "widget-idea-main",
        type: "idea",
        title: "Idea Incubator",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "sprint_kanban",
    name: "Project Sprint Kanban",
    description: "Visual 3-column Kanban board with cards & stage progression",
    color: "Sky",
    icon: Kanban,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/15",
    emoji: "📋",
    paper: "grid",
    title: "Sprint Board",
    plainText: "",
    tagNames: ["sprint", "kanban", "dev"],
    widgets: [
      {
        id: "widget-sprint-kanban",
        type: "kanban",
        title: "Sprint Tasks",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "code_snippet",
    name: "Code & Tech Scratchpad",
    description: "API method pill, copyable endpoint, payload schema & converter",
    color: "Sky",
    icon: Code2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/15",
    emoji: "💻",
    paper: "dots",
    title: "Snippet: ",
    plainText: "",
    tagNames: ["code", "dev"],
    widgets: [
      {
        id: "widget-api-main",
        type: "api",
        title: "API & Code Blueprint",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "crypto_watchlist",
    name: "Crypto & Market Watchlist",
    description: "Live token exchange rates, price levels, and trade plan",
    color: "Sky",
    icon: TrendingUp,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/15",
    emoji: "📈",
    title: "Crypto Watchlist",
    plainText: "",
    tagNames: ["crypto", "trading"],
    widgets: [
      {
        id: "widget-crypto-swap",
        type: "swap",
        title: "Live Currency Converter",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
  {
    id: "summary",
    name: "Book & Article Summary",
    description: "5-star rating, reading progress slider, quote callout & takeaways",
    color: "Sand",
    icon: BookOpen,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/15",
    emoji: "📖",
    paper: "lines",
    title: "Summary: ",
    plainText: "",
    tagNames: ["reading", "notes"],
    widgets: [
      {
        id: "widget-reading-main",
        type: "reading",
        title: "Book & Article Digest",
        x: 0,
        y: 0,
        width: "100%",
      },
    ],
  },
];
