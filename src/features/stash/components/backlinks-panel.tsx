import React, { useState, useEffect } from "react";
import { Note } from "../types/note";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { findBacklinksForNote, NoteBacklink } from "../note-links";
import { Link2, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BacklinksPanelProps {
  noteId?: string;
  noteTitle?: string;
  currentNote?: Note;
  onOpenNote?: (id: string) => void;
  className?: string;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  noteId,
  noteTitle,
  currentNote,
  onOpenNote,
  className,
}) => {
  const [backlinks, setBacklinks] = useState<NoteBacklink[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const effectiveId = noteId || currentNote?.id || "";
  const effectiveTitle = noteTitle || currentNote?.title || "";

  useEffect(() => {
    let cancelled = false;
    if (!effectiveId) return;

    stashIpc.listNotes().then((allNotes: Note[]) => {
      if (cancelled || !allNotes) return;
      const targetNote: Note = currentNote || ({ id: effectiveId, title: effectiveTitle } as Note);
      const links = findBacklinksForNote(targetNote, allNotes);
      setBacklinks(links);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveId, effectiveTitle, currentNote]);

  if (backlinks.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-surface/60 overflow-hidden text-xs transition-all",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover/80 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-brand" />
          <span className="font-semibold text-[11px] text-foreground">
            Linked References
          </span>
          <span className="rounded-full bg-brand/10 text-brand px-1.5 py-0.2 text-[10px] font-mono font-bold">
            {backlinks.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="p-2.5 pt-0 space-y-1.5 border-t border-border/50">
          {backlinks.map((link) => (
            <div
              key={link.sourceNoteId}
              onClick={() => {
                if (onOpenNote) {
                  onOpenNote(link.sourceNoteId);
                } else {
                  void stashIpc.openFloatingStash(link.sourceNoteId);
                }
              }}
              className="group flex flex-col gap-1 p-2 rounded-md border border-border/60 bg-background/80 hover:bg-surface-hover hover:border-brand/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-[11px] group-hover:text-brand transition-colors flex items-center gap-1 truncate">
                  <span className="text-brand font-mono font-bold">[[</span>
                  <span className="truncate">{link.sourceNoteTitle}</span>
                  <span className="text-brand font-mono font-bold">]]</span>
                </span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity text-muted-foreground shrink-0 ml-1" />
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-mono">
                {link.previewSnippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
