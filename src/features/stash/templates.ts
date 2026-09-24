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
} from "lucide-react";
import { NoteColor } from "./types/color";
import { PaperPattern } from "./note-meta";

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
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "scratchpad",
    name: "Daily Scratchpad",
    description: "Priorities, fleeting thoughts, and daily log",
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
  },
  {
    id: "meeting",
    name: "Meeting Minutes",
    description: "Attendees, discussion agenda, and action items",
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
  },
  {
    id: "bug_report",
    name: "Bug & Issue Report",
    description: "Repro steps, expected vs actual, and fix notes",
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
  },
  {
    id: "weekly_review",
    name: "Weekly Review & Goals",
    description: "Highlights, blockers, and next week focus",
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
  },
  {
    id: "code_snippet",
    name: "Code & Tech Scratchpad",
    description: "Syntax snippet, implementation context, and edge cases",
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
    plainText: `[swap-widget]

### 📊 Watchlist & Key Levels
- **BTC:** Support $____ | Target $____
- **ETH:** Support $____ | Target $____
- **SOL:** Support $____ | Target $____

### ⚡ Trade Notes
- `,
    tagNames: ["crypto", "trading"],
  },
  {
    id: "summary",
    name: "Book & Article Summary",
    description: "Core premise, standout quotes, and actionable takeaways",
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
  },
];
