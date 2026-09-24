import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Keyboard,
  Sparkles,
  Zap,
  CornerDownLeft,
  Search,
  Eye,
  Minimize2,
  Clock,
  ArrowUpDown,
  Lock,
  Copy,
  Check,
} from "lucide-react";

interface ShortcutDef {
  id: string;
  name: string;
  keys: string[];
  description: string;
  category: "Global" | "Window" | "Widgets" | "Vault";
  actionPreview: string;
  icon: React.ReactNode;
}

const SHORTCUTS: ShortcutDef[] = [
  {
    id: "summon",
    name: "Summon / Dismiss",
    keys: ["Alt", "Space"],
    description: "Instantly bring Stash to the front above all running apps, or hide it.",
    category: "Global",
    actionPreview: "Stash HUD popped to front in < 0.2ms",
    icon: <Command className="h-4 w-4 text-cyan-400" />,
  },
  {
    id: "shade",
    name: "Toggle 36px Shade",
    keys: ["Ctrl", "D"],
    description: "Collapse the entire window into an ultra-thin 36px micro-bar on top.",
    category: "Window",
    actionPreview: "Window height smoothly snapped from 480px → 36px",
    icon: <Minimize2 className="h-4 w-4 text-purple-400" />,
  },
  {
    id: "palette",
    name: "Command Palette",
    keys: ["Ctrl", "Shift", "P"],
    description: "Search notes, trigger actions, switch widgets, or run instant commands.",
    category: "Global",
    actionPreview: "Quick launcher open with 42 commands indexed",
    icon: <Search className="h-4 w-4 text-amber-400" />,
  },
  {
    id: "timer",
    name: "Attach Pomodoro",
    keys: ["Ctrl", "T"],
    description: "Pin a 25-minute focus session timer directly below your current note.",
    category: "Widgets",
    actionPreview: "Countdown Timer active • 25:00 ticking with system chime",
    icon: <Clock className="h-4 w-4 text-emerald-400" />,
  },
  {
    id: "swap",
    name: "Quick Currency Swap",
    keys: ["Ctrl", "K"],
    description: "Insert a realtime fiat & crypto conversion widget into your workspace.",
    category: "Widgets",
    actionPreview: "Swapped 1.50 ETH → 5,130.75 USDC at local cache rate",
    icon: <ArrowUpDown className="h-4 w-4 text-cyan-400" />,
  },
  {
    id: "vault",
    name: "Lock Vault Session",
    keys: ["Ctrl", "L"],
    description: "Immediately wipe memory decrypt keys and lock all sensitive scratchpads.",
    category: "Vault",
    actionPreview: "Decryption tokens purged. AES-256 vault locked.",
    icon: <Lock className="h-4 w-4 text-rose-400" />,
  },
];

export const FeatureShortcuts: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("summon");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeShortcut = SHORTCUTS.find((s) => s.id === selectedId) || SHORTCUTS[0];

  const handleCopyCombo = (combo: string) => {
    navigator.clipboard.writeText(combo);
    setCopiedKey(combo);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <section id="shortcuts" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Section Heading */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400 mb-3">
            <Keyboard className="h-3.5 w-3.5 text-cyan-400" />
            <span>Zero Friction Hotkeys</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
            Keep your hands on the home row
          </h2>
          <p className="mt-3 text-sm text-zinc-400 font-normal leading-relaxed max-w-xl">
            Stash is designed for instant muscle memory. Summon notes, trigger window shades, attach live widgets, or lock private vaults with native desktop hotkeys.
          </p>
        </div>

        {/* Interactive Keyboard & HUD Simulator */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] items-start">
          {/* Left: Interactive Shortcut List */}
          <div className="space-y-3">
            {SHORTCUTS.map((item) => {
              const isSelected = item.id === selectedId;
              const comboString = item.keys.join(" + ");

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedId(item.id)}
                  className={`group flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-cyan-500/40 bg-[#1a1a22] shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                      : "border-white/[0.07] bg-[#151518] hover:border-white/20 hover:bg-[#18181d] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isSelected
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                          : "border-white/[0.08] bg-white/[0.03] text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {item.name}
                        </span>
                        <span className="rounded bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Physical Keycaps */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {item.keys.map((key, kIdx) => (
                      <kbd
                        key={kIdx}
                        className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-2 font-mono text-[11px] font-semibold transition-all ${
                          isSelected
                            ? "border-cyan-500/40 bg-[#22222d] text-cyan-200 shadow-[0_3px_8px_rgba(0,0,0,0.7)]"
                            : "border-white/[0.12] bg-[#1a1a20] text-zinc-300 shadow-[0_2px_6px_rgba(0,0,0,0.5)] group-hover:border-white/20"
                        }`}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Live HUD Simulation Screen */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            {/* Top ambient highlight */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

            <div>
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-5 text-xs text-zinc-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-zinc-400">System Hotkey Dispatcher</span>
                </div>
                <span className="text-[11px] text-cyan-400">Active Listener</span>
              </div>

              {/* Active Shortcut Preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeShortcut.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
                      Triggered Combo:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCombo(activeShortcut.keys.join(" + "))}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey === activeShortcut.keys.join(" + ") ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Shortcut</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#111114] border border-white/[0.06]">
                    {activeShortcut.keys.map((k, i) => (
                      <React.Fragment key={i}>
                        <span className="inline-flex h-8 items-center justify-center rounded-lg border border-white/[0.12] bg-[#1e1e26] px-3 font-mono text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                          {k}
                        </span>
                        {i < activeShortcut.keys.length - 1 && (
                          <span className="text-zinc-600 font-mono text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{activeShortcut.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {activeShortcut.description}
                    </p>
                  </div>

                  {/* Terminal Action Execution Log */}
                  <div className="mt-4 rounded-lg bg-[#0e0e11] border border-white/[0.06] p-3 text-left font-mono text-[11px]">
                    <div className="text-zinc-500 flex items-center justify-between mb-1.5">
                      <span>// Tauri native event bus:</span>
                      <span className="text-emerald-400">OK</span>
                    </div>
                    <div className="text-cyan-300 flex items-start gap-1.5">
                      <span className="text-zinc-600">→</span>
                      <span>{activeShortcut.actionPreview}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Config Link */}
            <div className="pt-4 border-t border-white/[0.06] text-[11px] text-zinc-500 font-mono flex items-center justify-between">
              <span>Configurable in Settings</span>
              <span className="text-zinc-400">JSON & GUI remap</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
