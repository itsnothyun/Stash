import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarBlank as CalendarClock,
  Calendar,
  PencilSimple as Pencil,
  CopySimple as Copy,
  Check,
  Flame,
  Lightning as Zap,
  Confetti as PartyPopper,
  Sparkle as Sparkles,
  X,
  ArrowCounterClockwise as RotateCcw,
} from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface CountdownWidgetProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  onInsertToNote?: (text: string) => void;
  className?: string;
}

const LABEL_SUGGESTIONS = [
  "🚀 Product Launch",
  "📅 Deadline",
  "🎂 Birthday",
  "✈️ Vacation",
  "🎯 Goal",
  "🎓 Exam",
];

const PRESETS = [
  { label: "+1 Hour", key: "1h" },
  { label: "Tonight", key: "tonight" },
  { label: "Tomorrow", key: "tomorrow" },
  { label: "+3 Days", key: "3d" },
  { label: "+1 Week", key: "1w" },
  { label: "Month End", key: "endOfMonth" },
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatToLocalDateTimeInput(date: Date): string {
  const padTwo = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = padTwo(date.getMonth() + 1);
  const dd = padTwo(date.getDate());
  const hh = padTwo(date.getHours());
  const mm = padTwo(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function getPresetDate(preset: (typeof PRESETS)[number]["key"]): string {
  const d = new Date();
  switch (preset) {
    case "1h":
      d.setHours(d.getHours() + 1);
      break;
    case "tonight":
      d.setHours(23, 59, 0, 0);
      break;
    case "tomorrow":
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      break;
    case "3d":
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
      break;
    case "1w":
      d.setDate(d.getDate() + 7);
      d.setHours(12, 0, 0, 0);
      break;
    case "endOfMonth":
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 0, 0);
      break;
  }
  return formatToLocalDateTimeInput(d);
}

function formatTargetDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isThisYear = d.getFullYear() === now.getFullYear();
    const datePart = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: isThisYear ? undefined : "numeric",
    });
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} • ${timePart}`;
  } catch {
    return iso;
  }
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  config = {},
  onConfigChange,
  onInsertToNote,
  className,
}) => {
  const targetIso: string = config.targetIso ?? "";
  const createdIso: string = config.createdIso ?? "";
  const label: string = config.label ?? "Countdown";

  const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState(!targetIso);
  const [draftDate, setDraftDate] = useState(() => {
    if (!targetIso) return "";
    try {
      return formatToLocalDateTimeInput(new Date(targetIso));
    } catch {
      return targetIso.slice(0, 16);
    }
  });
  const [draftLabel, setDraftLabel] = useState(label);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const remaining = useMemo(() => {
    if (!targetIso) return null;
    const targetMs = new Date(targetIso).getTime();
    if (isNaN(targetMs)) return null;
    const diff = targetMs - now;
    if (diff <= 0) {
      return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalDiffMs: 0 };
    }
    const totalSeconds = Math.floor(diff / 1000);
    return {
      done: false,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalDiffMs: diff,
    };
  }, [targetIso, now]);

  const progressPercent = useMemo(() => {
    if (!targetIso) return 0;
    const targetMs = new Date(targetIso).getTime();
    if (isNaN(targetMs)) return 0;
    if (now >= targetMs) return 100;
    const createdMs = createdIso
      ? new Date(createdIso).getTime()
      : targetMs - 7 * 86400 * 1000;
    const total = targetMs - createdMs;
    if (total <= 0) return 0;
    const elapsed = now - createdMs;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [targetIso, createdIso, now]);

  const isUrgent = remaining && !remaining.done && remaining.totalDiffMs <= 3600 * 1000; // < 1 hour
  const isToday =
    remaining && !remaining.done && remaining.totalDiffMs <= 24 * 3600 * 1000 && !isUrgent; // < 24 hours

  const handleSave = () => {
    if (!draftDate) return;
    const targetDateObj = new Date(draftDate);
    onConfigChange?.({
      ...config,
      targetIso: targetDateObj.toISOString(),
      label: draftLabel.trim() || "Countdown",
      createdIso: createdIso || new Date().toISOString(),
    });
    setEditing(false);
  };

  const handleInsert = () => {
    if (!remaining || !targetIso || !onInsertToNote) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTarget = formatTargetDate(targetIso);

    let summary = "";
    if (remaining.done) {
      summary = `\n### ⏳ Countdown Complete: ${label}
> *Target Reached on ${formattedTarget} • Checked on ${dateStr} at ${timeStr}*

- **Status**: 🎉 **Target event has arrived!**
- **Target Date**: \`${formattedTarget}\`\n`;
    } else {
      const parts: string[] = [];
      if (remaining.days > 0) parts.push(`${remaining.days}d`);
      if (remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.hours}h`);
      parts.push(`${remaining.minutes}m`);
      if (remaining.days === 0 && remaining.hours === 0) parts.push(`${remaining.seconds}s`);

      summary = `\n### ⏳ Countdown: ${label}
> *Target: ${formattedTarget} • Checked on ${dateStr} at ${timeStr}*

- **Remaining**: **\`${parts.join(" ")}\`**
- **Progress**: \`${Math.round(progressPercent)}%\` elapsed\n`;
    }

    onInsertToNote(summary);
  };

  const handleCopy = async () => {
    if (!remaining || !targetIso) return;
    const formattedTarget = formatTargetDate(targetIso);
    const text = remaining.done
      ? `Countdown "${label}" reached on ${formattedTarget}!`
      : `Countdown "${label}": ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m ${remaining.seconds}s remaining (Target: ${formattedTarget})`;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (editing) {
    return (
      <div className={cn("select-none w-full min-w-[260px] p-3 text-foreground flex flex-col gap-3", className)}>
        {/* Form Header */}
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-foreground">
              <CalendarClock className="h-3 w-3" />
            </div>
            <span>{targetIso ? "Edit Countdown" : "Set Countdown"}</span>
          </div>
          {targetIso && (
            <button
              type="button"
              onClick={() => {
                setDraftDate(targetIso ? formatToLocalDateTimeInput(new Date(targetIso)) : "");
                setDraftLabel(label);
                setEditing(false);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Event Label Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Event Name
          </label>
          <input
            type="text"
            placeholder="e.g. Product Launch, Birthday..."
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            className="w-full rounded-lg border border-border/80 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {/* Quick Label Chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {LABEL_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setDraftLabel(sug)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Target Date & Quick Presets */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Target Date & Time
          </label>
          <input
            type="datetime-local"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="w-full rounded-lg border border-border/80 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDraftDate(getPresetDate(p.key))}
                className="text-[10.5px] py-1 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors text-center"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!draftDate}
            className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{targetIso ? "Save Changes" : "Start Countdown"}</span>
          </button>
          {targetIso && (
            <button
              type="button"
              onClick={() => {
                setDraftDate(targetIso ? formatToLocalDateTimeInput(new Date(targetIso)) : "");
                setDraftLabel(label);
                setEditing(false);
              }}
              className="h-8 px-3 rounded-lg border border-border/80 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!remaining) return null;

  return (
    <div className={cn("select-none w-full min-w-[260px] p-3 text-foreground flex flex-col gap-2.5", className)}>
      {/* Header Row: Event title, status badge & edit button */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-md shrink-0 bg-muted text-foreground"
          >
            {remaining.done ? (
              <PartyPopper className="h-3 w-3" />
            ) : isUrgent ? (
              <Flame className="h-3 w-3" />
            ) : isToday ? (
              <Zap className="h-3 w-3" />
            ) : (
              <CalendarClock className="h-3 w-3" />
            )}
          </div>
          <span
            className="truncate text-xs font-semibold text-foreground tracking-tight"
            title={label}
          >
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!remaining.done && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight inline-flex items-center gap-1",
                isUrgent
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse"
                  : isToday
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-muted/70 text-muted-foreground text-[9.5px]"
              )}
            >
              {(isUrgent || isToday) && (
                <span className="h-1.5 w-1.5 rounded-full bg-current inline-block" />
              )}
              {isUrgent ? "Ending soon" : isToday ? "Today" : `${remaining.days}d left`}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setDraftDate(targetIso ? formatToLocalDateTimeInput(new Date(targetIso)) : "");
              setDraftLabel(label);
              setEditing(true);
            }}
            title="Edit countdown"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Display: 4-digit grid or Celebration card */}
      {remaining.done ? (
        <div className="py-3 px-3 flex flex-col items-center justify-center text-center rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1.5 animate-bounce">
            <PartyPopper className="h-4 w-4" />
          </div>
          <div className="text-sm font-bold text-foreground">
            Target Reached! 🎉
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            "{label}" has arrived!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: remaining.days, label: "Days", isDays: true },
            { val: remaining.hours, label: "Hours" },
            { val: remaining.minutes, label: "Mins" },
            { val: remaining.seconds, label: "Secs", isSec: true },
          ].map(({ val, label: unitLabel, isDays, isSec }) => (
            <div
              key={unitLabel}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all",
                "bg-black/[0.03] dark:bg-white/[0.05] border border-border/50 shadow-2xs",
                isUrgent && isSec ? "border-rose-500/40 bg-rose-500/[0.06]" : ""
              )}
            >
              <span
                className={cn(
                  "font-mono font-bold tracking-tight text-foreground tabular-nums leading-none",
                  isDays && val >= 100
                    ? "text-base sm:text-lg"
                    : "text-xl sm:text-2xl"
                )}
              >
                {isDays ? val : pad(val)}
              </span>
              <span className="mt-1 text-[9px] uppercase font-semibold tracking-wider text-muted-foreground/75 leading-none">
                {unitLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar & Target Date Info */}
      <div className="space-y-1">
        <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              remaining.done
                ? "bg-emerald-500"
                : isUrgent
                ? "bg-rose-500"
                : isToday
                ? "bg-amber-500"
                : "bg-primary"
            )}
            style={{ width: `${remaining.done ? 100 : progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/75 px-0.5 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 opacity-70" />
            <span>{formatTargetDate(targetIso)}</span>
          </span>
          <span>{remaining.done ? "100%" : `${Math.round(progressPercent)}% elapsed`}</span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
        {onInsertToNote && (
          <WidgetInsertButton
            onInsert={handleInsert}
            label="Insert to note"
            insertedLabel="Inserted to note!"
            className="flex-1"
          />
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="h-7.5 px-2.5 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-colors flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground shrink-0"
          title="Copy countdown to clipboard"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 text-foreground" weight="bold" />
              <span className="text-foreground font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>

        {remaining.done && (
          <button
            type="button"
            onClick={() => {
              setDraftDate("");
              setDraftLabel(label);
              setEditing(true);
            }}
            className="h-7.5 px-2 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            title="Reset countdown"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
