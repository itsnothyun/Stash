import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Layers,
  ArrowUpDown,
  CalendarClock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Flame,
  Key,
  Settings,
  User,
  Sliders,
  AlertCircle,
  Clock,
  ExternalLink,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  CheckSquare,
  Play,
  Pause,
  Grid3X3,
  List,
} from "lucide-react";
import {
  detectUserOS,
  DOWNLOAD_PACKAGES,
  OperatingSystem,
  LATEST_VERSION,
  GITHUB_REPO,
} from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

export const Hero: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  // DEFAULT IS GALLERY MODE VIEW as requested
  const [viewMode, setViewMode] = useState<"gallery" | "table">("gallery");
  const [activeTab, setActiveTab] = useState("all");
  const [pinnedFilter, setPinnedFilter] = useState(false);

  // Gallery interactive states
  const [swapPay, setSwapPay] = useState("1.50");
  const [swapFlipped, setSwapFlipped] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Build custom drag titlebar & 36px shade", done: true },
    { id: 2, text: "Attach Currency Swap & Pomodoro widgets", done: true },
    { id: 3, text: "SQLite position autosave & checkpoints", done: true },
    { id: 4, text: "Download Windows .exe & macOS .dmg", done: false },
  ]);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(1482); // 24:42
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [habitDays, setHabitDays] = useState([true, true, true, true, true, false, false]);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  // Timer countdown tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 1500));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const toggleHabitDay = (idx: number) => {
    setHabitDays(habitDays.map((val, i) => (i === idx ? !val : val)));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stashItems = [
    {
      title: "Crypto Portfolio & DCA Yield Plan",
      subtitle: "💱 Currency Swap Widget attached • 1.50 ETH → 5,130.75 USDC • Pinned Always-On-Top",
      widgets: "2 active",
      memory: "14.2 MB",
      latency: "< 0.4ms",
      latencyColor: "text-emerald-400",
      state: "Pinned (Top)",
      stateColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      when: "Just now",
      pinned: true,
      tag: "finance",
    },
    {
      title: "Sprint Architecture: 36px Window Shade",
      subtitle: "📝 Markdown Scratchpad • Double-click collapsed into 36px micro-bar • 5/5 tasks checked",
      widgets: "1 sticky",
      memory: "12.8 MB",
      latency: "< 0.3ms",
      latencyColor: "text-emerald-400",
      state: "Shaded (36px)",
      stateColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      when: "2m ago",
      pinned: true,
      tag: "dev",
    },
    {
      title: "Q4 Product Launch & Marketing Sprint",
      subtitle: "⏱ Countdown Timer Widget • 14d 08h remaining • Audio Chime on expiry",
      widgets: "1 timer",
      memory: "11.1 MB",
      latency: "< 0.2ms",
      latencyColor: "text-emerald-400",
      state: "Active (25:00)",
      stateColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      when: "8m ago",
      pinned: false,
      tag: "launch",
    },
    {
      title: "Production API Keys & Server Credentials (PIN Locked)",
      subtitle: "🔒 4-Digit PIN Vault • AES-256 GCM encrypted • Hardware derivation",
      widgets: "Vault",
      memory: "9.4 MB",
      latency: "< 0.1ms",
      latencyColor: "text-emerald-400",
      state: "Encrypted",
      stateColor: "text-rose-400 bg-rose-400/10 border-rose-400/20",
      when: "Yesterday",
      pinned: true,
      tag: "security",
    },
    {
      title: "Daily Engineering Standup & Deep Work Habits",
      subtitle: "🔥 Habit Grid • 8/8 daily checkpoints filled • 14-day streak",
      widgets: "Habit Grid",
      memory: "13.5 MB",
      latency: "< 0.4ms",
      latencyColor: "text-emerald-400",
      state: "Streak 14d",
      stateColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      when: "1h ago",
      pinned: false,
      tag: "habits",
    },
    {
      title: "Multi-Currency Expense Reimbursement",
      subtitle: "💱 Multi-FX • USD / EUR / PHP live auto-refresh • Insert 1-Click summary",
      widgets: "Currency Swap",
      memory: "14.8 MB",
      latency: "< 0.3ms",
      latencyColor: "text-emerald-400",
      state: "Auto-refresh",
      stateColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      when: "3h ago",
      pinned: false,
      tag: "finance",
    },
  ];

  const filteredItems = stashItems.filter((item) => {
    if (pinnedFilter && !item.pinned) return false;
    if (activeTab === "dev" && item.tag !== "dev") return false;
    if (activeTab === "finance" && item.tag !== "finance") return false;
    return true;
  });

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 opacity-30 blur-[130px] [background:radial-gradient(circle_at_center,#10b981_0%,#06b6d4_30%,#6366f1_60%,transparent_80%)]"
      />

      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Left-Aligned Headline Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-left"
        >
          <h1 className="font-display text-4xl sm:text-5xl md:text-[54px] font-[450] tracking-tight text-white leading-[1.12] text-balance">
            The floating scratchpad for deep work
          </h1>

          <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400 font-normal leading-relaxed text-pretty">
            Attach live currency conversions, countdown timers, habits, and Markdown notes that hover right where you think. Zero bloat, local SQLite, built for Windows and macOS.
          </p>

          {/* CTA Row: Left Buttons + Right Brand Badge */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* White Pill Button */}
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href={pkg.primaryInstaller.url}
                download
                className="group relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-black transition-transform group-hover:-translate-y-0.5" />
                <span>
                  {os === "macos"
                    ? "Download for macOS (.dmg)"
                    : os === "windows"
                    ? "Download for Windows (.exe)"
                    : "Download Stash"}
                </span>
              </motion.a>

              {/* Ghost Glass Pill Button */}
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#floating"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <span>Explore Features</span>
              </motion.a>
            </div>

            {/* Right: Built with Tauri 2.0 & Rust */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-normal">
              <span>Native Core</span>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>Tauri 2.0</span>
                <span className="text-zinc-600">/</span>
                <span className="text-orange-400 font-mono text-[10px]">Rust</span>
                <span className="text-zinc-600">/</span>
                <span className="text-emerald-400 font-mono text-[10px]">SQLite</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Application Frame (Authentic Stash Desktop UI & UX with Seamless Layout Animation) */}
        <motion.div
          layout
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] items-stretch">
            {/* Left App Sidebar */}
            <div className="hidden md:flex flex-col justify-between border-r border-white/[0.06] bg-[#0a0a0c] p-3 text-xs">
              <div>
                {/* Personal Vault Workspace Switcher */}
                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-white mb-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={stashLogoSrc}
                      alt="Stash"
                      className="h-4 w-4 object-contain rounded"
                    />
                    <span className="tracking-tight">Personal Vault</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </div>

                {/* Sidebar Navigation Items */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-rose-500/20 text-rose-400 text-[10px]">
                      ●
                    </div>
                    <span>Overview</span>
                  </div>

                  {/* Active Selected Item */}
                  <div className="flex items-center gap-2.5 rounded-md bg-white/[0.06] px-2.5 py-1.5 font-medium text-white shadow-xs">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-amber-500/20 text-amber-400 text-[10px]">
                      ★
                    </div>
                    <span>Scratchpad</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-cyan-500/20 text-cyan-400 text-[10px]">
                      ▲
                    </div>
                    <span>Floating Stickies</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-emerald-500/20 text-emerald-400 text-[10px]">
                      💱
                    </div>
                    <span>Currency Swap</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-purple-500/20 text-purple-400 text-[10px]">
                      ⏱
                    </div>
                    <span>Countdown Timers</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-blue-500/20 text-blue-400 text-[10px]">
                      🔥
                    </div>
                    <span>Habits & Streaks</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-pink-500/20 text-pink-400 text-[10px]">
                      🔒
                    </div>
                    <span>Secret Vault</span>
                  </div>
                </div>
              </div>

              {/* Bottom Sidebar Items */}
              <div className="border-t border-white/[0.06] pt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-cyan-400" />
                    <span>Quick Stash</span>
                  </span>
                  <span className="font-mono text-[9px] rounded bg-white/5 px-1 py-0.2 border border-white/10 text-zinc-400">
                    Ctrl+Shift+S
                  </span>
                </div>

                <div className="flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Pin className="h-3 w-3 text-amber-400" />
                    <span>Always On Top</span>
                  </span>
                  <span className="font-mono text-[9px] rounded bg-white/5 px-1 py-0.2 border border-white/10 text-zinc-400">
                    Ctrl+P
                  </span>
                </div>

                <div className="border-t border-white/[0.06] pt-2 flex items-center gap-2 px-2 text-zinc-300 font-medium">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] text-black font-bold">
                    S
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">SQLite Encrypted</div>
                    <div className="text-[9px] font-mono text-zinc-500">100% Offline</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Workspace Viewport */}
            <motion.div layout transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col bg-[#0c0c0e] min-w-0">
              {/* Header Bar with View Switcher (DEFAULT: GALLERY MODE) */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/[0.06] px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-white text-xs">
                    <span className="text-amber-400">★</span>
                    <span>Workspace</span>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => setActiveTab(activeTab === "all" ? "dev" : "all")}
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
                        activeTab === "dev"
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>{activeTab === "dev" ? "#dev" : "All tags"}</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                    </button>

                    <button
                      onClick={() => setPinnedFilter(!pinnedFilter)}
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
                        pinnedFilter
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Pin className="h-2.5 w-2.5 text-amber-400" />
                      <span>Pinned only</span>
                    </button>
                  </div>
                </div>

                {/* Right: View Mode Segmented Control (DEFAULT: GALLERY MODE) */}
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/50 p-0.5 text-xs text-zinc-400 relative">
                  <button
                    type="button"
                    onClick={() => setViewMode("gallery")}
                    className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === "gallery" ? "text-white font-medium" : "hover:text-white"
                    }`}
                  >
                    <Grid3X3 className="h-3 w-3" />
                    <span>Gallery</span>
                    {viewMode === "gallery" && (
                      <motion.div
                        layoutId="hero-view-pill"
                        className="absolute inset-0 rounded-md bg-white/[0.12] border border-white/[0.1] -z-10 shadow-xs"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === "table" ? "text-white font-medium" : "hover:text-white"
                    }`}
                  >
                    <List className="h-3 w-3" />
                    <span>List</span>
                    {viewMode === "table" && (
                      <motion.div
                        layoutId="hero-view-pill"
                        className="absolute inset-0 rounded-md bg-white/[0.12] border border-white/[0.1] -z-10 shadow-xs"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* View Container: Animate switch between Gallery & Table with Seamless Height Resizing */}
              <motion.div
                layout
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {viewMode === "gallery" ? (
                  /* ========================================================
                     GALLERY MODE VIEW (Default: Authentic Stash Stickies & Widgets)
                     ======================================================== */
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-radial-pattern"
                  >
                    {/* GALLERY CARD 1: Currency Swap Widget */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-amber-500/25 bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-amber-500/40 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span>Currency Swap</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        </div>

                        {/* Swap Inputs */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/[0.06] px-2.5 py-1.5">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-zinc-500 block">Pay</span>
                              <input
                                type="text"
                                value={swapPay}
                                onChange={(e) => setSwapPay(e.target.value)}
                                className="bg-transparent font-mono text-xs font-bold text-white outline-none w-20"
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold text-amber-400">
                              {swapFlipped ? "USDC" : "ETH"}
                            </span>
                          </div>

                          <div className="flex justify-center -my-1">
                            <button
                              type="button"
                              onClick={() => setSwapFlipped(!swapFlipped)}
                              className="rounded-full bg-zinc-800 p-1 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <ArrowUpDown className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/[0.06] px-2.5 py-1.5">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-zinc-500 block">Receive</span>
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {swapFlipped ? "1.50" : "5,130.75"}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-semibold text-emerald-400">
                              {swapFlipped ? "ETH" : "USDC"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>1 ETH = $3,420.50</span>
                        <span className="text-amber-400">📌 Pinned</span>
                      </div>
                    </motion.div>

                    {/* GALLERY CARD 2: Sprint Architecture & 36px Window Shade */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-cyan-500/25 bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-cyan-500/40 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-cyan-300">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            <span>Sprint Tasks</span>
                          </div>
                          <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
                            36px Shade
                          </span>
                        </div>

                        {/* Interactive Task List */}
                        <div className="space-y-1.5 text-[11px]">
                          {tasks.slice(0, 3).map((t) => (
                            <div
                              key={t.id}
                              onClick={() => toggleTask(t.id)}
                              className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none"
                            >
                              <div
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                  t.done
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                    : "border-white/20 bg-white/5"
                                }`}
                              >
                                {t.done && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                              <span className={`truncate ${t.done ? "line-through text-zinc-500" : ""}`}>
                                {t.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>#architecture</span>
                        <span className="text-cyan-400">SQLite Saved</span>
                      </div>
                    </motion.div>

                    {/* GALLERY CARD 3: Countdown Timer Widget */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-purple-500/25 bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-purple-300">
                            <span className="h-2 w-2 rounded-full bg-purple-400" />
                            <span>Focus Pomodoro</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="p-1 rounded hover:bg-white/10 text-purple-300 cursor-pointer"
                          >
                            {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Digital Timer Face */}
                        <div className="text-center py-2">
                          <div className="font-mono text-2xl font-bold tracking-tight text-white">
                            {formatTimer(timerSeconds)}
                          </div>
                          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">
                            Deep Work Session
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>🔔 Audio Chime ON</span>
                        <span className="text-purple-400">25m Sprint</span>
                      </div>
                    </motion.div>

                    {/* GALLERY CARD 4: 4-Digit Confidential PIN Vault */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-rose-500/25 bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-rose-500/40 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-rose-300">
                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                            <span>Server Keys (Vault)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVaultUnlocked(!vaultUnlocked)}
                            className="flex items-center gap-1 rounded bg-rose-500/15 text-rose-300 px-1.5 py-0.5 text-[9px] font-mono border border-rose-500/20 cursor-pointer"
                          >
                            {vaultUnlocked ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                            <span>{vaultUnlocked ? "Unlocked" : "Locked"}</span>
                          </button>
                        </div>

                        {/* Vault Content */}
                        <div className="py-1 text-xs">
                          {!vaultUnlocked ? (
                            <div className="flex flex-col items-center py-2 space-y-1.5">
                              <div className="flex gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                <span className="h-2 w-2 rounded-full border border-white/30" />
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                4-Digit PIN Encrypted
                              </span>
                            </div>
                          ) : (
                            <div className="bg-black/50 p-2 rounded border border-white/10 font-mono text-[10px] text-emerald-300 space-y-0.5">
                              <div>AWS_SECRET="AKIA_LIVE"</div>
                              <div>DB_PASS="vault99"</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>AES-256 GCM</span>
                        <span className="text-rose-400">Zero Cloud</span>
                      </div>
                    </motion.div>

                    {/* GALLERY CARD 5: Daily Deep Work Habit Streak */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-blue-500/25 bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-blue-500/40 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-blue-300">
                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                            <span>Habit Streaks</span>
                          </div>
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <Flame className="h-2.5 w-2.5" />
                            <span>14d</span>
                          </span>
                        </div>

                        {/* Interactive 7-Day Dot Grid */}
                        <div className="py-2">
                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mb-1.5">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                              <span key={i} className="w-5 text-center">{d}</span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                            {habitDays.map((val, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleHabitDay(idx)}
                                className={`h-5 w-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                  val
                                    ? "bg-blue-500 text-white shadow-xs shadow-blue-500/50"
                                    : "bg-white/5 border border-white/10 hover:border-white/20"
                                }`}
                              >
                                {val && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Coding (2h/day)</span>
                        <span className="text-blue-400">5/7 done</span>
                      </div>
                    </motion.div>

                    {/* GALLERY CARD 6: Markdown Note & Code Block */}
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-white/[0.1] bg-[#121318] p-3.5 flex flex-col justify-between shadow-lg hover:border-white/20 transition-colors"
                    >
                      <div>
                        {/* Titlebar */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                            <span className="h-2 w-2 rounded-full bg-zinc-400" />
                            <span>Tauri v2 Config</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("await window.setAlwaysOnTop(true);");
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                            title="Copy snippet"
                          >
                            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Code snippet */}
                        <div className="bg-black/50 p-2.5 rounded-lg border border-white/[0.06] text-[10px] font-mono text-cyan-300 leading-relaxed">
                          <div className="text-zinc-500">// Window configuration:</div>
                          <code>await window.setAlwaysOnTop(true);</code>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Markdown WYSIWYG</span>
                        <span className="text-zinc-400">Export .md</span>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  /* ========================================================
                     TABLE (LIST) VIEW (Available via segmented toggle)
                     ======================================================== */
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-x-auto"
                  >
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-[11px] font-medium text-zinc-500">
                          <th className="py-2.5 px-4 font-normal">Stash & Attached Widget</th>
                          <th className="py-2.5 px-3 font-normal text-right">Widgets</th>
                          <th className="py-2.5 px-3 font-normal text-right">Memory</th>
                          <th className="py-2.5 px-3 font-normal text-right">Latency</th>
                          <th className="py-2.5 px-3 font-normal text-right">State</th>
                          <th className="py-2.5 px-4 font-normal text-right">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {filteredItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-medium text-zinc-200 group-hover:text-white transition-colors truncate max-w-xs sm:max-w-md">
                                {item.pinned && (
                                  <Pin className="h-3 w-3 text-amber-400 fill-amber-400/30 shrink-0" />
                                )}
                                <span className="truncate">{item.title}</span>
                              </div>
                              <div className="mt-1 text-[10px] text-zinc-500 truncate max-w-xs sm:max-w-md">
                                {item.subtitle}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-zinc-400">
                              {item.widgets}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-zinc-400">
                              {item.memory}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-medium ${item.latencyColor}`}>
                              {item.latency}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${item.stateColor}`}
                              >
                                {item.state}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">
                              {item.when}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

              {/* Table / Gallery Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-zinc-500">
                <span>6 active workspace stashes</span>
                <div className="flex items-center gap-3 font-mono">
                  <span>SQLite DB: 32.4 KB</span>
                  <span className="text-emerald-400">● 100% Offline</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
