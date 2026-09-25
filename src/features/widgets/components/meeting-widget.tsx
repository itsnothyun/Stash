import React, { useState, useEffect } from "react";
import { Plus, Check, Play, Pause, ArrowCounterClockwise as RotateCcw, Clock, Users, Trash as Trash2, Tag } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface Attendee {
  id: string;
  name: string;
  role: string;
  status: "present" | "invited" | "away";
}

interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  completed: boolean;
}

interface MeetingWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

const DEFAULT_ATTENDEES: Attendee[] = [
  { id: "1", name: "Alex", role: "Lead", status: "present" },
  { id: "2", name: "Sarah", role: "Design", status: "present" },
  { id: "3", name: "David", role: "Eng", status: "invited" },
];

const DEFAULT_ACTIONS: ActionItem[] = [
  { id: "1", text: "Finalize window shade blur transition", assignee: "Alex", completed: true },
  { id: "2", text: "Push component-driven template widgets", assignee: "Sarah", completed: false },
  { id: "3", text: "Sync release notes with changelog", assignee: "David", completed: false },
];

export const MeetingWidget: React.FC<MeetingWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [meetingTitle, setMeetingTitle] = useState("Weekly Sync & Architecture");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [attendees, setAttendees] = useState<Attendee[]>(DEFAULT_ATTENDEES);
  const [newAttendeeName, setNewAttendeeName] = useState("");

  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_ACTIONS);
  const [newActionText, setNewActionText] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState("Alex");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  const selectDuration = (minutes: number) => {
    setDurationMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  };

  const toggleAttendeeStatus = (id: string) => {
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const nextStatus: Record<Attendee["status"], Attendee["status"]> = {
          present: "away",
          away: "invited",
          invited: "present",
        };
        return { ...a, status: nextStatus[a.status] };
      })
    );
  };

  const addAttendee = () => {
    if (!newAttendeeName.trim()) return;
    setAttendees((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newAttendeeName.trim(),
        role: "Member",
        status: "present",
      },
    ]);
    setNewAttendeeName("");
  };

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  const addAction = () => {
    if (!newActionText.trim()) return;
    setActions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newActionText.trim(),
        assignee: newActionAssignee.trim() || "Team",
        completed: false,
      },
    ]);
    setNewActionText("");
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secs = String(remainingSeconds % 60).padStart(2, "0");

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const attendeeStr = attendees
      .map((a) => `${a.name} (${a.role} - ${a.status})`)
      .join(", ");
    const actionLines = actions
      .map((a) => `- [${a.completed ? "x" : " "}] @${a.assignee}: ${a.text}`)
      .join("\n");

    const summary = `\n### 🤝 Meeting Minutes — ${meetingTitle}\n*Date: ${dateStr} • Duration: ${durationMinutes}m*\n**Attendees:** ${attendeeStr}\n\n**⚡ Action Items:**\n${actionLines}\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Header & Meeting Duration Timer */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-primary text-xs w-48"
            />
            <div className="font-mono text-xs font-semibold tracking-tight text-foreground">
              {mins}:{secs} remaining
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/50 text-[10px]">
            {[15, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectDuration(m)}
                className={cn(
                  "px-1.5 py-0.5 rounded font-mono transition-colors",
                  durationMinutes === m
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m}m
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsRunning((r) => !r)}
            className="flex h-7 px-2.5 items-center gap-1 rounded-md bg-foreground text-background font-semibold text-[11px] shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            {isRunning ? (
              <>
                <Pause className="h-3 w-3" weight="fill" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" weight="fill" />
                <span>Start</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setRemainingSeconds(durationMinutes * 60);
            }}
            title="Reset timer"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Attendees Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>Attendees ({attendees.filter((a) => a.status === "present").length} Present)</span>
          </span>
          <span className="text-[10px] text-muted-foreground">Click to toggle status</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {attendees.map((attendee) => (
            <button
              key={attendee.id}
              type="button"
              onClick={() => toggleAttendeeStatus(attendee.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all shadow-2xs cursor-pointer border",
                attendee.status === "present" &&
                  "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25",
                attendee.status === "away" &&
                  "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25",
                attendee.status === "invited" &&
                  "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/60"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  attendee.status === "present" && "bg-emerald-500 shadow-xs",
                  attendee.status === "away" && "bg-amber-500",
                  attendee.status === "invited" && "bg-zinc-500"
                )}
              />
              <span>{attendee.name}</span>
              <span className="text-[9px] opacity-70">({attendee.role})</span>
            </button>
          ))}

          {/* Quick add attendee inline */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newAttendeeName}
              onChange={(e) => setNewAttendeeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAttendee()}
              placeholder="+ Name..."
              className="h-6 w-20 rounded-full border border-border bg-background/60 px-2 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground">Action Items</span>
          <span className="font-mono text-muted-foreground">
            {actions.filter((a) => a.completed).length}/{actions.length} Done
          </span>
        </div>

        <div className="space-y-1">
          {actions.map((act) => (
            <div
              key={act.id}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 transition-all",
                act.completed
                  ? "bg-muted/30 border-border/40 opacity-70"
                  : "bg-background/80 border-border shadow-2xs hover:border-border/80"
              )}
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={act.completed}
                  onChange={() => toggleAction(act.id)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors",
                    act.completed
                      ? "bg-foreground border-foreground text-background shadow-xs"
                      : "border-muted-foreground/40 bg-muted/20 hover:border-foreground"
                  )}
                >
                  {act.completed && <Check className="h-2.5 w-2.5" weight="bold" />}
                </div>
                <span
                  className={cn(
                    "text-xs truncate select-none transition-all",
                    act.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground font-medium"
                  )}
                >
                  {act.text}
                </span>
              </label>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />
                  <span>@{act.assignee}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeAction(act.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded"
                  title="Delete action"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add action item row */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAction()}
              placeholder="Add action item... (press Enter)"
              className="flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
            />
            <input
              type="text"
              value={newActionAssignee}
              onChange={(e) => setNewActionAssignee(e.target.value)}
              placeholder="Assignee"
              className="w-20 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
            />
            <button
              type="button"
              onClick={addAction}
              disabled={!newActionText.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-semibold disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert Meeting Minutes"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
