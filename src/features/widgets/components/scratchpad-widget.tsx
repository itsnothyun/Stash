import React, { useState, useEffect } from "react";
import { Plus, Check, Trash as Trash2, Play, Pause, ArrowCounterClockwise as RotateCcw, Flame, Sparkle as Sparkles } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ScratchpadWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: "1", text: "Ship component-driven template widgets", completed: true },
  { id: "2", text: "Verify window shade transition blur", completed: true },
  { id: "3", text: "Review daily release notes", completed: false },
];

export const ScratchpadWidget: React.FC<ScratchpadWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [fleetingThought, setFleetingThought] = useState("");

  // Pomodoro Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, pomodoroSeconds]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newTaskInput.trim(), completed: false },
    ]);
    setNewTaskInput("");
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const timerMin = String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0");
  const timerSec = String(pomodoroSeconds % 60).padStart(2, "0");

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const taskLines = tasks
      .map((t) => `- [${t.completed ? "x" : " "}] ${t.text}`)
      .join("\n");
    const thoughts = fleetingThought.trim()
      ? `\n\n**Fleeting Thoughts:**\n${fleetingThought.trim()}`
      : "";

    const summary = `\n### 🎯 Daily Scratchpad Summary\n*Progress: ${completedCount}/${tasks.length} tasks completed (${progressPct}%)*\n\n${taskLines}${thoughts}\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Banner: Pomodoro Timer & Streak */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground font-mono font-bold">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Focus Pomodoro
            </div>
            <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {timerMin}:{timerSec}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTimerRunning((r) => !r)}
            className="flex h-7 px-2.5 items-center gap-1 rounded-md bg-foreground text-background font-semibold text-[11px] shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            {timerRunning ? (
              <>
                <Pause className="h-3 w-3" weight="fill" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" weight="fill" />
                <span>Focus</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerRunning(false);
              setPomodoroSeconds(25 * 60);
            }}
            title="Reset timer"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <div className="h-4 w-px bg-border/40 mx-0.5" />
          <div className="flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground">
            <Flame className="h-3 w-3" weight="fill" />
            <span>5d Streak</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px]">
          <span className="font-medium text-foreground">Daily Priorities</span>
          <span className="font-mono text-muted-foreground">
            {completedCount}/{tasks.length} ({progressPct}%)
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Interactive Priorities Checklist */}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 transition-all",
              task.completed
                ? "bg-muted/30 border-border/40 opacity-70"
                : "bg-background/80 border-border shadow-2xs hover:border-border/80"
            )}
          >
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors",
                  task.completed
                    ? "bg-foreground border-foreground text-background shadow-xs"
                    : "border-muted-foreground/40 bg-muted/20 hover:border-foreground"
                )}
              >
                {task.completed && <Check className="h-2.5 w-2.5" weight="bold" />}
              </div>
              <span
                className={cn(
                  "text-xs truncate select-none transition-all",
                  task.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground font-medium"
                )}
              >
                {task.text}
              </span>
            </label>

            <button
              type="button"
              onClick={() => removeTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded"
              title="Delete task"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add new task input */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add priority task... (press Enter)"
            className="flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
          />
          <button
            type="button"
            onClick={addTask}
            disabled={!newTaskInput.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-semibold disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
          </button>
        </div>
      </div>

      {/* Quick Fleeting Thoughts Input */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Fleeting Thoughts
        </label>
        <textarea
          rows={2}
          value={fleetingThought}
          onChange={(e) => setFleetingThought(e.target.value)}
          placeholder="Capture quick fleeting sparks, ideas, or observations..."
          className="w-full rounded-md border border-border bg-background/60 p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none shadow-2xs"
        />
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert Scratchpad Log"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
