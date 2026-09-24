import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Tag,
  Calendar,
  Download,
  ArrowRight,
  Mic,
  Camera,
  BarChart3,
  Layers,
  Shield,
  Ghost,
  CheckCircle2,
  FileCode,
  Sliders,
  Clock,
  Terminal,
} from "lucide-react";
import { GITHUB_REPO, detectUserOS, DOWNLOAD_PACKAGES } from "../lib/os-detect";

interface ReleaseItem {
  version: string;
  codename: string;
  date: string;
  badge: "Latest" | "Major" | "Stable";
  badgeColor: string;
  summary: string;
  highlights: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    tag: string;
  }[];
  improvements: string[];
  fixes: string[];
}

const RELEASES: ReleaseItem[] = [
  {
    version: "v0.4.0",
    codename: "The Flow & Polish Release",
    date: "September 24, 2026",
    badge: "Latest",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    summary:
      "A massive upgrade introducing speech-to-text dictation, beautiful high-res image export, live note statistics HUD, and frosted glass shade transitions.",
    highlights: [
      {
        icon: Mic,
        title: "Voice-to-Text Speech Dictation",
        description:
          "Press the microphone in the titlebar or hotkey to speak your thoughts. Transcribes voice directly into the note editor with audio pulse animation.",
        tag: "Feature",
      },
      {
        icon: Camera,
        title: "Share as Beautiful Image Studio",
        description:
          "Export your scratchpad as a viral retina-quality graphic (2.5x scale) with 7 customizable gradient backdrops, padding, and window shadow controls.",
        tag: "Feature",
      },
      {
        icon: BarChart3,
        title: "Live Note Stats & Word / Reading HUD",
        description:
          "Real-time HUD displaying word count, estimated reading/speaking time, and checklist progress bar pinned to the bottom of the floating window.",
        tag: "Productivity",
      },
      {
        icon: Layers,
        title: "Frosted Glass Window Shade Transition",
        description:
          "Collapsing into the 36px shade now features an aesthetic hardware-accelerated blur-xl transition with scale feedback and animated 'Shaded' pill.",
        tag: "UI/UX",
      },
      {
        icon: Sliders,
        title: "Checklist 'Done to Bottom' Organizer",
        description:
          "Instantly sweep completed tasks to the bottom of your note with 1 click from the More menu or right-click context menu.",
        tag: "Feature",
      },
    ],
    improvements: [
      "Added Radix UI tooltips to all 15 titlebar and window controls",
      "Optimized window drag event throttling for 144Hz and 240Hz monitors",
      "Enhanced clipboard image rasterization with transparent alpha fallback",
      "Added keyboard shortcut hints on hover menus",
    ],
    fixes: [
      "Fixed border clipping on Windows 11 high-contrast mode",
      "Resolved cursor jump when switching between heading levels in TipTap",
      "Fixed shade double-click hitbox alignment on ultra-wide screens",
    ],
  },
  {
    version: "v0.3.0",
    codename: "Daily Scratchpad & Templates Overhaul",
    date: "September 20, 2026",
    badge: "Stable",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    summary:
      "Empowered daily planners with automatic task carryovers, vibrant template icons, persona emojis, and paper textures.",
    highlights: [
      {
        icon: Clock,
        title: "Today's Daily Scratchpad & Task Carryover",
        description:
          "Press Ctrl+Shift+D to open or create today's scratchpad. Unfinished checklist items from yesterday automatically surface with a 1-click carryover banner.",
        tag: "Workflow",
      },
      {
        icon: Sparkles,
        title: "8 Colored Template Badges & Personas",
        description:
          "Daily Scratchpad, Bug Blitz, Meeting Minutes, and Project Sprints now render with custom colored icon pills, matching paper textures, and emoji avatars.",
        tag: "Design",
      },
      {
        icon: FileCode,
        title: "Subtle Paper Patterns",
        description:
          "Choose between Ruled Lines, Engineering Grid, Bullet Journal Dots, or Minimal Plain textures rendered natively via SVG backdrops.",
        tag: "Personalization",
      },
    ],
    improvements: [
      "Added template picker in Command Palette (Ctrl+Shift+P)",
      "Decreased SQLite cold start time to under 12 milliseconds",
      "Added auto-save debounce with zero disk thrashing",
    ],
    fixes: [
      "Fixed emoji rendering inconsistencies on older Windows 10 builds",
      "Prevented accidental text selection during titlebar drag",
    ],
  },
  {
    version: "v0.2.0",
    codename: "Ghost Mode & Confidential Vaults",
    date: "September 15, 2026",
    badge: "Major",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    summary:
      "Introduced mouse-transparent Ghost Mode for referencing notes while coding, plus 4-digit PIN encrypted vaults.",
    highlights: [
      {
        icon: Ghost,
        title: "Ghost Mode (Click-Through Overlay)",
        description:
          "Toggle ghost mode to make Stash semi-transparent and completely pass mouse clicks through to your IDE, Figma, or terminal underneath.",
        tag: "Deep Work",
      },
      {
        icon: Shield,
        title: "4-Digit PIN Confidential Vault",
        description:
          "Lock sensitive API keys and personal notes behind hardware-backed AES-256 GCM encryption with auto-lock timers.",
        tag: "Security",
      },
    ],
    improvements: [
      "Added framer-motion glow animations when toggling ghost mode",
      "Introduced global Alt+Space hotkey customization",
      "Streamlined local SQLite migrations",
    ],
    fixes: [
      "Fixed window z-index layering when fullscreen applications are active",
      "Corrected PIN lockout cooldown timer persistence across restarts",
    ],
  },
  {
    version: "v0.1.0",
    codename: "Initial Desktop Release",
    date: "September 1, 2026",
    badge: "Stable",
    badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    summary:
      "The inaugural release of Stash for Windows and macOS, engineered with Tauri 2.0 Rust core and modular floating widgets.",
    highlights: [
      {
        icon: Terminal,
        title: "Tauri 2.0 Rust Core",
        description:
          "Engineered without heavy Chromium runtimes. Uses native OS webviews to deliver a desktop app that consumes under 15MB of RAM.",
        tag: "Architecture",
      },
      {
        icon: Layers,
        title: "36px Window Shade Micro-Bar",
        description:
          "Collapse any note into an unobtrusive 36px top rim bar with double-click or Ctrl+D.",
        tag: "Core",
      },
    ],
    improvements: [
      "Built-in Pomodoro countdown timer widget",
      "Offline real-time fiat and crypto exchange calculator",
      "Zero telemetry guarantee with 100% offline functionality",
    ],
    fixes: [
      "Initial multi-monitor positioning fixes on Windows 11",
    ],
  },
];

export const ChangelogPage: React.FC = () => {
  const os = detectUserOS();
  const currentPkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  return (
    <div className="relative min-h-screen bg-[#121215] text-white pt-24 pb-20 selection:bg-white/20 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-bl from-cyan-500/10 via-purple-500/10 to-emerald-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4 pt-6 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-xs text-cyan-300 font-medium"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Product Updates & Releases</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white"
          >
            Continuous evolution for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-white">flow state</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-400 leading-relaxed"
          >
            Every release of Stash brings performance optimizations, tactile design improvements, and real tools for deep work.
          </motion.p>
        </div>

        {/* Timeline Stream */}
        <div className="relative space-y-12 before:absolute before:inset-0 before:left-3 sm:before:left-6 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-cyan-500/20 before:to-transparent">
          {RELEASES.map((rel, idx) => (
            <motion.div
              key={rel.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-8 sm:pl-14"
            >
              {/* Timeline Glowing Node */}
              <div className="absolute left-1.5 sm:left-4.5 top-1.5 -translate-x-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 ring-4 ring-[#121215] shadow-lg shadow-cyan-500/50" />

              {/* Release Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 sm:p-8 shadow-2xl space-y-6 hover:border-white/15 transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                      {rel.version}
                    </h2>
                    <span className="text-sm text-zinc-400 font-medium">
                      — {rel.codename}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rel.badgeColor}`}>
                      {rel.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{rel.date}</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {rel.summary}
                </p>

                {/* Major Highlights Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                    Key Highlights
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {rel.highlights.map((h) => {
                      const Icon = h.icon;
                      return (
                        <div
                          key={h.title}
                          className="rounded-xl border border-white/[0.06] bg-[#111114] p-4 flex items-start gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-400 border border-white/5">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {h.title}
                              </span>
                              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/20">
                                {h.tag}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {h.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Improvements & Fixes Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Improvements</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                      {rel.improvements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Bug Fixes</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                      {rel.fixes.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Download CTA for Latest */}
                {rel.badge === "Latest" && (
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="text-xs text-zinc-400">
                      Available now for Windows, macOS, and Linux
                    </div>

                    <a
                      href={currentPkg.primaryInstaller.url}
                      download
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-100 shadow-md transition-all active:translate-y-0.5"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Download {rel.version}</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
