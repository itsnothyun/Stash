import React, { useState } from "react";
import { Plus, Minus, RotateCcw, Target } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface CounterWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

export const CounterWidget: React.FC<CounterWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [label, setLabel] = useState("Daily Goal");
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(10);

  const increment = (step: number) => setCount((c) => Math.max(0, c + step));
  const decrement = (step: number) => setCount((c) => Math.max(0, c - step));
  const reset = () => setCount(0);

  const progressPercent = target > 0 ? Math.min(100, (count / target) * 100) : 0;
  const isGoalReached = count >= target && target > 0;

  const handleInsert = () => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const totalBlocks = 10;
    const filledBlocks = Math.min(totalBlocks, Math.round((progressPercent / 100) * totalBlocks));
    const progressBar = "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);

    const message = `\n### 🎯 Goal Tracker: ${label}
> *${isGoalReached ? "🎉 Target Reached!" : "In Progress"} • Recorded on ${dateStr} at ${timeStr}*

- **Progress**: **\`${count}\`** / **\`${target}\`** (${Math.round(progressPercent)}%)
- **Status Bar**: \`[${progressBar}]\`\n`;

    onInsertToNote(message);
  };

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[220px] text-foreground",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      {/* Title & Goal Input */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-border/50">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Counter name"
          className="text-xs font-semibold bg-transparent border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 max-w-[120px] truncate"
        />

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Target className="h-3 w-3 text-primary" />
          <span>Goal:</span>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-9 h-5 text-center font-mono font-semibold bg-black/5 dark:bg-white/5 border border-border/70 rounded text-[11px] text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Main Count Display */}
      <div className="flex flex-col items-center justify-center py-2.5">
        <div className="text-4xl font-extrabold font-mono tracking-tight text-foreground tabular-nums">
          {count}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {isGoalReached ? (
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              Goal achieved! 🎉
            </span>
          ) : (
            <span>
              {count} of {target} ({Math.round(progressPercent)}%)
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-2.5">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isGoalReached ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Buttons */}
      <div className="grid grid-cols-4 gap-1 mt-1">
        <button
          onClick={() => decrement(1)}
          className="h-8 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-xs font-medium text-foreground transition-colors"
          title="Minus 1"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => increment(1)}
          className="h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs flex items-center justify-center gap-0.5 shadow-xs transition-colors"
          title="Plus 1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>1</span>
        </button>

        <button
          onClick={() => increment(5)}
          className="h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-mono font-medium text-xs flex items-center justify-center text-foreground transition-colors"
          title="Plus 5"
        >
          +5
        </button>

        <button
          onClick={reset}
          className="h-8 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Reset counter"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Log count to note */}
      <WidgetInsertButton
        onInsert={handleInsert}
        label="Insert to note"
        insertedLabel="Inserted to note!"
        className="w-full mt-2.5"
      />
    </div>
  );
};
