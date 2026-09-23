import React from "react";
import { Note } from "../types/note";
import { NoteColor } from "../types/color";
import { NoteCard } from "./note-card";

interface NoteGridProps {
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

export const NoteGrid: React.FC<NoteGridProps> = ({
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
    <div
      // Cards size themselves: never narrower than ~240px, never a rigid
      // column count that breaks at odd window widths.
      className="grid gap-3 pb-8"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNoteId === note.id}
          onSelect={() => onSelectNote(note.id)}
          onOpenFloating={onOpenFloating}
          onToggleFavorite={onToggleFavorite}
          onTogglePinned={onTogglePinned}
          onChangeColor={onChangeColor}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onTrash={onTrash}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          isBulkSelected={selectedIds?.has(note.id) ?? false}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
};
