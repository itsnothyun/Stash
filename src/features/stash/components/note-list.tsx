import React from "react";
import { Note } from "../types/note";
import { getColorDot, NoteColor } from "../types/color";
import { deriveNoteTitle, getNotePreview } from "@/lib/utils/text";
import { formatNoteDate } from "@/lib/utils/dates";
import { taskSummary } from "@/features/stash/task-summary";
import { NoteContextMenu } from "./note-context-menu";
import { ExternalLink, Pin, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onOpenFloating: (id: string) => void;
  onToggleFavorite: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onChangeColor: (note: Note, color: NoteColor) => void;
  onDuplicate: (note: Note) => void;
  onArchive: (note: Note) => void;
  onTrash: (note: Note) => void;
  onRestore?: (note: Note) => void;
  onPermanentDelete?: (note: Note) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onOpenFloating,
  onToggleFavorite,
  onTogglePinned,
  onChangeColor,
  onDuplicate,
  onArchive,
  onTrash,
  onRestore,
  onPermanentDelete,
  selectedIds,
  onToggleSelect,
}) => {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-elevated">
      {notes.map((note) => {
        const title = deriveNoteTitle(note.title, note.plainText);
        const progress = taskSummary(note.contentJson);
        const preview = getNotePreview(note.title, note.plainText);
        const isSelected = selectedNoteId === note.id;
        const isBulkSelected = selectedIds?.has(note.id) ?? false;

        return (
          <NoteContextMenu
            key={note.id}
            note={note}
            onOpenFloating={onOpenFloating}
            onToggleFavorite={onToggleFavorite}
            onTogglePinned={onTogglePinned}
            onChangeColor={onChangeColor}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onTrash={onTrash}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          >
            <div
              onClick={(e) => {
                if (e.shiftKey) {
                  onToggleSelect?.(note.id);
                } else {
                  onSelectNote(note.id);
                }
              }}
              onDoubleClick={() => onOpenFloating(note.id)}
              aria-selected={isSelected}
              className={cn(
                "group flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-xs transition-colors",
                isBulkSelected
                  ? "bg-primary/10 ring-inset ring-1 ring-primary/30"
                  : isSelected
                  ? "bg-brand/[0.07]"
                  : "hover:bg-surface-hover"
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: getColorDot(note.color) }}
                title={note.color}
              />

              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="max-w-[220px] truncate font-medium text-foreground">
                  {title}
                </span>
                <span className="flex-1 truncate text-2xs text-muted-foreground">
                  {preview || "No additional text"}
                </span>
              </div>

              {progress.total > 0 && (
                <span className="shrink-0 rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {progress.done}/{progress.total}
                </span>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  {note.tags.slice(0, 2).map((t) => (
                    <span
                      key={t.id}
                      className="rounded-xs border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}

              <span className="w-16 shrink-0 text-right text-2xs text-muted-foreground">
                {formatNoteDate(note.updatedAt)}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                {note.isPinned && (
                  <Pin className="h-3 w-3 fill-current text-muted-foreground" />
                )}
                {note.isFavorite && (
                  <Star className="h-3 w-3 fill-current text-warning" />
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFloating(note.id);
                }}
                aria-label="Open as floating stash"
                className="rounded-xs p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </NoteContextMenu>
        );
      })}
    </div>
  );
};
