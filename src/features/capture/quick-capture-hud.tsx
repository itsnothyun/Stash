import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NOTE_COLORS, NoteColor } from "@/features/stash/types/color";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { Note } from "@/features/stash/types/note";
import { findTodayNote, buildTodayStashContent } from "@/features/stash/daily-stash";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import {
  Sparkles,
  Calendar,
  Layers,
  Archive,
  Pin,
  Star,
  CornerDownLeft,
  X,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CaptureMode = "float" | "daily" | "inbox";

interface QuickCaptureHudProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated?: (note: Note) => void;
}

export const QuickCaptureHud: React.FC<QuickCaptureHudProps> = ({
  open,
  onOpenChange,
  onNoteCreated,
}) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("Sand");
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mode, setMode] = useState<CaptureMode>("float");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens & reset state
  useEffect(() => {
    if (open) {
      setContent("");
      setTitle("");
      setIsPinned(false);
      setIsFavorite(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Extract hashtags like #meeting #todo
  const extractedTags = React.useMemo(() => {
    const matches = content.match(/#[a-zA-Z0-9_-]+/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.substring(1))));
  }, [content]);

  const handleCapture = async () => {
    const trimmed = content.trim();
    if (!trimmed && !title.trim()) {
      toast.show({ message: "Note is empty", description: "Write something before capturing." });
      return;
    }

    setIsSubmitting(true);
    try {
      playClickSound();

      if (mode === "daily") {
        // Append to today's daily note
        const allNotes = await stashIpc.listNotes();
        const todayNote = findTodayNote(allNotes);
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const bulletText = `- **[${timeStr}]** ${trimmed || title.trim()}\n`;

        if (todayNote) {
          const updatedPlain = (todayNote.plainText || "") + "\n" + bulletText;
          const updated = await stashIpc.updateNote({
            id: todayNote.id,
            plainText: updatedPlain,
          });
          onNoteCreated?.(updated);
          toast.show({
            message: "Appended to Today's Daily Stash",
            description: `Added quick log at ${timeStr}`,
          });
        } else {
          // Create today's note and append
          const { title: dailyTitle, plainText: initialPlain } = buildTodayStashContent();
          const combined = initialPlain + "\n" + bulletText;
          const created = await stashIpc.createNote({
            title: dailyTitle,
            plainText: combined,
            color: "Sand",
          });
          onNoteCreated?.(created);
          toast.show({
            message: "Created Today's Note & Logged thought",
          });
        }
      } else if (mode === "inbox") {
        // Save silently to library
        const created = await stashIpc.createNote({
          title: title.trim() || undefined,
          plainText: trimmed,
          color: selectedColor,
          isPinned,
          isFavorite,
        });
        onNoteCreated?.(created);
        toast.show({
          message: "Captured to Library",
          description: "Saved silently without opening a floating window.",
        });
      } else {
        // "float" mode: create and open floating window
        const created = await createAndOpenStash({
          title: title.trim() || undefined,
          plainText: trimmed,
          color: selectedColor,
          isPinned,
          isFavorite,
          tagNames: extractedTags.length > 0 ? extractedTags : undefined,
        });
        onNoteCreated?.(created);
        toast.show({
          message: "Stash created & opened",
        });
      }

      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to capture stash", String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleCapture();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl">
        {/* Spotlight Navigation Tabs */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("float")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium transition-colors cursor-pointer",
                mode === "float"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <Layers className="h-3 w-3" />
              <span>Floating Stash</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("daily")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium transition-colors cursor-pointer",
                mode === "daily"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>Append to Today</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("inbox")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium transition-colors cursor-pointer",
                mode === "inbox"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <Archive className="h-3 w-3" />
              <span>Silent Library</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
          {mode !== "daily" && (
            <input
              type="text"
              placeholder="Title (optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold placeholder:text-muted-foreground/60 outline-none text-foreground"
            />
          )}

          <textarea
            ref={textareaRef}
            rows={4}
            placeholder={
              mode === "daily"
                ? "Append quick thought or check-in to today's daily log..."
                : "Type your thought, paste snippet, or type #tags..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed"
          />

          {/* Extracted tags preview */}
          {extractedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                <Hash className="h-2.5 w-2.5" /> Tags:
              </span>
              {extractedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-2xs font-mono bg-primary/10 text-primary border border-primary/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Color & Flag Pickers (Hidden for daily mode) */}
          {mode !== "daily" && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setSelectedColor(c.id)}
                    className={cn(
                      "h-4 w-4 rounded-full border transition-all cursor-pointer",
                      selectedColor === c.id
                        ? "scale-125 ring-2 ring-primary ring-offset-1 border-foreground/30"
                        : "border-black/20 dark:border-white/20 hover:scale-110 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.dotColor }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Pin to top"
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    "p-1.5 rounded-md text-xs transition-colors cursor-pointer",
                    isPinned
                      ? "bg-amber-500/20 text-amber-500"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  )}
                >
                  <Pin className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="Mark as Favorite"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    "p-1.5 rounded-md text-xs transition-colors cursor-pointer",
                    isFavorite
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  )}
                >
                  <Star className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls & shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/60">
          <div className="flex items-center gap-2 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono">
                Enter
              </kbd>
              <span>to capture</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono">
                Esc
              </kbd>
              <span>cancel</span>
            </span>
          </div>

          <button
            type="button"
            disabled={isSubmitting || (!content.trim() && !title.trim())}
            onClick={() => void handleCapture()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>
              {mode === "daily"
                ? "Append to Daily"
                : mode === "inbox"
                ? "Save to Library"
                : "Open Stash"}
            </span>
            <CornerDownLeft className="h-3 w-3 opacity-70" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
