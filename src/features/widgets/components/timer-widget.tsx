import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, ArrowCounterClockwise as RotateCcw, Clock, Coffee } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface TimerWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "stopwatch";

const MODE_CONFIG: Record<
  TimerMode,
  { label: string; defaultSeconds: number; icon: React.ReactNode }
> = {
  pomodoro: {
    label: "Pomodoro",
    defaultSeconds: 25 * 60,
    icon: <Clock className="h-3 w-3 text-foreground" />,
  },
  shortBreak: {
    label: "Break",
    defaultSeconds: 5 * 60,
    icon: <Coffee className="h-3 w-3 text-foreground" />,
  },
  longBreak: {
    label: "Rest",
    defaultSeconds: 15 * 60,
    icon: <Coffee className="h-3 w-3 text-foreground" />,
  },
  stopwatch: {
    label: "Stopwatch",
    defaultSeconds: 0,
    icon: <Clock className="h-3 w-3 text-foreground" />,
  },
};

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.pomodoro.defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initialSeconds = MODE_CONFIG[mode].defaultSeconds;
  const isStopwatch = mode === "stopwatch";

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (isStopwatch) {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isStopwatch]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].defaultSeconds);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIG[mode].defaultSeconds);
  };

  const handleAddMinutes = (mins: number) => {
    setTimeLeft((prev) => Math.max(0, prev + mins * 60));
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleInsert = () => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    let summary = "";
    if (isStopwatch) {
      const elapsedMins = Math.floor(timeLeft / 60);
      const elapsedSecs = timeLeft % 60;
      summary = `\n### ⏱️ Stopwatch Log
> *Tracked on ${dateStr} at ${timeStr}*

- **Elapsed Time**: **\`${elapsedMins}m ${elapsedSecs}s\`**
- **Mode**: Stopwatch\n`;
    } else {
      const elapsedSec = initialSeconds - timeLeft;
      const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));
      const isComplete = timeLeft === 0;
      summary = `\n### ⏱️ ${MODE_CONFIG[mode].label} Session
> *${isComplete ? "🎉 Completed!" : "In Progress"} • Recorded on ${dateStr} at ${timeStr}*

- **Duration Logged**: **\`${elapsedMins} min${elapsedMins !== 1 ? "s" : ""}\`**
- **Target Duration**: \`${Math.round(initialSeconds / 60)} mins\`
- **Status**: ${isComplete ? "✅ Session completed" : "⏸️ Partial session logged"}\n`;
    }

    onInsertToNote(summary);
  };

  const progressPercent = isStopwatch
    ? Math.min(100, (timeLeft / (60 * 60)) * 100)
    : initialSeconds > 0
    ? ((initialSeconds - timeLeft) / initialSeconds) * 100
    : 0;

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[240px] text-foreground",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      {/* Mode Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 mb-3 text-[10.5px]">
        {(["pomodoro", "shortBreak", "longBreak", "stopwatch"] as TimerMode[]).map(
          (m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`py-1 rounded-md font-medium transition-all text-center truncate ${
                mode === m
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          )
        )}
      </div>

      {/* Main Display */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <div className="text-4xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
          {MODE_CONFIG[mode].icon}
          <span>
            {isRunning
              ? isStopwatch
                ? "Running..."
                : "Focusing..."
              : timeLeft === 0 && !isStopwatch
              ? "Completed! 🎉"
              : "Ready"}
          </span>
        </div>

        {/* Progress Bar */}
        {!isStopwatch && (
          <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Primary Controls */}
      <div className="flex items-center justify-between gap-1.5 mt-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 h-8 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5" weight="fill" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" weight="fill" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="h-8 w-8 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Reset timer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {!isStopwatch && (
          <button
            onClick={() => handleAddMinutes(5)}
            className="h-8 px-2 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Add 5 minutes"
          >
            +5m
          </button>
        )}
      </div>

      {/* Note Insertion Action */}
      <WidgetInsertButton
        onInsert={handleInsert}
        label="Insert to note"
        insertedLabel="Inserted to note!"
        className="w-full mt-2"
      />
    </div>
  );
};
