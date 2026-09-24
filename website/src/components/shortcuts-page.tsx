import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Keyboard,
  Search,
  Command,
  Monitor,
  Apple,
  Sparkles,
  Zap,
  Layers,
  Shield,
  FileText,
  Clock,
  Camera,
  Mic,
} from "lucide-react";

interface ShortcutGroup {
  id: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: {
    action: string;
    description: string;
    win: string[];
    mac: string[];
    highlight?: boolean;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "global",
    category: "Summon & Window Management",
    icon: Zap,
    description: "Global hotkeys available everywhere across your system, even when Stash is unfocused.",
    items: [
      {
        action: "Summon / Toggle Stash",
        description: "Brings the floating scratchpad to the foreground or conceals it instantly.",
        win: ["Alt", "Space"],
        mac: ["⌥", "Space"],
        highlight: true,
      },
      {
        action: "Today's Daily Scratchpad",
        description: "Opens today's dated note, automatically carrying over unfinished tasks.",
        win: ["Ctrl", "Shift", "D"],
        mac: ["⌘", "Shift", "D"],
        highlight: true,
      },
      {
        action: "New Quick Stash Note",
        description: "Creates an empty scratchpad with timestamped title and focused editor.",
        win: ["Ctrl", "N"],
        mac: ["⌘", "N"],
      },
      {
        action: "Command Palette",
        description: "Access templates, widgets, note switching, and system commands.",
        win: ["Ctrl", "Shift", "P"],
        mac: ["⌘", "Shift", "P"],
        highlight: true,
      },
      {
        action: "Toggle Always-On-Top",
        description: "Pins the note above all games, browsers, and full-screen editors.",
        win: ["Ctrl", "P"],
        mac: ["⌘", "P"],
      },
    ],
  },
  {
    id: "shade",
    category: "Window Shade & Docking",
    icon: Layers,
    description: "Compact 36px micro-bar rollup triggers for ultra-clean screen real estate.",
    items: [
      {
        action: "Toggle 36px Window Shade",
        description: "Rolls up the active note into an aesthetic frosted-glass micro rim bar.",
        win: ["Ctrl", "D"],
        mac: ["⌘", "D"],
        highlight: true,
      },
      {
        action: "Double-Click Header Bar",
        description: "Mouse shortcut anywhere on the top titlebar to roll or unroll shade.",
        win: ["Double", "Click"],
        mac: ["Double", "Click"],
      },
      {
        action: "Toggle Ghost Mode",
        description: "Enables click-through mouse transparency with ambient glow.",
        win: ["Ctrl", "G"],
        mac: ["⌘", "G"],
        highlight: true,
      },
      {
        action: "Snap to Monitor Edge",
        description: "Snaps the floating window flush against your screen rim.",
        win: ["Alt", "Arrow Keys"],
        mac: ["⌥", "Arrow Keys"],
      },
    ],
  },
  {
    id: "editor",
    category: "Markdown & Checklist Actions",
    icon: FileText,
    description: "Rich text formatting, task organization, and dictation hotkeys.",
    items: [
      {
        action: "Voice Dictation",
        description: "Transcribes spoken thoughts directly into the editor with real-time audio wave.",
        win: ["Ctrl", "Shift", "V"],
        mac: ["⌘", "Shift", "V"],
        highlight: true,
      },
      {
        action: "Insert Checklist Item",
        description: "Adds an interactive checkbox at the current cursor position.",
        win: ["Ctrl", "Shift", "7"],
        mac: ["⌘", "Shift", "7"],
      },
      {
        action: "Sort Done to Bottom",
        description: "Sweeps all completed checkboxes to the end of the note instantly.",
        win: ["Ctrl", "Shift", "S"],
        mac: ["⌘", "Shift", "S"],
      },
      {
        action: "Bold / Italic / Strike",
        description: "Standard inline typography formatting.",
        win: ["Ctrl", "B", "/", "I"],
        mac: ["⌘", "B", "/", "I"],
      },
      {
        action: "Insert Code Block",
        description: "Inserts a syntax-highlighted code container.",
        win: ["```", "Space"],
        mac: ["```", "Space"],
      },
      {
        action: "Template Selector",
        description: "Opens template menu with 8 color-coded presets and paper patterns.",
        win: ["Ctrl", "Shift", "T"],
        mac: ["⌘", "Shift", "T"],
      },
    ],
  },
  {
    id: "widgets",
    category: "Widgets & Live Utilities",
    icon: Clock,
    description: "Attach modular countdown timers, currency converters, and export studios.",
    items: [
      {
        action: "Attach Pomodoro Timer",
        description: "Embeds an interactive 25/5 focus countdown widget into the note.",
        win: ["Ctrl", "T"],
        mac: ["⌘", "T"],
      },
      {
        action: "Attach Currency Converter",
        description: "Live real-time fiat and crypto exchange calculator.",
        win: ["Ctrl", "K"],
        mac: ["⌘", "K"],
      },
      {
        action: "Share as Beautiful Image",
        description: "Opens the 2.5x retina export studio modal with custom backdrops.",
        win: ["Ctrl", "E"],
        mac: ["⌘", "E"],
        highlight: true,
      },
      {
        action: "Toggle Note Stats HUD",
        description: "Displays word count, reading time, and task completion percentage.",
        win: ["Ctrl", "H"],
        mac: ["⌘", "H"],
      },
    ],
  },
  {
    id: "vault",
    category: "Confidential Vault & Security",
    icon: Shield,
    description: "AES-256 GCM cryptographic locking and privacy controls.",
    items: [
      {
        action: "Lock Confidential Vault",
        description: "Instantly locks the current note behind 4-digit PIN verification.",
        win: ["Ctrl", "L"],
        mac: ["⌘", "L"],
        highlight: true,
      },
      {
        action: "Hide Note Content Preview",
        description: "Blurs confidential note text from peripheral vision or screen shares.",
        win: ["Ctrl", "Shift", "H"],
        mac: ["⌘", "Shift", "H"],
      },
      {
        action: "Clear Active Clipboard Cache",
        description: "Purges temporary memory of exported images and copied notes.",
        win: ["Ctrl", "Shift", "X"],
        mac: ["⌘", "Shift", "X"],
      },
    ],
  },
];

export const ShortcutsPage: React.FC = () => {
  const [platform, setPlatform] = useState<"win" | "mac">("win");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = SHORTCUT_GROUPS.map((group) => {
    const items = group.items.filter(
      (item) =>
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.win.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.mac.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="relative min-h-screen bg-[#121215] text-white pt-24 pb-20 selection:bg-white/20 selection:text-white">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-purple-500/10 via-cyan-500/10 to-amber-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4 pt-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs text-purple-300 font-medium"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Productivity Hotkey Reference</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white"
          >
            Fly through deep work with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-cyan-300 to-white">tactile hotkeys</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-400 leading-relaxed"
          >
            Stash is engineered for uninterrupted flow. Master these global shortcuts to capture ideas without lifting your hands from the keyboard.
          </motion.p>
        </div>

        {/* Controls: OS Platform Switcher & Live Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          {/* OS Switcher */}
          <div className="flex items-center rounded-full border border-white/[0.08] bg-[#161619] p-1">
            <button
              type="button"
              onClick={() => setPlatform("win")}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                platform === "win"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Windows & Linux</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("mac")}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                platform === "mac"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Apple className="h-3.5 w-3.5" />
              <span>macOS</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action or keys..."
              className="h-9 w-full rounded-full border border-white/[0.08] bg-[#161619] pl-9 pr-4 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400/40"
            />
          </div>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            const Icon = group.icon;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.08] bg-[#161619] overflow-hidden shadow-xl"
              >
                {/* Group Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] bg-[#131316]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-purple-400 border border-white/5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-sm">
                      {group.category}
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      {group.description}
                    </p>
                  </div>
                </div>

                {/* Shortcuts Table */}
                <div className="divide-y divide-white/[0.04]">
                  {group.items.map((item) => {
                    const keys = platform === "win" ? item.win : item.mac;

                    return (
                      <div
                        key={item.action}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-xs">
                              {item.action}
                            </span>
                            {item.highlight && (
                              <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-purple-400 border border-purple-500/20">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {item.description}
                          </p>
                        </div>

                        {/* Tactile Keycaps */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {keys.map((k, i) => (
                            <React.Fragment key={i}>
                              <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-semibold text-zinc-200 bg-[#222228] border border-white/15 border-b-[3px] border-b-black/60 rounded-md shadow-sm select-none">
                                {k}
                              </kbd>
                              {i < keys.length - 1 && k !== "/" && (
                                <span className="text-zinc-600 text-xs font-mono">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
