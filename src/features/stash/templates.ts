import { NoteColor } from "./types/color";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  color: NoteColor;
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
    name: "Bug Report",
    description: "Issue description, steps to reproduce, and fix notes",
    color: "Rose",
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
    name: "Weekly Review",
    description: "Highlights, challenges, and goals for next week",
    color: "Lavender",
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
    id: "crypto_watchlist",
    name: "Crypto Watchlist",
    description: "Watchlist with targets and key resistance/support",
    color: "Sky",
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
];
