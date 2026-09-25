import { NoteColor } from "@/features/stash/types/color";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: "work" | "personal" | "dev" | "study";
  icon: string;
  defaultColor: NoteColor;
  defaultTitle: string;
  tags: string[];
  markdownContent: string;
  isCustom?: boolean;
}

export const STARTER_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting-notes",
    name: "Meeting Notes & Action Items",
    description: "Capture attendees, discussion talking points, and actionable checklist items.",
    category: "work",
    icon: "📋",
    defaultColor: "Sky",
    defaultTitle: "Meeting Notes: ",
    tags: ["meeting", "work"],
    markdownContent: `## 👥 Attendees
- [ ] Organizer: 
- [ ] Attendees: 

## 🎯 Objective & Agenda
1. Review sprint deliverables
2. Address roadblocks and dependencies
3. Align on milestones

## 📝 Discussion Points & Notes
- Key takeaway from discussion...
- Notes on architecture decision...

## ✅ Action Items
- [ ] Schedule follow-up sync @assignee
- [ ] Share meeting recording and slides
- [ ] Update project specification document`,
  },
  {
    id: "daily-standup",
    name: "Daily Standup & Sync",
    description: "Quick 3-column update: Yesterday's wins, Today's goals, and Blockers.",
    category: "work",
    icon: "☀️",
    defaultColor: "Lemon",
    defaultTitle: "Daily Standup - ",
    tags: ["standup", "daily"],
    markdownContent: `### ⏪ What I Accomplished Yesterday
- Completed pull request review for authentication flow
- Fixed memory leak in webview window manager

### 🎯 What I Am Tackling Today
- [ ] Finalize responsive layout for settings modal
- [ ] Write integration test suite for SQLite exports
- [ ] Check in with design team on color palette tokens

### 🚧 Blockers & Needs
- None currently (all systems green)`,
  },
  {
    id: "bug-investigation",
    name: "Bug Investigation & Fix",
    description: "Systematic debugging template with repro steps, root cause, and verification.",
    category: "dev",
    icon: "🐛",
    defaultColor: "Rose",
    defaultTitle: "Bug: ",
    tags: ["bug", "investigation"],
    markdownContent: `### 🔍 Symptom & Expected Behavior
**Observed:** 
**Expected:** 

### 🔁 Reproduction Steps
1. Open library view
2. Trigger keyboard shortcut
3. Observe unexpected window behavior

### 🧠 Root Cause Analysis
- **Culprit Component:** 
- **Underlying Reason:** 

### 🛠️ Proposed Solution
- [ ] Patch component lifecycle handler
- [ ] Verify multi-window sync channel
- [ ] Add unit test regression coverage`,
  },
  {
    id: "weekly-review",
    name: "Weekly Review & Retrospective",
    description: "Reflect on week's wins, learnings, metrics, and plan top 3 priorities.",
    category: "personal",
    icon: "🌱",
    defaultColor: "Sage",
    defaultTitle: "Weekly Review: Week ",
    tags: ["review", "planning"],
    markdownContent: `## 🏆 Highlights & Wins
- What gave you energy this week?
- Big milestones reached:

## 💡 What Could Be Improved
- Friction points encountered:
- Habit adjustments for next week:

## 🎯 Top 3 Priorities for Next Week
1. [ ] Ship v1.2 release to users
2. [ ] Refactor note indexing pipeline
3. [ ] Prepare quarterly goals presentation`,
  },
  {
    id: "project-spec",
    name: "Project RFC & Technical Spec",
    description: "Structured design doc covering problem context, design, and rollout.",
    category: "dev",
    icon: "📐",
    defaultColor: "Lavender",
    defaultTitle: "RFC: ",
    tags: ["rfc", "architecture"],
    markdownContent: `# RFC: [Project Feature Name]

## 1. Context & Problem
Why are we building this? What user problem does it solve?

## 2. Proposed Architecture
- Frontend data models and state management
- Tauri IPC commands and SQLite schema migrations
- Edge cases and failure recovery strategies

## 3. Alternatives Considered
- Option A: 
- Option B: 

## 4. Rollout & Validation Plan
- [ ] Prototype spike validation
- [ ] Alpha release testing
- [ ] Production rollout`,
  },
  {
    id: "cornell-notes",
    name: "Cornell Note-Taking System",
    description: "Classic two-column learning layout with keywords, detailed notes, and summary.",
    category: "study",
    icon: "🎓",
    defaultColor: "Sand",
    defaultTitle: "Lecture Notes: ",
    tags: ["study", "learning"],
    markdownContent: `## 🔑 Cue Questions & Keywords
- *Core Concept:* 
- *Key Term:* 

## 📓 Detailed Notes & Insights
- Main lecture takeaways:
- Diagram or formula notes:
- Concrete examples and analogies:

---
## 💡 Summary (2-3 Sentences)
*In summary, this topic demonstrates that...*`,
  },
];

const CUSTOM_TEMPLATES_KEY = "stash_custom_templates";

export function getCustomTemplates(): NoteTemplate[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NoteTemplate[];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: Omit<NoteTemplate, "id" | "isCustom">): NoteTemplate {
  const customTemplates = getCustomTemplates();
  const newTemplate: NoteTemplate = {
    ...template,
    id: `custom_${Date.now()}`,
    isCustom: true,
  };
  const updated = [newTemplate, ...customTemplates];
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
  }
  return newTemplate;
}

export function deleteCustomTemplate(id: string) {
  const customTemplates = getCustomTemplates();
  const updated = customTemplates.filter((t) => t.id !== id);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
  }
}

export function getAllTemplates(): NoteTemplate[] {
  return [...STARTER_TEMPLATES, ...getCustomTemplates()];
}
