import React, { useMemo } from "react";
import { Note } from "../types/note";
import { getColorClass, NoteColor } from "../types/color";
import { deriveNoteTitle, getNotePreview } from "@/lib/utils/text";
import { formatNoteDate } from "@/lib/utils/dates";
import { taskPreviewItems, taskSummary } from "@/features/stash/task-summary";
import { isTodayTitle } from "@/features/stash/daily-stash";
import { NoteContextMenu, NoteMenuItems } from "./note-context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColorPicker } from "@/components/shared/color-picker";
import { useUIStore } from "@/stores/ui-store";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  CheckCircle,
  ArrowUpRight,
  DotsThree,
  Palette,
  PushPin,
  Star,
  LockSimple,
  CalendarBlank,
  Ghost,
  Sparkle,
} from "@phosphor-icons/react";
import { extractWidgets } from "@/features/editor/stash-content";
import { NoteWidgetData } from "@/features/widgets/types";
import {
  hasNotePin,
  isNoteSessionUnlocked,
  getNoteDueDate,
  getDueDateStatus,
  getNoteOpacity,
  getNoteEmoji,
  getNotePaper,
  getPaperPatternStyle,
  getNoteFont,
  FONT_PERSONAS,
  getNoteFrame,
  getFrameStyleClass,
} from "@/features/stash/note-meta";
import { cn } from "@/lib/utils/cn";

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpenFloating: (noteId: string) => void;
  onToggleFavorite: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onChangeColor: (note: Note, color: NoteColor) => void;
  onDuplicate: (note: Note) => void;
  onArchive: (note: Note) => void;
  onTrash: (note: Note) => void;
  onRestore?: (note: Note) => void;
  onPermanentDelete?: (note: Note) => void;
  isBulkSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onSelect,
  onOpenFloating,
  onToggleFavorite,
  onTogglePinned,
  onChangeColor,
  onDuplicate,
  onArchive,
  onTrash,
  onRestore,
  onPermanentDelete,
  isBulkSelected = false,
  onToggleSelect,
}) => {
  const displayTitle = deriveNoteTitle(note.title, note.plainText);
  const colorClasses = getColorClass(note.color);
  const progress = useMemo(() => taskSummary(note.contentJson), [note.contentJson]);
  const tasks = useMemo(() => taskPreviewItems(note.contentJson), [note.contentJson]);
  const previewText = getNotePreview(note.title, note.plainText);
  const wordCount = useMemo(() => {
    if (!note.plainText?.trim()) return 0;
    return note.plainText.trim().split(/\s+/).filter(Boolean).length;
  }, [note.plainText]);
  const readMins = Math.max(1, Math.round(wordCount / 200));

  const isLocked = hasNotePin(note.id);
  const isUnlocked = isNoteSessionUnlocked(note.id);
  const dueDate = getNoteDueDate(note.id);
  const dueDateStatus = getDueDateStatus(dueDate);
  const opacity = getNoteOpacity(note.id);
  const emoji = getNoteEmoji(note.id);
  const paper = getNotePaper(note.id);
  const font = getNoteFont(note.id);
  const frame = getNoteFrame(note.id);
  const fontPersona = FONT_PERSONAS.find((f) => f.id === font);
  const isToday = useMemo(() => isTodayTitle(note.title), [note.title]);

  const {
    theme,
    cardDensity,
    iconSet,
    showWordCount,
    showRelativeTime,
    showColorRibbon,
    showWidgetBadges,
  } = useUIStore();
  const isColorful = iconSet === "colorful";
  const isTerminal =
    theme === "terminal" ||
    theme === "amber-crt" ||
    theme === "cyberpunk" ||
    theme === "e-ink";

  const displayDate = useMemo(() => {
    if (!showRelativeTime) return formatNoteDate(note.updatedAt);
    try {
      const d = new Date(note.updatedAt);
      const diffHours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return formatDistanceToNow(d, { addSuffix: true });
      }
      return formatNoteDate(note.updatedAt);
    } catch {
      return formatNoteDate(note.updatedAt);
    }
  }, [note.updatedAt, showRelativeTime]);

  const attachedWidgets = useMemo(
    () => extractWidgets<NoteWidgetData>(note.contentJson),
    [note.contentJson]
  );

  const noteActionProps = {
    note,
    onOpenFloating,
    onToggleFavorite,
    onTogglePinned,
    onChangeColor,
    onDuplicate,
    onArchive,
    onTrash,
    onRestore,
    onPermanentDelete,
  };

  return (
    <NoteContextMenu {...noteActionProps}>
      <article
        onClick={(e) => {
          if (e.shiftKey) {
            e.preventDefault();
            onToggleSelect?.(note.id);
            return;
          }
          onSelect?.();
        }}
        onDoubleClick={() => onOpenFloating(note.id)}
          aria-selected={isSelected}
          className={cn(
            "group relative flex cursor-pointer select-none flex-col justify-between rounded-lg border overflow-hidden",
            isTerminal && "font-mono border-opacity-70",
            cardDensity === "compact"
              ? "min-h-[116px] p-3"
              : cardDensity === "spacious"
              ? "min-h-[180px] p-5"
              : "min-h-[148px] p-4",
            showColorRibbon && "border-l-[3.5px]",
            "transition-[transform,box-shadow,border-color] duration-200 ease-soft",
            colorClasses,
            getFrameStyleClass(frame),
            isBulkSelected
              ? "shadow-sm ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
              : isSelected
              ? "shadow-sm ring-2 ring-brand ring-offset-2 ring-offset-background"
              : "hover:-translate-y-px hover:shadow-sm"
          )}
        >
          {/* Tactile Paper Texture preview backdrop */}
          {paper !== "plain" && (
            <div
              className="pointer-events-none absolute inset-0 select-none text-current rounded-lg z-0"
              style={getPaperPatternStyle(paper)}
              aria-hidden="true"
            />
          )}

          {/* Bulk-select indicator */}
          {isBulkSelected && (
            <span className="absolute left-2 top-2 z-10">
              <CheckCircle className="h-4 w-4 text-foreground drop-shadow-sm" weight="fill" />
            </span>
          )}
          {/* Title row */}
          <div className="relative z-10 flex min-w-0 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold leading-snug tracking-tight flex items-center gap-1.5">
                {emoji && (
                  <span className="shrink-0 text-sm leading-none" title={`Emoji: ${emoji}`}>
                    {emoji}
                  </span>
                )}
                <span className="truncate">
                  {isTerminal ? `> ${displayTitle}` : displayTitle}
                </span>
              </h3>
              <div className="flex shrink-0 items-center gap-1 opacity-60">
                {isLocked && (
                  <span title={isUnlocked ? "PIN protected (unlocked)" : "PIN locked"}>
                    <LockSimple className="h-3 w-3" weight="regular" />
                  </span>
                )}
                {opacity < 100 && (
                  <span title={`Ghost Mode (${opacity}%)`} className="text-foreground">
                    <Ghost className="h-3 w-3" weight="regular" />
                  </span>
                )}
                {note.isPinned && (
                  <PushPin
                    className={cn("h-3 w-3", isColorful ? "text-amber-500" : "text-foreground")}
                    weight="fill"
                  />
                )}
                {note.isFavorite && (
                  <Star
                    className={cn("h-3 w-3", isColorful ? "text-amber-400" : "text-foreground")}
                    weight="fill"
                  />
                )}
              </div>
            </div>

            {isLocked && !isUnlocked ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 my-1 rounded-md bg-foreground/[0.04] border border-foreground/10 text-center select-none backdrop-blur-[2px]">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shadow-xs",
                    isColorful
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-foreground/[0.08] text-foreground/80"
                  )}
                >
                  <LockSimple className="h-3 w-3" weight={isColorful ? "bold" : "regular"} />
                </div>
                <span className="text-[11px] font-medium tracking-tight text-foreground/85">
                  Confidential Stash
                </span>
                <span className="text-[10px] text-muted-foreground/75">
                  Double-click to unlock with PIN
                </span>
              </div>
            ) : tasks.length > 0 ? (
              <ul className="space-y-1">
                {tasks.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[2px] flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border",
                        item.done
                          ? "border-current bg-current/15 opacity-70"
                          : "border-current opacity-35"
                      )}
                    >
                      {item.done && <Check className="h-2 w-2" weight="bold" />}
                    </span>
                    <span
                      className={cn(
                        "truncate text-2xs leading-[1.35]",
                        item.done ? "line-through opacity-45" : "opacity-75"
                      )}
                    >
                      {item.text || "Empty task"}
                    </span>
                  </li>
                ))}
                {tasks.length > 4 && (
                  <li className="pl-4 text-2xs opacity-45">+{tasks.length - 4} more</li>
                )}
              </ul>
            ) : previewText ? (
              <p
                className={cn(
                  cardDensity === "compact"
                    ? "line-clamp-1"
                    : cardDensity === "spacious"
                    ? "line-clamp-4"
                    : "line-clamp-3",
                  "break-words text-2xs leading-relaxed opacity-70",
                  fontPersona?.fontClass
                )}
              >
                {previewText}
              </p>
            ) : (
              <p className="text-2xs italic opacity-45">Empty note</p>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-3 space-y-2">
            {progress.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-current/15">
                  <div
                    className="h-full rounded-full bg-current opacity-60 transition-[width] duration-300 ease-soft"
                    style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums opacity-55">
                  {progress.done}/{progress.total}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-current/10 pt-2">
              <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                <span className="shrink-0 text-[10px] font-medium opacity-55">
                  {displayDate}
                </span>
                {isToday && (
                  <span
                    className="liquid-glass-shell rounded-full p-[1px] shrink-0 select-none"
                    title="Today's Daily Scratchpad"
                  >
                    <span className="liquid-glass-track rounded-full px-1.5 py-0.2 flex items-center gap-1 text-[9px] font-semibold text-foreground">
                      <span className="glass-active-beacon h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                      <span>Today</span>
                    </span>
                  </span>
                )}
                {showWidgetBadges && dueDateStatus && (
                  <span
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight",
                      isColorful
                        ? dueDateStatus.isOverdue
                          ? "bg-destructive/20 text-destructive font-semibold border border-destructive/30"
                          : dueDateStatus.isToday
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : "bg-current/10 opacity-75"
                        : dueDateStatus.isOverdue
                        ? "bg-foreground/15 text-foreground font-semibold border border-foreground/20"
                        : "bg-foreground/10 text-foreground/80 border border-foreground/10"
                    )}
                    title={`Due: ${dueDateStatus.label}`}
                  >
                    <CalendarBlank className="h-2.5 w-2.5" weight="regular" />
                    <span>{dueDateStatus.label}</span>
                  </span>
                )}
                {showWidgetBadges && opacity < 100 && (
                  <span
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight",
                      isColorful
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "bg-foreground/10 text-foreground border border-foreground/15"
                    )}
                    title={`Ghost Mode (${opacity}%)`}
                  >
                    <Ghost className="h-2.5 w-2.5" weight="regular" />
                    <span>{opacity}%</span>
                  </span>
                )}
                {showWidgetBadges && attachedWidgets.length > 0 && (
                  <span
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight",
                      isColorful
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                        : "bg-foreground/10 text-foreground border border-foreground/15"
                    )}
                    title={`${attachedWidgets.length} attached widget${attachedWidgets.length > 1 ? "s" : ""}: ${attachedWidgets.map((w) => w.title).join(", ")}`}
                  >
                    <Sparkle className="h-2.5 w-2.5" weight="regular" />
                    <span>{attachedWidgets.length} {attachedWidgets.length === 1 ? "widget" : "widgets"}</span>
                  </span>
                )}
                {showWordCount && wordCount > 0 && (
                  <span className="shrink-0 text-[10px] tabular-nums opacity-40">
                    {wordCount}w · {readMins}m
                  </span>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="truncate rounded-xs bg-current/10 px-1.5 py-px text-[10px] font-medium opacity-70"
                      >
                        #{tag.name}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] opacity-50">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Contextual actions — hidden until they're wanted */}
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFloating(note.id);
                  }}
                  aria-label="Open as floating stash"
                  className="flex h-6 w-6 items-center justify-center rounded-xs opacity-60 transition-[background-color,opacity] hover:bg-current/10 hover:opacity-100"
                >
                  <ArrowUpRight className="h-3 w-3" weight="bold" />
                </button>

                <ColorPicker
                  currentColor={note.color}
                  onSelectColor={(c) => onChangeColor(note, c)}
                  align="end"
                >
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Change color"
                    className="flex h-6 w-6 items-center justify-center rounded-xs opacity-60 transition-[background-color,opacity] hover:bg-current/10 hover:opacity-100"
                  >
                    <Palette className="h-3 w-3" weight="regular" />
                  </button>
                </ColorPicker>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More actions"
                      className="flex h-6 w-6 items-center justify-center rounded-xs opacity-60 transition-[background-color,opacity] hover:bg-current/10 hover:opacity-100"
                    >
                      <DotsThree className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <NoteMenuItems {...noteActionProps} isContextMenu={false} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </article>
    </NoteContextMenu>
  );
};
