import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Zap,
  Lock,
  ArrowUpDown,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Download,
  Github,
} from "lucide-react";
import { BounceSidebar, BounceSidebarItem } from "./ui/bounce-sidebar";
import { GITHUB_REPO, LATEST_VERSION, DOWNLOAD_PACKAGES } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

interface DocsPageProps {
  onBackToHome: () => void;
}

export const DOCS_SECTIONS: {
  id: string;
  category: string;
  title: string;
  readTime: string;
  summary: string;
  content: React.ReactNode;
}[] = [
  // 1. Overview
  {
    id: "overview",
    category: "Getting Started",
    title: "Overview & Vision",
    readTime: "3 min read",
    summary: "Why Stash exists, the design philosophy behind modular floating scratchpads, and how it differs from traditional heavy note apps.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          <strong className="text-white font-medium">Stash</strong> is an ultra-fast, floating desktop scratchpad designed for uninterrupted deep work. Unlike traditional note-taking software that requires full desktop windows, web tabs, or heavy Electron background processes, Stash hovers unobtrusively at the edge of your screen.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 space-y-3">
          <h4 className="text-white font-medium text-xs uppercase tracking-wider font-mono">The 3 Core Principles</h4>
          <ul className="space-y-2 list-none p-0 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">1.</span>
              <span><strong className="text-zinc-200">Zero Context Switch:</strong> Available globally via hotkey (<code className="text-cyan-300 font-mono">Alt + Space</code>) or collapsed into a 36px micro-bar above code editors and browser windows.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">2.</span>
              <span><strong className="text-zinc-200">Modular Widgets in Situ:</strong> Attach live utility widgets (realtime currency/crypto swap, countdown timers, streak trackers) directly inside individual notes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">3.</span>
              <span><strong className="text-zinc-200">Local-First & Offline:</strong> Built with Tauri 2.0 and Rust. Data is written to an encrypted local SQLite database with zero telemetry and zero cloud lock-in.</span>
            </li>
          </ul>
        </div>

        <h3 className="text-lg font-medium text-white pt-2">System Requirements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/[0.06] bg-[#141417] p-3 text-xs">
            <div className="font-semibold text-white">Windows</div>
            <div className="text-zinc-400 mt-1">Windows 10, 11 (x64 / ARM64)</div>
            <div className="text-zinc-500 font-mono text-[11px] mt-1">WebView2 Runtime (preinstalled)</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#141417] p-3 text-xs">
            <div className="font-semibold text-white">macOS</div>
            <div className="text-zinc-400 mt-1">macOS 12.0 Monterey or later</div>
            <div className="text-zinc-500 font-mono text-[11px] mt-1">Apple Silicon & Intel Universal</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#141417] p-3 text-xs">
            <div className="font-semibold text-white">Linux</div>
            <div className="text-zinc-400 mt-1">Debian, Ubuntu, Fedora, Arch</div>
            <div className="text-zinc-500 font-mono text-[11px] mt-1">WebKitGTK 4.1+</div>
          </div>
        </div>
      </div>
    ),
  },

  // 2. Installation
  {
    id: "installation",
    category: "Getting Started",
    title: "Installation & Setup",
    readTime: "2 min read",
    summary: "Download installers for Windows, macOS, and Linux, or install via package managers like Winget and Homebrew.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Stash is distributed as signed native desktop binaries. You can install it using GUI installers or one-line package manager commands:
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4">
            <div className="flex items-center justify-between text-xs font-medium text-white mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Windows (Winget)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Recommended</span>
            </div>
            <div className="rounded-lg bg-[#0e0e11] p-3 font-mono text-xs text-cyan-300 border border-white/[0.06] flex items-center justify-between">
              <code>winget install Stash.Desktop</code>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4">
            <div className="flex items-center justify-between text-xs font-medium text-white mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-purple-400" />
                <span>macOS (Homebrew Cask)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Universal M1-M4</span>
            </div>
            <div className="rounded-lg bg-[#0e0e11] p-3 font-mono text-xs text-purple-300 border border-white/[0.06] flex items-center justify-between">
              <code>brew install --cask stash</code>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4">
            <div className="flex items-center justify-between text-xs font-medium text-white mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-amber-400" />
                <span>Portable Executable (Zero Install)</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">No admin privileges needed</span>
            </div>
            <p className="text-xs text-zinc-400 mb-2">
              Download <code className="text-white font-mono">stash-standalone.exe</code> from releases and run directly from any USB stick or local directory.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 3. Quickstart
  {
    id: "quickstart",
    category: "Getting Started",
    title: "Quickstart Guide",
    readTime: "4 min read",
    summary: "Your first 5 minutes with Stash: summoning notes, attaching widgets, and customizing window transparency.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              1
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Summon the Scratchpad</h4>
              <p className="text-zinc-400 text-xs mt-1">
                Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">Alt + Space</kbd> anywhere on your system. Stash floats on top of whatever application you are working in.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              2
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Write in Rich Markdown</h4>
              <p className="text-zinc-400 text-xs mt-1">
                Type standard Markdown syntax like <code className="text-cyan-300 font-mono"># Heading</code>, <code className="text-cyan-300 font-mono">- [ ] Task</code>, or <code className="text-cyan-300 font-mono">`code`</code>. Changes persist automatically to SQLite.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              3
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Attach a Live Widget</h4>
              <p className="text-zinc-400 text-xs mt-1">
                Click the <strong className="text-zinc-200">+ Widget</strong> button in the editor toolbar or press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">Ctrl + K</kbd> to insert live currency exchange, countdown timers, or streaks.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              4
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Collapse into 36px Shade</h4>
              <p className="text-zinc-400 text-xs mt-1">
                Double-click the top header bar or press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">Ctrl + D</kbd> to roll up the window into a sleek micro-bar that never blocks your viewport.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 4. Window Shade
  {
    id: "window-shade",
    category: "Core Features",
    title: "36px Window Shade",
    readTime: "3 min read",
    summary: "How the window shade rollup mechanism works, edge docking, and hardware-accelerated collapse animations.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          The <strong className="text-white">Window Shade</strong> feature allows you to collapse any active note or widget into a compact 36px bar. In this shaded state, Stash displays key summaries (active timer countdown, latest task count, currency live price) without consuming screen real estate.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4">
          <h4 className="text-white font-medium text-xs font-mono uppercase mb-3">Shade Behavior & Triggers</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#111114]">
              <span className="text-zinc-300">Double-click Header</span>
              <span className="font-mono text-cyan-400">Toggle Collapse / Expand</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111114]">
              <span className="text-zinc-300">Shortcut <kbd className="bg-white/10 px-1 rounded text-white font-mono">Ctrl + D</kbd></span>
              <span className="font-mono text-cyan-400">Instant Shade Rollup</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111114]">
              <span className="text-zinc-300">Edge Screen Snap</span>
              <span className="font-mono text-cyan-400">Auto-dock to top monitor rim</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 5. Always-On-Top
  {
    id: "always-on-top",
    category: "Core Features",
    title: "Always-On-Top & Pinning",
    readTime: "2 min read",
    summary: "Configure OS window level flags, pin notes across virtual desktops, and adjust window opacity.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          By default, clicking away from normal desktop windows causes them to lose focus and hide behind other applications. Stash utilizes Tauri's native <code className="text-purple-300 font-mono">set_always_on_top(true)</code> API to maintain persistent viewport visibility.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 text-xs space-y-1.5">
            <div className="font-medium text-white">Ghost Opacity Mode</div>
            <p className="text-zinc-400">
              Adjust window transparency from 100% down to 20%. Read notes and code snippets directly through the transparent backdrop.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 text-xs space-y-1.5">
            <div className="font-medium text-white">Click-Through Passthrough</div>
            <p className="text-zinc-400">
              Enable mouse event passthrough so clicks reach the code editor or browser underneath the shaded micro-bar.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 6. Markdown Scratchpad
  {
    id: "markdown-editor",
    category: "Core Features",
    title: "Markdown Scratchpad",
    readTime: "3 min read",
    summary: "Rich text editing with TipTap, auto-linking, task lists, code block syntax highlighting, and instant search.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Stash is built on a customized TipTap editor engine optimized for rapid keystrokes with zero cursor input latency.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 text-xs space-y-3">
          <div className="font-mono text-zinc-400 uppercase tracking-wider text-[11px]">Supported Markdown Extensions</div>
          <ul className="grid grid-cols-2 gap-2 text-zinc-300 list-none p-0">
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>Interactive Checkboxes (<code className="font-mono text-cyan-300">- [ ]</code>)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>Code Blocks with Auto-Copy</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>Tables & Auto-formatting</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>Mathematical Equations ($E=mc^2$)</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // 7. Currency Swap
  {
    id: "currency-swap",
    category: "Modular Widgets",
    title: "Currency & Crypto Swap",
    readTime: "3 min read",
    summary: "Attach live FX and crypto conversion calculators directly to finance scratchpads with local cached rates.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          The <strong className="text-white">Currency Swap Widget</strong> brings realtime exchange rates for over 150 fiat currencies and major cryptocurrencies (BTC, ETH, SOL, USDC) directly into your notes.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 space-y-3 text-xs">
          <div className="text-white font-medium flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-cyan-400" />
            <span>Offline Rate Caching Architecture</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Stash caches conversion rates locally. If you go on an airplane or lose WiFi, the widget uses the last verified timestamped rates without throwing network error banners or freezing.
          </p>
          <div className="rounded bg-[#111114] p-2.5 font-mono text-[11px] text-zinc-400 border border-white/[0.04]">
            <code>1.50 ETH ⇄ 5,130.75 USDC • Cached Rate (2026-09-24)</code>
          </div>
        </div>
      </div>
    ),
  },

  // 8. Countdown Timer
  {
    id: "countdown-timer",
    category: "Modular Widgets",
    title: "Countdown & Pomodoro",
    readTime: "2 min read",
    summary: "Audio chime notifications, focus interval presets, and persistence through app restarts.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Attach focus sessions or deadline countdowns to any note. Timers run in native Rust background threads so they never lose precision when the laptop sleeps or when CPU throttle policies engage.
        </p>
        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 text-xs space-y-2">
          <div className="font-semibold text-white">Preset Modes</div>
          <p className="text-zinc-400">
            • <strong className="text-zinc-200">25m Pomodoro:</strong> Standard focus sprints with audio ding.<br />
            • <strong className="text-zinc-200">Custom Target:</strong> Set target dates (e.g. Q4 Launch) with days, hours, minutes remaining.<br />
            • <strong className="text-zinc-200">Shade Integration:</strong> Timer status automatically projects onto the 36px micro-bar.
          </p>
        </div>
      </div>
    ),
  },

  // 9. Habit Tracker
  {
    id: "habit-tracker",
    category: "Modular Widgets",
    title: "Streak Habit Tracker",
    readTime: "2 min read",
    summary: "7-day streak visualizer, click-to-complete boxes, and SQLite persistence for daily rituals.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Track daily execution (e.g., Code Review, LeetCode, Hydration, Workout) with a clean 7-day dot matrix attached to your morning checklist note.
        </p>
      </div>
    ),
  },

  // 10. SQLite Storage
  {
    id: "sqlite-storage",
    category: "Security & Storage",
    title: "Local SQLite Database",
    readTime: "4 min read",
    summary: "Deep dive into Stash's local storage schema, WAL mode, transactional writes, and backup exports.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Stash never sends your notes to a remote server. All data lives in a high-performance SQLite database on your local filesystem:
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 space-y-3 font-mono text-xs">
          <div className="text-zinc-500">// Local database file locations:</div>
          <div><span className="text-cyan-400">Windows:</span> <span className="text-zinc-300">%APPDATA%\com.stash.desktop\stash.db</span></div>
          <div><span className="text-purple-400">macOS:</span> <span className="text-zinc-300">~/Library/Application Support/com.stash.desktop/stash.db</span></div>
          <div><span className="text-amber-400">Linux:</span> <span className="text-zinc-300">~/.config/com.stash.desktop/stash.db</span></div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 space-y-2 text-xs">
          <div className="font-semibold text-white">SQLite Engine Configuration</div>
          <p className="text-zinc-400">
            • <code className="text-emerald-400 font-mono">PRAGMA journal_mode = WAL;</code> — Ultra-fast atomic concurrent reads and writes.<br />
            • <code className="text-emerald-400 font-mono">PRAGMA synchronous = NORMAL;</code> — Instant writes without blocking UI rendering.<br />
            • <code className="text-emerald-400 font-mono">PRAGMA foreign_keys = ON;</code> — Relational integrity across notes and widgets.
          </p>
        </div>
      </div>
    ),
  },

  // 11. PIN Vault
  {
    id: "pin-vault",
    category: "Security & Storage",
    title: "4-Digit PIN Vault",
    readTime: "3 min read",
    summary: "Protect confidential scratchpads, API keys, and private seeds with AES-256 GCM hardware encryption.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Have API tokens, client secrets, or private seed phrases on your scratchpad? Mark any note as <strong className="text-white font-medium">Confidential</strong> to lock it behind an encrypted 4-digit PIN vault.
        </p>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2 text-xs">
          <div className="font-medium text-rose-300 flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-400" />
            <span>Cryptographic Guarantees</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Locked notes are encrypted using <strong>AES-256 GCM</strong> with PBKDF2-HMAC-SHA256 key derivation. When locked, the plaintext note is purged completely from memory. Without the 4-digit PIN, database forensics cannot decrypt the contents.
          </p>
        </div>
      </div>
    ),
  },

  // 12. Zero Telemetry
  {
    id: "zero-telemetry",
    category: "Security & Storage",
    title: "Zero Telemetry Guarantee",
    readTime: "2 min read",
    summary: "Zero Google Analytics, zero Segment pings, zero telemetry daemons. Pure desktop privacy.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Unlike modern SaaS tools that track every keystroke, open event, and screen duration, Stash does not include a single telemetry SDK.
        </p>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-xs space-y-2">
          <div className="font-medium text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Inspectable Network Activity</span>
          </div>
          <p className="text-zinc-400">
            Open Wireshark or your OS firewall: Stash emits <strong>zero outgoing packets</strong>. The only optional outbound call is if you explicitly click "Check for Updates" to fetch GitHub release tags.
          </p>
        </div>
      </div>
    ),
  },

  // 13. Shortcuts Reference
  {
    id: "shortcuts-ref",
    category: "Developer Reference",
    title: "Global Hotkeys & Shortcuts",
    readTime: "2 min read",
    summary: "Comprehensive table of default keyboard shortcuts and customization instructions.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <div className="rounded-xl border border-white/[0.08] bg-[#161619] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121215] text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.06]">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Windows / Linux</th>
                <th className="py-3 px-4">macOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono">
              <tr>
                <td className="py-3 px-4 text-white">Summon / Hide Stash</td>
                <td className="py-3 px-4 text-cyan-300">Alt + Space</td>
                <td className="py-3 px-4 text-purple-300">⌥ + Space</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-white">Toggle 36px Shade</td>
                <td className="py-3 px-4 text-cyan-300">Ctrl + D</td>
                <td className="py-3 px-4 text-purple-300">⌘ + D</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-white">Command Palette</td>
                <td className="py-3 px-4 text-cyan-300">Ctrl + Shift + P</td>
                <td className="py-3 px-4 text-purple-300">⌘ + Shift + P</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-white">Attach Pomodoro Timer</td>
                <td className="py-3 px-4 text-cyan-300">Ctrl + T</td>
                <td className="py-3 px-4 text-purple-300">⌘ + T</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-white">Attach Currency Swap</td>
                <td className="py-3 px-4 text-cyan-300">Ctrl + K</td>
                <td className="py-3 px-4 text-purple-300">⌘ + K</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-white">Lock Confidential Vault</td>
                <td className="py-3 px-4 text-cyan-300">Ctrl + L</td>
                <td className="py-3 px-4 text-purple-300">⌘ + L</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // 14. Tauri Core
  {
    id: "tauri-core",
    category: "Developer Reference",
    title: "Tauri 2.0 & Rust Core",
    readTime: "4 min read",
    summary: "Architecture overview of the Rust backend, IPC commands, and native window management.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Stash is engineered on the modern <strong>Tauri 2.0</strong> framework. Rather than running a full Chrome browser in the background, Tauri bridges a lightweight web frontend directly to a high-speed Rust backend via native system webviews.
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 text-xs font-mono space-y-2">
          <div className="text-zinc-500">// Example Rust Tauri Command (src-tauri/src/lib.rs):</div>
          <div className="text-orange-400">#[tauri::command]</div>
          <div><span className="text-purple-400">pub fn</span> <span className="text-cyan-300">toggle_window_shade</span>(app: tauri::AppHandle, shaded: bool) {'{'}</div>
          <div className="pl-4 text-zinc-300">let window = app.get_webview_window("main").unwrap();</div>
          <div className="pl-4 text-zinc-300">let height = if shaded {'{'} 36.0 {'}'} else {'{'} 520.0 {'}'};</div>
          <div className="pl-4 text-zinc-300">window.set_size(tauri::LogicalSize::new(420.0, height)).unwrap();</div>
          <div>{'}'}</div>
        </div>
      </div>
    ),
  },

  // 15. Building from Source
  {
    id: "build-source",
    category: "Developer Reference",
    title: "Building from Source",
    readTime: "3 min read",
    summary: "Compile Stash from GitHub repository on Windows, macOS, or Linux using cargo and pnpm.",
    content: (
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <p>
          Stash is 100% open source under the MIT license. You can clone and build the complete app on your local machine:
        </p>

        <div className="rounded-xl border border-white/[0.08] bg-[#161619] p-4 space-y-3 font-mono text-xs">
          <div className="text-zinc-500"># 1. Clone repository:</div>
          <div className="text-cyan-300">git clone https://github.com/stash-app/stash.git</div>
          <div className="text-cyan-300">cd stash</div>
          <div className="text-zinc-500 pt-2"># 2. Install frontend dependencies:</div>
          <div className="text-cyan-300">pnpm install</div>
          <div className="text-zinc-500 pt-2"># 3. Run in development mode with hot reload:</div>
          <div className="text-emerald-400">pnpm tauri dev</div>
          <div className="text-zinc-500 pt-2"># 4. Compile optimized production release:</div>
          <div className="text-emerald-400">pnpm tauri build</div>
        </div>
      </div>
    ),
  },
];

export const DocsPage: React.FC<DocsPageProps> = ({ onBackToHome }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Construct BounceSidebar items matching swamimalode07/rare-ui/bounce-sidebar spec
  const sidebarItems: BounceSidebarItem[] = [
    { label: "GETTING STARTED", heading: true },
    { label: "Overview & Vision", href: "#overview" },
    { label: "Installation & Setup", href: "#installation" },
    { label: "Quickstart Guide", href: "#quickstart" },

    { label: "CORE FEATURES", heading: true },
    { label: "36px Window Shade", href: "#window-shade" },
    { label: "Always-On-Top & Pinning", href: "#always-on-top" },
    { label: "Markdown Scratchpad", href: "#markdown-editor" },

    { label: "MODULAR WIDGETS", heading: true },
    { label: "Currency & Crypto Swap", href: "#currency-swap" },
    { label: "Countdown & Pomodoro", href: "#countdown-timer" },
    { label: "Streak Habit Tracker", href: "#habit-tracker" },

    { label: "SECURITY & STORAGE", heading: true },
    { label: "Local SQLite Database", href: "#sqlite-storage" },
    { label: "4-Digit PIN Vault", href: "#pin-vault" },
    { label: "Zero Telemetry Guarantee", href: "#zero-telemetry" },

    { label: "DEVELOPER REFERENCE", heading: true },
    { label: "Global Hotkeys & Shortcuts", href: "#shortcuts-ref" },
    { label: "Tauri 2.0 & Rust Core", href: "#tauri-core" },
    { label: "Building from Source", href: "#build-source" },
  ];

  // Map section IDs to sidebar indices (skipping heading items)
  const nonHeadingMap: { id: string; index: number }[] = [];
  sidebarItems.forEach((item, index) => {
    if (typeof item !== "string" && !("heading" in item) && item.href) {
      nonHeadingMap.push({ id: item.href.replace("#", ""), index });
    }
  });

  const activeIndex =
    nonHeadingMap.find((m) => m.id === activeSectionId)?.index ?? 1;

  const handleSidebarChange = (idx: number) => {
    const matched = nonHeadingMap.find((m) => m.index === idx);
    if (matched) {
      setActiveSectionId(matched.id);
      window.location.hash = `#docs/${matched.id}`;
    }
  };

  const currentSection =
    DOCS_SECTIONS.find((s) => s.id === activeSectionId) || DOCS_SECTIONS[0];

  const currentIdxInArray = DOCS_SECTIONS.findIndex((s) => s.id === currentSection.id);
  const prevSection = currentIdxInArray > 0 ? DOCS_SECTIONS[currentIdxInArray - 1] : null;
  const nextSection =
    currentIdxInArray < DOCS_SECTIONS.length - 1
      ? DOCS_SECTIONS[currentIdxInArray + 1]
      : null;

  return (
    <div className="min-h-screen bg-[#121215] text-white">
      {/* Top Fixed Documentation Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#121215]/90 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#18181d] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#22222a] shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <img
              src={stashLogoSrc}
              alt="Stash Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="font-semibold text-sm tracking-tight text-white">
              Stash Docs
            </span>
            <span className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              {LATEST_VERSION}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 rounded-full border border-white/[0.08] bg-[#161619] pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Main Documentation Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* Left Column: Rare-UI Bounce Sidebar */}
          <aside className="sticky top-20 rounded-2xl border border-white/[0.08] bg-[#161619] p-4 shadow-xl">
            <div className="px-3 pb-3 mb-2 border-b border-white/[0.06] flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-400 text-[11px] uppercase tracking-wider">
                Table of Contents
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            {/* BounceSidebar Component from swamimalode07/rare-ui */}
            <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              <BounceSidebar
                items={sidebarItems}
                value={activeIndex}
                onChange={handleSidebarChange}
                dotColor="#38bdf8"
              />
            </div>
          </aside>

          {/* Right Column: Documentation Article View */}
          <main className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 sm:p-10 shadow-2xl min-h-[700px] flex flex-col justify-between">
            <article>
              {/* Breadcrumb & Metadata */}
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-3">
                <span className="text-cyan-400">{currentSection.category}</span>
                <span>/</span>
                <span className="text-zinc-300">{currentSection.title}</span>
                <span className="ml-auto text-zinc-500">{currentSection.readTime}</span>
              </div>

              {/* Title & Summary */}
              <h1 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white mb-3">
                {currentSection.title}
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed pb-6 border-b border-white/[0.06]">
                {currentSection.summary}
              </p>

              {/* Body Content */}
              <div className="pt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSection.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentSection.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </article>

            {/* Bottom Next / Previous Article Pagination */}
            <div className="mt-16 pt-6 border-t border-white/[0.06] flex items-center justify-between gap-4">
              {prevSection ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSectionId(prevSection.id);
                    window.location.hash = `#docs/${prevSection.id}`;
                  }}
                  className="flex flex-col text-left group cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 flex items-center gap-1">
                    <span>← Previous</span>
                  </span>
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {prevSection.title}
                  </span>
                </button>
              ) : (
                <div />
              )}

              {nextSection && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSectionId(nextSection.id);
                    window.location.hash = `#docs/${nextSection.id}`;
                  }}
                  className="flex flex-col text-right group cursor-pointer ml-auto"
                >
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 flex items-center justify-end gap-1">
                    <span>Next →</span>
                  </span>
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {nextSection.title}
                  </span>
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
