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
    description: "Priorities, fleeting thoughts, and daily log with focus timer",
    color: "Lemon",
    icon: Sun,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/15",
    emoji: "☀️",
    paper: "lines",
    title: `Scratchpad — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    plainText: `## 🎯 Top Priorities
- [ ] 
- [ ] 
- [ ] 

## 💭 Fleeting Thoughts
- 

## 📝 Daily Log
- `,
    tagNames: ["daily", "scratchpad"],
    widgets: [
      {
        id: "widget-timer-focus",
        type: "timer",
        title: "Focus Pomodoro",
        x: 0,
        y: 0,
        config: { focusDuration: 25 },
      },
    ],
  },
  {
    id: "meeting",
    name: "Meeting Minutes",
    description: "Attendees, discussion agenda, and action items with 30m countdown",
    color: "Mint",
    icon: Users,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    emoji: "🤝",
    paper: "dots",
    title: "Meeting Notes",
    plainText: `**Date:** ${new Date().toISOString().slice(0, 10)}
**Attendees:** 

### 📌 Agenda & Discussion
- 

### ⚡ Action Items
- [ ] `,
    tagNames: ["meeting", "work"],
    widgets: [
      {
        id: "widget-meeting-countdown",
        type: "countdown",
        title: "Meeting Timer (30m)",
        x: 0,
        y: 0,
        config: { minutes: 30 },
      },
    ],
  },
  {
    id: "bug_report",
    name: "Bug & Issue Report",
    description: "Repro steps, expected vs actual, and repro run counter",
    color: "Rose",
    icon: Bug,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/15",
    emoji: "🐛",
    paper: "grid",
    title: "Bug: ",
    plainText: `### 🐛 Issue Description


### 🔁 Steps to Reproduce
1. 
2. 
3. 

### 💡 Expected vs Actual
- **Expected:** 
- **Actual:** 

### 🔧 Fix Notes
- `,
    tagNames: ["bug", "dev"],
    widgets: [
      {
        id: "widget-repro-counter",
        type: "counter",
        title: "Repro Test Runs",
        x: 0,
        y: 0,
        config: { initialCount: 0 },
      },
    ],
  },
  {
    id: "weekly_review",
    name: "Weekly Review & Goals",
    description: "Highlights, blockers, and weekly habit consistency",
    color: "Lavender",
    icon: Target,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/15",
    emoji: "🎯",
    title: "Weekly Review",
    plainText: `### 🌟 Highlights & Wins
- 

### 🚧 Challenges & Blockers
- 

### 🎯 Focus for Next Week
- [ ] 
- [ ] `,
    tagNames: ["review", "planning"],
    widgets: [
      {
        id: "widget-habits-weekly",
        type: "habits",
        title: "Weekly Habit Consistency",
        x: 0,
        y: 0,
      },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm & Idea Dump",
    description: "Problem angles, bold ideas, pros/cons, and next moves",
    color: "Lemon",
    icon: Lightbulb,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/15",
    emoji: "💡",
    title: "Idea: ",
    plainText: `### 💡 Core Concept & Problem
- 

### 🚀 Creative Angles
1. 
2. 
3. 

### ⚖️ Trade-offs & Risks
- **Pros:** 
- **Cons:** 

### 🏁 Immediate Next Action
- [ ] `,
    tagNames: ["ideas", "brainstorm"],
    widgets: [
      {
        id: "widget-palette-ideas",
        type: "palette",
        title: "Idea Color Theme",
        x: 0,
        y: 0,
      },
    ],
  },
  {
    id: "sprint_kanban",
    name: "Project Sprint Kanban",
    description: "Interactive visual board with To Do, In Flight, and Done columns",
    color: "Sky",
    icon: Kanban,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/15",
    emoji: "📋",
    paper: "grid",
    title: "Sprint Board",
    plainText: `## 🚀 Sprint Goal
Deliver component-driven templates and interactive widgets for v0.4 release.

### 📌 Milestone Notes
- Focus on zero context switching
- Real-time updates across floating windows`,
    tagNames: ["sprint", "kanban", "dev"],
    widgets: [
      {
        id: "widget-sprint-kanban",
        type: "kanban",
        title: "Sprint Tasks",
        x: 0,
        y: 0,
      },
    ],
  },
  {
    id: "code_snippet",
    name: "Code & Tech Scratchpad",
    description: "Syntax snippet, implementation context, and bitwise calculator",
    color: "Sky",
    icon: Code2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/15",
    emoji: "💻",
    paper: "dots",
    title: "Snippet: ",
    plainText: `### 💻 Implementation Context
- **Language / Framework:** TypeScript
- **Goal:** 

\`\`\`typescript
// Code snippet here
\`\`\`

### 🧪 Test Edge Cases
- [ ] Empty / Null input
- [ ] Boundary condition
- [ ] Error handling`,
    tagNames: ["code", "dev"],
    widgets: [
      {
        id: "widget-code-calc",
        type: "calculator",
        title: "Math & Bitwise Calc",
        x: 0,
        y: 0,
      },
    ],
  },
  {
    id: "crypto_watchlist",
    name: "Crypto & Market Watchlist",
    description: "Live conversion rates, price levels, and trade plan",
    color: "Sky",
    icon: TrendingUp,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/15",
    emoji: "📈",
    title: "Crypto Watchlist",
    plainText: `### 📊 Watchlist & Key Levels
- **BTC:** Support $____ | Target $____
- **ETH:** Support $____ | Target $____
- **SOL:** Support $____ | Target $____

### ⚡ Trade Notes
- `,
    tagNames: ["crypto", "trading"],
    widgets: [
      {
        id: "widget-crypto-swap",
        type: "swap",
        title: "Live Currency Converter",
        x: 0,
        y: 0,
      },
    ],
  },
  {
    id: "summary",
    name: "Book & Article Summary",
    description: "Core premise, standout quotes, and countdown focus session",
    color: "Sand",
    icon: BookOpen,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/15",
    emoji: "📖",
    paper: "lines",
    title: "Summary: ",
    plainText: `### 📚 Title & Author
- **Source:** 
- **Topic:** 

### 🔑 Big Ideas & Core Premise
- 

### 💬 Standout Quotes
> " "

### 🛠️ Actionable Takeaways
- [ ] `,
    tagNames: ["reading", "notes"],
    widgets: [
      {
        id: "widget-reading-timer",
        type: "timer",
        title: "Reading Deep Session",
        x: 0,
        y: 0,
        config: { focusDuration: 30 },
      },
    ],
  },
];
