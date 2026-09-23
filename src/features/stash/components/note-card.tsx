import React, { useMemo } from "react";
import { Note } from "../types/note";
import { getColorClass, NoteColor } from "../types/color";
import { deriveNoteTitle, getNotePreview } from "@/lib/utils/text";
import { formatNoteDate } from "@/lib/utils/dates";
import { taskPreviewItems, taskSummary } from "@/features/stash/task-summary";
import { NoteContextMenu, NoteMenuItems } from "./note-context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColorPicker } from "@/components/shared/color-picker";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  Palette,
  Pin,
  Star,
  Lock,
  CalendarClock,
  Ghost,
} from "lucide-react";
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
            "group relative flex min-h-[148px] cursor-pointer select-none flex-col justify-between rounded-lg border p-4 overflow-hidden",
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
              <CheckCircle2 className="h-4 w-4 text-primary drop-shadow-sm" />
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
                <span className="truncate">{displayTitle}</span>
              </h3>
              <div className="flex shrink-0 items-center gap-1 opacity-60">
                {isLocked && (
                  <span title={isUnlocked ? "PIN protected (unlocked)" : "PIN locked"}>
                    <Lock className="h-3 w-3" />
                  </span>
                )}
                {opacity < 100 && (
                  <span title={`Ghost Mode (${opacity}%)`} className="text-primary">
                    <Ghost className="h-3 w-3" />
                  </span>
                )}
                {note.isPinned && <Pin className="h-3 w-3 fill-current" />}
                {note.isFavorite && (
                  <Star className="h-3 w-3 fill-current text-warning opacity-100" />
                )}
              </div>
            </div>

            {isLocked && !isUnlocked ? (
              <p className="flex items-center gap-1.5 text-2xs italic opacity-60 py-1">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Protected stash · PIN locked</span>
              </p>
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
                      {item.done && <Check className="h-2 w-2 stroke-[3]" />}
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
              <p className={cn("line-clamp-3 break-words text-2xs leading-relaxed opacity-70", fontPersona?.fontClass)}>
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
                  {formatNoteDate(note.updatedAt)}
                </span>
                {dueDateStatus && (
                  <span
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight",
                      dueDateStatus.isOverdue
                        ? "bg-destructive/20 text-destructive font-semibold"
                        : dueDateStatus.isToday
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : "bg-current/10 opacity-75"
                    )}
                    title={`Due: ${dueDateStatus.label}`}
                  >
                    <CalendarClock className="h-2.5 w-2.5" />
                    <span>{dueDateStatus.label}</span>
                  </span>
                )}
                {opacity < 100 && (
                  <span
                    className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight bg-primary/15 text-primary border border-primary/20"
                    title={`Ghost Mode (${opacity}%)`}
                  >
                    <Ghost className="h-2.5 w-2.5" />
                    <span>{opacity}%</span>
                  </span>
                )}
                {wordCount > 0 && (
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
                  <ExternalLink className="h-3 w-3" />
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
                    <Palette className="h-3 w-3" />
                  </button>
                </ColorPicker>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More actions"
                      className="flex h-6 w-6 items-center justify-center rounded-xs opacity-60 transition-[background-color,opacity] hover:bg-current/10 hover:opacity-100"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
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
