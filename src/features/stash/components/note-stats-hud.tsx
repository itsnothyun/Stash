import React, { useMemo } from "react";
import {
  ChartBar as BarChart3,
  CopySimple as Copy,
  CheckSquare as ListTodo,
} from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface NoteStatsHudProps {
  plainText: string;
  className?: string;
}

export function computeNoteStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, "").length;
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  // Reading time at ~200 WPM
  const readingTimeSec = Math.round((words / 200) * 60);
  // Speaking time at ~130 WPM
  const speakingTimeSec = Math.round((words / 130) * 60);

  // Checklists detection
  const lines = text.split("\n");
  let totalTasks = 0;
  let completedTasks = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^([-*]\s*)?\[\s*\]\s+/.test(line)) {
      totalTasks++;
    } else if (/^([-*]\s*)?\[[xX]\]\s+/.test(line)) {
      totalTasks++;
      completedTasks++;
    }
  }

  const pendingTasks = totalTasks - completedTasks;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    readingTimeSec,
    speakingTimeSec,
    totalTasks,
    completedTasks,
    pendingTasks,
    taskProgress,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, seconds)}s read`;
  const mins = Math.round(seconds / 60);
  return `${mins} min read`;
}

export const NoteStatsHud: React.FC<NoteStatsHudProps> = ({
  plainText,
  className,
}) => {
  const iconSet = useUIStore((s) => s.iconSet);
  const isColorful = iconSet === "colorful";
  const stats = useMemo(() => computeNoteStats(plainText), [plainText]);

  const handleCopyStats = () => {
    let summary = `${stats.words} words · ${stats.characters} chars · ${formatDuration(stats.readingTimeSec)}`;
    if (stats.totalTasks > 0) {
      summary += ` · ${stats.completedTasks}/${stats.totalTasks} tasks done (${stats.taskProgress}%)`;
    }
    navigator.clipboard.writeText(summary);
    toast.show({ message: "Copied note statistics" });
  };

  const handleCopyCleanText = () => {
    navigator.clipboard.writeText(plainText);
    toast.show({ message: "Copied note text to clipboard" });
  };

  // If completely empty, show minimal words
  const pillLabel = useMemo(() => {
    if (stats.totalTasks > 0) {
      return `${stats.completedTasks}/${stats.totalTasks} done · ${stats.words} words`;
    }
    return `${stats.words} word${stats.words === 1 ? "" : "s"} · ${formatDuration(stats.readingTimeSec)}`;
  }, [stats]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Click to view detailed note statistics"
          className={cn(
            "no-drag-region flex items-center gap-1.5 rounded-full border border-border/40 bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/80 shadow-2xs backdrop-blur-xs transition-all hover:bg-background hover:text-foreground hover:shadow-xs active:scale-95 cursor-pointer select-none",
            className
          )}
        >
          <BarChart3
            className={cn(
              "h-3 w-3 shrink-0",
              isColorful ? "text-primary opacity-80" : "text-foreground/70"
            )}
          />
          <span>{pillLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={6}
        className="w-64 p-3 text-xs shadow-lg backdrop-blur-md bg-background/95 border-border/60"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <BarChart3
              className={cn("h-3.5 w-3.5", isColorful ? "text-primary" : "text-foreground")}
            />
            <span>Note Insights</span>
          </div>
          <button
            type="button"
            onClick={handleCopyStats}
            title="Copy stats summary"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-current/10 transition-colors"
          >
            <Copy className="h-3 w-3" />
            <span>Copy</span>
          </button>
        </div>

        {/* Task progress bar if checklist exists */}
        {stats.totalTasks > 0 && (
          <div className="mb-3 rounded-md bg-muted/40 p-2 border border-border/30">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1 text-foreground font-medium">
                <ListTodo
                  className={cn(
                    "h-3 w-3",
                    isColorful ? "text-emerald-500" : "text-foreground/80"
                  )}
                />
                Checklist
              </span>
              <span
                className={cn(
                  "font-semibold",
                  isColorful ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}
              >
                {stats.completedTasks}/{stats.totalTasks} ({stats.taskProgress}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isColorful ? "bg-emerald-500" : "bg-foreground"
                )}
                style={{ width: `${stats.taskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div className="flex flex-col p-1.5 rounded-sm bg-muted/20">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Words</span>
            <span className="text-sm font-semibold text-foreground">{stats.words}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-sm bg-muted/20">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Characters</span>
            <span className="text-sm font-semibold text-foreground">{stats.characters}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-sm bg-muted/20">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Paragraphs</span>
            <span className="text-sm font-semibold text-foreground">{stats.paragraphs}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-sm bg-muted/20">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Reading Time</span>
            <span className="text-sm font-semibold text-foreground">
              {stats.readingTimeSec < 60 ? `${Math.max(1, stats.readingTimeSec)}s` : `${Math.round(stats.readingTimeSec / 60)}m`}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70">
            {stats.charactersNoSpaces} chars (no space)
          </span>
          <button
            type="button"
            onClick={handleCopyCleanText}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            Copy plain text
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
