import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Users,
  Bug,
  Target,
  TrendingUp,
  Code2,
  Lightbulb,
  BookOpen,
  Copy,
  Check,
  Search,
  FileText,
  Sparkles,
  ArrowRight,
  Download,
  Terminal,
} from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem } from "../lib/os-detect";

interface TemplateItem {
  id: string;
  name: string;
  category: "productivity" | "engineering" | "meetings" | "reflection";
  description: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  paper: "lines" | "dots" | "grid" | "plain";
  tags: string[];
  markdown: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "scratchpad",
    name: "Daily Scratchpad",
    category: "productivity",
    description: "Priorities, fleeting thoughts, and rolling daily log with unfinished task carryover.",
    emoji: "☀️",
    icon: Sun,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    paper: "lines",
    tags: ["daily", "focus", "carryover"],
    markdown: `## 🎯 Top Priorities
- [ ] Deep work session (90 min)
- [ ] Review pending pull requests
- [ ] Team sprint check-in

## 💭 Fleeting Thoughts
- Explore GPU acceleration for blur effect
- Check Tauri v2.2 window shadow API

## 📝 Daily Log
- 09:30 AM — Opened new stash note for sprint plan
- 11:15 AM — Merged image export studio
- 02:45 PM — Optimized local SQLite query latency`,
  },
  {
    id: "bug_report",
    name: "Bug Blitz & Issue Report",
    category: "engineering",
    description: "Repro steps, environment matrix, expected vs actual behavior, and fix notes.",
    emoji: "🐛",
    icon: Bug,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
    paper: "grid",
    tags: ["dev", "debugging", "qa"],
    markdown: `### 🐛 Issue Description
Window shade rollup animation stutters when dragging on high-DPI displays.

### 🔁 Steps to Reproduce
1. Open Stash on a 4K display (200% scale)
2. Press Ctrl+D or double click outer header to collapse shade
3. Observe micro-stutter before blur transition settles

### 💡 Expected vs Actual
- **Expected:** Seamless 300ms cubic-bezier transition to 36px bar
- **Actual:** 1-frame drop during scale-[0.98] blur handoff

### 🔧 Fix Notes
- Enable hardware acceleration on background backdrop filter
- Set will-change: transform on floating container`,
  },
  {
    id: "meeting",
    name: "Meeting Minutes & 1-on-1 Sync",
    category: "meetings",
    description: "Agenda, discussion points, decisions made, and assigned action items.",
    emoji: "🤝",
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    paper: "dots",
    tags: ["meetings", "team", "sync"],
    markdown: `**Date:** 2026-09-24  
**Attendees:** Alex, Sarah, David

### 📌 Agenda & Discussion
- Review v0.4 release timeline & desktop installers
- Discuss local-first SQLite schema migrations
- Finalize retina export gradient color palettes

### ⚡ Action Items
- [ ] Sarah: Publish macOS Universal DMG build
- [ ] David: Benchmark speech recognition latency
- [ ] Alex: Update developer documentation and release notes`,
  },
  {
    id: "project_plan",
    name: "Project Sprint & Milestones",
    category: "engineering",
    description: "Sprint objective, backlog tasks, in-flight deliverables, and blockers.",
    emoji: "🎯",
    icon: Target,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    paper: "grid",
    tags: ["sprint", "roadmap", "tasks"],
    markdown: `## 🚀 Sprint Goal
Deliver high-fidelity note export studio and speech dictation before v0.4 release.

### 📋 In-Flight Deliverables
- [x] Radix UI tooltips across all 15 header controls
- [x] Frosted glass window shade transition blur
- [ ] Audio waveform pulse animation during dictation

### ⚠️ Potential Blockers
- Windows SpeechRecognition permissions in enterprise environments
- Clipboard write permissions for 2.5x retina canvas blob`,
  },
  {
    id: "idea_dump",
    name: "Idea Incubator & Hypothesis",
    category: "productivity",
    description: "Problem statement, 10x solution thesis, quick test experiments, and next steps.",
    emoji: "💡",
    icon: Lightbulb,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
    paper: "plain",
    tags: ["brainstorm", "creativity", "strategy"],
    markdown: `### 💡 Core Idea
Add a HUD widget that estimates reading time and checklist completion in real time.

### ❓ Problem Statement
Users writing long scratchpads don't know their task progress or note length without opening full editors.

### 🧪 24-Hour Experiment
- Mount a lightweight HUD bar above the status footer
- Compute word count and reading speed (200 wpm)
- Count checked vs total Markdown checkboxes in TipTap AST`,
  },
  {
    id: "code_snippet",
    name: "API Spec & Architecture Blueprint",
    category: "engineering",
    description: "Endpoint contract, IPC channel signatures, request payloads, and security requirements.",
    emoji: "⚡",
    icon: Code2,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    paper: "grid",
    tags: ["rust", "tauri", "api"],
    markdown: `### 📡 IPC Command Signature
\`\`\`rust
#[tauri::command]
pub fn export_note_image(
  window: tauri::WebviewWindow,
  note_id: String,
  pixel_ratio: f32,
) -> Result<String, String> {
  // Dispatches 2.5x retina rasterization
}
\`\`\`

### 🔒 Security Protocol
- Vault payload encrypted using AES-256 GCM
- Key derived using Argon2id (memory: 64MB, iterations: 3)
- Zero external network transmission guaranteed`,
  },
  {
    id: "weekly_review",
    name: "Weekly Reflection & Retrospective",
    category: "reflection",
    description: "Wins, learnings, friction points, gratitude, and primary focus for the coming week.",
    emoji: "📈",
    icon: TrendingUp,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
    paper: "lines",
    tags: ["reflection", "habits", "weekly"],
    markdown: `## 🏆 Highlights & Wins
- Completed full Tauri 2.0 Rust backend integration
- Shipped 8 custom template personas and paper textures
- Zero memory leaks detected across 24h background stress test

## 🔍 Friction Points & Learnings
- Framer motion layout transitions need explicit width constraints
- Windows borderless windows require custom titlebar drag regions

## 🎯 Next Week's Single Focus
Launch official release page and developer documentation portal.`,
  },
  {
    id: "reading_notes",
    name: "Book & Literature Digest",
    category: "reflection",
    description: "Book title, key thesis, mental models, memorable quotes, and practical application.",
    emoji: "📖",
    icon: BookOpen,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-400/10",
    borderColor: "border-pink-400/20",
    paper: "dots",
    tags: ["books", "learning", "quotes"],
    markdown: `**Title:** Deep Work  
**Author:** Cal Newport  
**Rating:** 5/5 ⭐

### 🧠 Core Thesis
The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.

### 💡 Top Mental Models
1. **The Law of Focused Success:** High Quality Work Produced = (Time Spent) x (Intensity of Focus)
2. **The 4 Disciplines of Execution:** Focus on the wildly important, act on lead measures, keep a compelling scoreboard.

### 🛠️ Practical Action
Schedule 2 non-negotiable 90-minute Stash focus blocks every workday with Ghost Mode active.`,
  },
];

export const TemplatesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Record<string, "preview" | "raw">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "productivity", label: "Productivity" },
    { id: "engineering", label: "Engineering" },
    { id: "meetings", label: "Meetings & Syncs" },
    { id: "reflection", label: "Reflection & Learning" },
  ];

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory =
      selectedCategory === "all" || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#121215] text-white pt-24 pb-20 selection:bg-white/20 selection:text-white">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-amber-500/10 via-purple-500/10 to-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs text-amber-300 font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built-in Note Templates</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white"
          >
            Structured notes engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">instant flow</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-400 leading-relaxed"
          >
            Pre-configured templates with custom color palettes, emoji personas, and subtle paper patterns. Ready to copy into Stash or use instantly via <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-zinc-200">Ctrl + Shift + T</kbd>.
          </motion.p>
        </div>

        {/* Controls: Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-white text-black shadow-lg shadow-white/10"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="h-8 w-full rounded-full border border-white/[0.08] bg-[#161619] pl-8 pr-4 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/40"
            />
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((tpl) => {
              const Icon = tpl.icon;
              const view = activeTab[tpl.id] || "preview";

              return (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl border ${tpl.borderColor} bg-gradient-to-b from-[#18181d] to-[#141417] p-5 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all`}
                >
                  <div>
                    {/* Top Row: Icon, Title, Paper Pattern Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tpl.iconBg} ${tpl.iconColor} border border-white/5 shadow-inner`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-base tracking-tight">
                              {tpl.name}
                            </h3>
                            <span className="text-base select-none">{tpl.emoji}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400 capitalize">
                        {tpl.paper} paper
                      </span>
                    </div>

                    {/* Tag Pills */}
                    <div className="flex items-center gap-1.5 mb-4">
                      {tpl.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/[0.04]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Preview Box with Tab Switcher */}
                    <div className="rounded-xl border border-white/[0.06] bg-[#0f0f12] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#141418]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab((prev) => ({ ...prev, [tpl.id]: "preview" }))
                            }
                            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              view === "preview"
                                ? "bg-white/10 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab((prev) => ({ ...prev, [tpl.id]: "raw" }))
                            }
                            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              view === "raw"
                                ? "bg-white/10 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            Markdown
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-zinc-600">
                          {tpl.markdown.split("\n").length} lines
                        </span>
                      </div>

                      {/* Content Area */}
                      <div className="p-3.5 max-h-48 overflow-y-auto text-xs leading-relaxed font-mono scrollbar-thin">
                        {view === "raw" ? (
                          <pre className="text-zinc-400 whitespace-pre-wrap selection:bg-amber-500/20">
                            {tpl.markdown}
                          </pre>
                        ) : (
                          <div className="space-y-1.5 text-zinc-300">
                            {tpl.markdown.split("\n").map((line, idx) => {
                              if (line.startsWith("## ")) {
                                return (
                                  <div key={idx} className="font-semibold text-white pt-1">
                                    {line.replace("## ", "")}
                                  </div>
                                );
                              }
                              if (line.startsWith("### ")) {
                                return (
                                  <div key={idx} className="font-medium text-amber-200/90 pt-0.5">
                                    {line.replace("### ", "")}
                                  </div>
                                );
                              }
                              if (line.startsWith("- [ ] ")) {
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-zinc-400 pl-1">
                                    <div className="h-3 w-3 rounded border border-white/20" />
                                    <span>{line.replace("- [ ] ", "")}</span>
                                  </div>
                                );
                              }
                              if (line.startsWith("- [x] ")) {
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-zinc-500 line-through pl-1">
                                    <div className="h-3 w-3 rounded bg-emerald-500/40 border border-emerald-500" />
                                    <span>{line.replace("- [x] ", "")}</span>
                                  </div>
                                );
                              }
                              return (
                                <p key={idx} className="text-zinc-400">
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Footer: 1-Click Copy */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      Press <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px] text-zinc-300">Ctrl+Shift+T</kbd> in Stash
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(tpl.id, tpl.markdown)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        copiedId === tpl.id
                          ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                          : "bg-white/[0.08] text-zinc-200 hover:bg-white hover:text-black shadow-sm"
                      }`}
                    >
                      {copiedId === tpl.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-black" />
                          <span>Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
