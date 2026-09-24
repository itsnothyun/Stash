import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  Sparkles,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Layers,
  ListChecks,
  Pin,
  Kanban,
  Globe,
  Flame,
  ArrowDownUp,
  Check,
} from "lucide-react";
import { StashLogo } from "@/components/shared/stash-logo";
import { useUIStore } from "@/stores/ui-store";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { openOrCreateTodayStash } from "@/features/stash/daily-stash";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface LiquidGlassFooterProps {
  onCapture?: () => void;
  className?: string;
}

export const LiquidGlassFooter: React.FC<LiquidGlassFooterProps> = ({
  onCapture,
  className,
}) => {
  const {
    setActiveSection,
    setSettingsOpen,
    setCommandPaletteOpen,
    theme,
    setTheme,
  } = useUIStore();

  const [quickInput, setQuickInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);

  const handleQuickCapture = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = quickInput.trim();
    if (!text) {
      if (onCapture) {
        onCapture();
      } else {
        void createAndOpenStash();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await createAndOpenStash({
        title: text.length <= 40 ? text : text.slice(0, 37) + "...",
        plainText: text,
      });
      setIsCaptured(true);
      setQuickInput("");
      toast.show({
        message: "Stash Created",
        description: `"${text.slice(0, 30)}${text.length > 30 ? "..." : ""}" captured into floating note.`,
      });
      setTimeout(() => setIsCaptured(false), 2000);
    } catch {
      toast.error("Could not capture stash");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenToday = async () => {
    try {
      const notes = await stashIpc.listNotes();
      await openOrCreateTodayStash(notes, async (id) => {
        await stashIpc.openFloatingStash(id);
      });
      toast.show({ message: "Opened Today's Stash" });
    } catch {
      toast.error("Could not open daily note");
    }
  };

  const handleOpenBrowserPip = async () => {
    try {
      await stashIpc.openPipBrowser({
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      });
      toast.show({
        message: "Picture-in-Picture Active",
        description: "Detached floating browser opened.",
      });
    } catch {
      toast.error("Could not open PiP browser");
    }
  };

  const handleCreateKanbanStash = async () => {
    try {
      await createAndOpenStash({
        title: "Sprint Kanban",
        plainText: "## Kanban Board\nOrganize tasks across columns.",
      });
      toast.show({ message: "Created Kanban Stash" });
    } catch {
      toast.error("Could not create note");
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    toast.show({ message: `Theme set to ${nextTheme}` });
  };

  return (
    <footer
      className={cn(
        "relative w-full max-w-[1140px] mx-auto select-none p-[3px] rounded-[40px] transition-all duration-300",
        // Liquid Glass Outer Specular Bezel
        "bg-gradient-to-b from-white via-zinc-300 via-40% to-white",
        "dark:from-white/20 dark:via-white/[0.04] dark:via-40% dark:to-white/20",
        "shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_24px_-4px_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {/* Inner Frosted Glass Card Container */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[37px] px-8 py-8 sm:px-11 sm:py-9 transition-all duration-300",
          // Liquid Glass Inner Gradient & Blur
          "bg-gradient-to-br from-[#ebeef2] via-[#f7f9fb] to-[#e4e7ed]",
          "dark:bg-gradient-to-br dark:from-[#1b1c21]/95 dark:via-[#131417]/95 dark:to-[#0e0f11]/95",
          "backdrop-blur-2xl",
          // Specular Inner Glow & Inset Ridge
          "shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.9),inset_0_-1px_1.5px_0_rgba(0,0,0,0.06)]",
          "dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.14),inset_0_-1px_1.5px_0_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Top Row: Brand & Quick Action Column + Navigation Columns */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-8 items-start">
          {/* Brand & Newsletter/Quick-Capture Column */}
          <div className="flex flex-col gap-5 max-w-sm w-full">
            <div className="flex items-center gap-3">
              <StashLogo size={22} showText />
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground border border-black/5 dark:border-white/10">
                Desktop v2.4
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pr-2">
              Liquid glass interfaces, crafted with care for fast offline notes,
              responsive checklists, and focused workflows.
            </p>

            {/* Liquid Glass Input Pill */}
            <form onSubmit={handleQuickCapture} className="w-full">
              <div
                className={cn(
                  "group relative flex items-center justify-between p-1 pl-4 rounded-full transition-all duration-300",
                  "bg-white/50 dark:bg-white/[0.06] border border-white/60 dark:border-white/10",
                  "shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.8),inset_0_-1px_1.5px_0_rgba(0,0,0,0.05)]",
                  "dark:shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.1),inset_0_-1px_1.5px_0_rgba(0,0,0,0.5)]",
                  "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
                )}
              >
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Quick stash a thought or task…"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-w-0 pr-2"
                />

                {/* Tactile Glass CTA Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative overflow-hidden shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold select-none cursor-pointer transition-all duration-200",
                    isCaptured
                      ? "bg-emerald-600 text-white shadow-emerald-600/30"
                      : "bg-gradient-to-b from-[#2a2a2e] to-[#0c0c0e] text-white dark:from-[#ffffff] dark:to-[#e2e2e8] dark:text-zinc-950",
                    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_1px_0_rgba(0,0,0,0.5),0_7px_16px_-6px_rgba(0,0,0,0.35)]",
                    "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.2),0_7px_16px_-6px_rgba(0,0,0,0.4)]"
                  )}
                >
                  {/* Glass Sweeping Shine Sheen Layer */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-full top-0 w-1/2 h-[200%] -rotate-25 bg-gradient-to-r from-transparent via-white/40 dark:via-white/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[350%] transition-all duration-700 ease-out"
                  />

                  {isCaptured ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Captured!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Capture</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 w-full lg:w-auto">
            {/* Column 1: Workspace */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-2">
                Workspace
              </span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveSection("all")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Layers className="h-3.5 w-3.5 text-primary opacity-80" />
                  <span>All Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("todos")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <ListChecks className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
                  <span>To-dos & Tasks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("pinned")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Pin className="h-3.5 w-3.5 text-amber-500 opacity-80" />
                  <span>Pinned Stashes</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenToday}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Calendar className="h-3.5 w-3.5 text-indigo-500 opacity-80" />
                  <span>Today's Stash</span>
                </button>
              </div>
            </div>

            {/* Column 2: Widgets */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-2">
                Widgets
              </span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={handleCreateKanbanStash}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Kanban className="h-3.5 w-3.5 text-blue-500 opacity-80" />
                  <span>Kanban Board</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenBrowserPip}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Globe className="h-3.5 w-3.5 text-teal-500 opacity-80" />
                  <span>PiP Web Browser</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void createAndOpenStash({
                      title: "Daily Habits",
                      plainText: "## Habits\nTrack everyday momentum.",
                    });
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <Flame className="h-3.5 w-3.5 text-orange-500 opacity-80" />
                  <span>Habit Tracker</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void createAndOpenStash({
                      title: "Unit Converter & Tools",
                      plainText: "## Quick Converter",
                    });
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <ArrowDownUp className="h-3.5 w-3.5 text-violet-500 opacity-80" />
                  <span>Unit Converter</span>
                </button>
              </div>
            </div>

            {/* Column 3: System */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-2">
                System
              </span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => (onCapture ? onCapture() : void createAndOpenStash())}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-primary opacity-80" />
                    <span>Quick Stash</span>
                  </span>
                  <kbd className="font-mono text-[10px] text-muted-foreground bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                    Ctrl+N
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-80" />
                    <span>Command Bar</span>
                  </span>
                  <kbd className="font-mono text-[10px] text-muted-foreground bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                    Ctrl+K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <SettingsIcon className="h-3.5 w-3.5 text-zinc-500 opacity-80" />
                    <span>Preferences</span>
                  </span>
                  <kbd className="font-mono text-[10px] text-muted-foreground bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                    Ctrl+,
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5 text-amber-400 opacity-80" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-indigo-400 opacity-80" />
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liquid Glass Hairline Divider */}
        <div className="h-px w-full bg-black/10 dark:bg-white/10 my-6" />

        {/* Bottom Row: Metadata & Circular Glass Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/80 font-normal">
            © 2026 Stash • High-performance offline notes & liquid glass widgets.
          </p>

          {/* Social / Circular Glass Action Buttons */}
          <div className="flex items-center gap-2.5">
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (onCapture ? onCapture() : void createAndOpenStash())}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none",
                "bg-white/40 dark:bg-white/[0.08] border border-white/50 dark:border-white/15",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(0,0,0,0.08)]",
                "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
                "hover:bg-white/70 dark:hover:bg-white/[0.16] hover:text-foreground text-muted-foreground"
              )}
              title="New Stash Note (Ctrl+N)"
            >
              <Plus className="h-4 w-4 stroke-[2.2]" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenToday}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none",
                "bg-white/40 dark:bg-white/[0.08] border border-white/50 dark:border-white/15",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(0,0,0,0.08)]",
                "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
                "hover:bg-white/70 dark:hover:bg-white/[0.16] hover:text-foreground text-muted-foreground"
              )}
              title="Today's Stash"
            >
              <Calendar className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCommandPaletteOpen(true)}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none",
                "bg-white/40 dark:bg-white/[0.08] border border-white/50 dark:border-white/15",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(0,0,0,0.08)]",
                "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
                "hover:bg-white/70 dark:hover:bg-white/[0.16] hover:text-foreground text-muted-foreground"
              )}
              title="Command Palette (Ctrl+K)"
            >
              <Sparkles className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettingsOpen(true)}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none",
                "bg-white/40 dark:bg-white/[0.08] border border-white/50 dark:border-white/15",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(0,0,0,0.08)]",
                "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
                "hover:bg-white/70 dark:hover:bg-white/[0.16] hover:text-foreground text-muted-foreground"
              )}
              title="Preferences (Ctrl+,)"
            >
              <SettingsIcon className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none",
                "bg-white/40 dark:bg-white/[0.08] border border-white/50 dark:border-white/15",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(0,0,0,0.08)]",
                "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
                "hover:bg-white/70 dark:hover:bg-white/[0.16] hover:text-foreground text-muted-foreground"
              )}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
};
