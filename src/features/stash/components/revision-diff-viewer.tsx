import React, { useState, useMemo } from "react";
import { Revision } from "@/features/stash/types/note";
import { computeLineDiff } from "@/features/stash/diff-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatNoteDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

interface RevisionDiffViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  currentPlainText: string;
  revisions: Revision[];
  onRestore: (revisionId: string) => Promise<void> | void;
  onCreateCheckpoint: () => Promise<void> | void;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({
  open,
  onOpenChange,
  currentTitle,
  currentPlainText,
  revisions,
  onRestore,
  onCreateCheckpoint,
}) => {
  // Sort revisions ascending by version (oldest first)
  const sortedRevisions = useMemo(() => {
    return [...revisions].sort((a, b) => a.version - b.version);
  }, [revisions]);

  // Index points to:
  // 0 .. sortedRevisions.length - 1: historical revision
  // sortedRevisions.length: current state
  const totalStates = sortedRevisions.length + 1;
  const [selectedIndex, setSelectedIndex] = useState<number>(() =>
    Math.max(0, sortedRevisions.length - 1)
  );
  const [viewMode, setViewMode] = useState<"diff" | "snapshot">("diff");
  const [isRestoring, setIsRestoring] = useState(false);

  // Sync index when revisions count changes
  React.useEffect(() => {
    if (sortedRevisions.length > 0) {
      setSelectedIndex(sortedRevisions.length - 1);
    } else {
      setSelectedIndex(0);
    }
  }, [sortedRevisions.length]);

  const isCurrent = selectedIndex >= sortedRevisions.length;
  const selectedRevision = !isCurrent ? sortedRevisions[selectedIndex] : null;

  // Compute diff against current note
  const diffResult = useMemo(() => {
    if (!selectedRevision) {
      return { lines: [], stats: { added: 0, removed: 0, unchanged: 0 } };
    }
    return computeLineDiff(selectedRevision.plainText || "", currentPlainText || "");
  }, [selectedRevision, currentPlainText]);

  const handleRestore = async () => {
    if (!selectedRevision) return;
    setIsRestoring(true);
    try {
      await onRestore(selectedRevision.id);
      onOpenChange(false);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between shrink-0 bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <span>Time Machine</span>
                {currentTitle && (
                  <span className="truncate max-w-[200px] font-normal text-muted-foreground text-xs">
                    · {currentTitle}
                  </span>
                )}
                <span className="text-2xs font-mono font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  {revisions.length} {revisions.length === 1 ? "checkpoint" : "checkpoints"}
                </span>
              </DialogTitle>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Scrub through checkpoints and compare changes against current content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onCreateCheckpoint()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Checkpoint</span>
            </button>
          </div>
        </DialogHeader>

        {revisions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <Clock className="h-6 w-6 opacity-60" />
            </div>
            <h4 className="text-sm font-medium text-foreground">No checkpoints recorded yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Stash automatically creates revision snapshots when you make major edits or close notes. You can also save a manual checkpoint anytime.
            </p>
            <button
              type="button"
              onClick={() => void onCreateCheckpoint()}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Initial Checkpoint</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrubber & Timeline Controls */}
            <div className="p-3.5 bg-muted/30 border-b border-border/70 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {isCurrent ? (
                      <span className="flex items-center gap-1.5 text-primary font-semibold">
                        <Sparkles className="h-3.5 w-3.5" />
                        Current State (Latest)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          v{selectedRevision?.version}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {selectedRevision?.createdAt ? formatNoteDate(selectedRevision.createdAt) : ""}
                        </span>
                      </span>
                    )}
                  </span>
                  {selectedRevision?.title && (
                    <span className="text-2xs text-muted-foreground truncate max-w-[200px]">
                      &quot;{selectedRevision.title}&quot;
                    </span>
                  )}
                </div>

                {/* View Mode Toggle */}
                {!isCurrent && (
                  <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 text-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("diff")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors font-medium",
                        viewMode === "diff"
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <GitCompare className="h-3 w-3" />
                      <span>Diff</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("snapshot")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors font-medium",
                        viewMode === "snapshot"
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <FileText className="h-3 w-3" />
                      <span>Snapshot</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Slider scrubber bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Previous revision"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={totalStates - 1}
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <button
                  type="button"
                  disabled={selectedIndex >= totalStates - 1}
                  onClick={() => setSelectedIndex((i) => Math.min(totalStates - 1, i + 1))}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Next revision"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Diff summary stats */}
              {!isCurrent && (
                <div className="flex items-center justify-between text-2xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      +{diffResult.stats.added} lines added in current
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                      -{diffResult.stats.removed} lines removed
                    </span>
                    <span className="text-muted-foreground">
                      {diffResult.stats.unchanged} lines unchanged
                    </span>
                  </div>

                  <span className="font-mono text-2xs opacity-75">
                    Checkpoint {selectedIndex + 1} of {sortedRevisions.length}
                  </span>
                </div>
              )}
            </div>

            {/* Diff / Snapshot Content View */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed select-text bg-surface/30">
              {isCurrent ? (
                <div className="space-y-1">
                  <div className="p-2 mb-3 rounded-lg border border-primary/20 bg-primary/5 text-primary text-2xs flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Viewing live current note state. Drag the scrubber left to travel back in time.</span>
                  </div>
                  <pre className="font-mono whitespace-pre-wrap text-foreground/90 font-normal">
                    {currentPlainText || "(Note is empty)"}
                  </pre>
                </div>
              ) : viewMode === "snapshot" ? (
                <div className="space-y-1">
                  <div className="p-2 mb-3 rounded-lg border border-border/80 bg-muted/30 text-muted-foreground text-2xs flex items-center justify-between">
                    <span>Snapshot of revision v{selectedRevision?.version}</span>
                    <span className="font-mono">{formatNoteDate(selectedRevision?.createdAt || "")}</span>
                  </div>
                  <pre className="font-mono whitespace-pre-wrap text-foreground/90 font-normal">
                    {selectedRevision?.plainText || "(Empty snapshot)"}
                  </pre>
                </div>
              ) : (
                /* Diff View */
                <div className="divide-y divide-border/20 border border-border/60 rounded-md overflow-hidden bg-background">
                  {diffResult.lines.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground font-sans">
                      No text differences found between this checkpoint and current note.
                    </div>
                  ) : (
                    diffResult.lines.map((line, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 px-3 py-1 font-mono text-xs transition-colors",
                          line.type === "added" &&
                            "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-l-2 border-emerald-500",
                          line.type === "removed" &&
                            "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-l-2 border-rose-500 line-through opacity-80",
                          line.type === "unchanged" &&
                            "text-muted-foreground/90 hover:bg-muted/20"
                        )}
                      >
                        <span className="w-5 shrink-0 select-none text-right text-2xs font-semibold opacity-50">
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                          {line.text || " "}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-border flex items-center justify-between shrink-0 bg-surface/40">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Close
              </button>

              {!isCurrent && selectedRevision && (
                <button
                  type="button"
                  onClick={() => void handleRestore()}
                  disabled={isRestoring}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore v{selectedRevision.version}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
