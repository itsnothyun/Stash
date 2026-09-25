import React, { useState } from "react";
import { Plus, X, Flame, Check } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface Habit {
  id: string;
  name: string;
  days: boolean[]; // Mon - Sun (7 days)
}

interface HabitsWidgetProps {
  initialHabits?: Habit[];
  onInsertToNote?: (text: string) => void;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Drink 2L Water", days: [true, true, true, false, false, false, false] },
  { id: "2", name: "Commit Code", days: [true, true, true, true, false, false, false] },
  { id: "3", name: "Read 20 mins", days: [false, true, true, false, false, false, false] },
];

export const HabitsWidget: React.FC<HabitsWidgetProps> = ({
  initialHabits = DEFAULT_HABITS,
  onInsertToNote,
}) => {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [newName, setNewName] = useState("");

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits([
      ...habits,
      { id: Date.now().toString(), name: newName.trim(), days: [false, false, false, false, false, false, false] },
    ]);
    setNewName("");
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    setHabits(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const nextDays = [...h.days];
        nextDays[dayIndex] = !nextDays[dayIndex];
        return { ...h, days: nextDays };
      })
    );
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  const calculateStreak = (days: boolean[]) => {
    return days.filter(Boolean).length;
  };

  const handleCopySummary = () => {
    if (!onInsertToNote || habits.length === 0) return;

    const totalPossible = habits.length * 7;
    const totalCompleted = habits.reduce((acc, h) => acc + calculateStreak(h.days), 0);
    const overallPct = Math.round((totalCompleted / totalPossible) * 100);

    const nowStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const rows = habits
      .map((h) => {
        const streak = calculateStreak(h.days);
        const pct = Math.round((streak / 7) * 100);
        const dayChecks = h.days.map((d) => (d ? "✅" : "⬜")).join(" ");
        return `- **${h.name}**: ${streak}/7 days (${pct}%) • [ ${dayChecks} ]`;
      })
      .join("\n");

    const summary = `\n### 🔥 Habit Tracker — Weekly Streak Report
> *${habits.length} habits • ${totalCompleted}/${totalPossible} check-ins (${overallPct}% completion) • Logged on ${dateStr} at ${nowStr}*

${rows}

*Legend: Mon → Sun (✅ Done • ⬜ Missed)*\n`;

    onInsertToNote(summary);
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 text-xs">
      {/* Quick Add Bar */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="New daily habit…"
          className="flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          onClick={addHabit}
          aria-label="Add habit"
          className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Habit Rows */}
      <div className="flex flex-col gap-1.5 mt-1">
        {/* Days Header */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground/70 px-1">
          <span>Habit</span>
          <div className="flex items-center gap-1.5 mr-6">
            {DAYS.map((d, idx) => (
              <span key={idx} className="w-4 text-center font-mono">{d}</span>
            ))}
          </div>
        </div>

        {habits.map((habit) => {
          const streak = calculateStreak(habit.days);
          return (
            <div
              key={habit.id}
              className="group flex items-center justify-between rounded-md border border-border/60 bg-card p-1.5 shadow-2xs hover:border-border transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                <span className="text-2xs font-medium text-foreground truncate" title={habit.name}>
                  {habit.name}
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[9px] font-mono font-medium text-foreground shrink-0">
                    <Flame className="h-2.5 w-2.5" weight="fill" /> {streak}d
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {habit.days.map((checked, dayIdx) => (
                  <button
                    key={dayIdx}
                    onClick={() => toggleDay(habit.id, dayIdx)}
                    title={`${DAYS[dayIdx]}: ${checked ? "Done" : "Pending"}`}
                    aria-label={`${habit.name} - ${DAYS[dayIdx]}: ${checked ? "Done" : "Pending"}`}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[9px] transition-colors",
                      checked
                        ? "bg-foreground text-background font-bold shadow-xs"
                        : "border border-border/80 hover:border-primary/60 bg-muted/30 text-transparent"
                    )}
                  >
                    <Check className="h-2.5 w-2.5" weight="bold" />
                  </button>
                ))}

                <button
                  onClick={() => removeHabit(habit.id)}
                  title="Remove habit"
                  aria-label="Remove habit"
                  className="rounded p-0.5 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {onInsertToNote && habits.length > 0 && (
        <WidgetInsertButton
          onInsert={handleCopySummary}
          label="Insert to note"
          insertedLabel="Inserted to note!"
          className="mt-2.5"
        />
      )}
    </div>
  );
};
