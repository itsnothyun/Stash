import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Note } from "@/features/stash/types/note";
import { taskSummary } from "@/features/stash/task-summary";
import { cn } from "@/lib/utils/cn";

export interface TodayStashGlassPillProps {
  onClick: () => void;
  todayNote?: Note | null;
  size?: "sm" | "md";
  showShortcut?: boolean;
  className?: string;
}

export const TodayStashGlassPill: React.FC<TodayStashGlassPillProps> = ({
  onClick,
  todayNote,
  size = "md",
  showShortcut = true,
  className,
}) => {
  const now = new Date();
  const dayNumber = now.getDate();
  const weekday = now.toLocaleDateString(undefined, { weekday: "short" });
  const fullDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const isLive = Boolean(todayNote);

  // Compute pending tasks if note exists
  const taskStats = useMemo(() => {
    if (!todayNote?.contentJson) return null;
    const summary = taskSummary(todayNote.contentJson);
    if (summary.total === 0) return null;
    return summary;
  }, [todayNote?.contentJson]);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutDisplay = isMac ? "⌘⇧D" : "Ctrl+Shift+D";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      title={`Today's Daily Stash (${fullDate}) · ${shortcutDisplay}`}
      aria-label={`Open Today's Stash (${fullDate})`}
      className={cn(
        "liquid-glass-shell group relative inline-flex items-center rounded-full p-[1.5px] cursor-pointer select-none text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
    >
      {/* Inner Frosted Glass Track */}
      <div
        className={cn(
          "liquid-glass-track liquid-glass-sheen flex items-center rounded-full",
          size === "sm" ? "gap-1.5 px-2.5 py-1 text-[11px]" : "gap-2 px-3 py-1.5 text-xs"
        )}
      >
        {/* Dynamic Mini Calendar Badge */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="flex h-5 w-5 flex-col items-center justify-center rounded-md border border-border/70 bg-surface/80 shadow-2xs overflow-hidden">
            <div className="h-1.5 w-full bg-primary/70 shrink-0" />
            <span className="text-[9px] font-bold font-mono leading-none text-foreground">
              {dayNumber}
            </span>
          </div>

          {/* Active / Beacon Indicator */}
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-background shadow-xs",
              isLive
                ? "glass-active-beacon bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : "bg-primary/30 group-hover:bg-primary transition-colors"
            )}
            title={isLive ? "Today's Stash is active" : "Today's Stash ready to create"}
          />
        </div>

        {/* Label and Day */}
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-semibold tracking-tight text-foreground">Today</span>
          <span className="rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {weekday}
          </span>
        </div>

        {/* Task progress chip if tasks exist */}
        {taskStats && (
          <div
            className="flex items-center gap-1 rounded-full bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary shrink-0"
            title={`${taskStats.done} of ${taskStats.total} tasks completed`}
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span className="font-mono">
              {taskStats.done}/{taskStats.total}
            </span>
          </div>
        )}

        {/* Keyboard Shortcut Chip */}
        {showShortcut && (
          <kbd className="hidden sm:inline-block rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground/80 border border-black/5 dark:border-white/10 leading-none">
            {shortcutDisplay}
          </kbd>
        )}
      </div>
    </motion.button>
  );
};
