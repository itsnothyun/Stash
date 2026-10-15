import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  SquaresFour,
  Plus,
  Trash,
  Check,
  Desktop,
  X,
} from "@phosphor-icons/react";
import {
  WorkspacePreset,
  loadWorkspaces,
  saveWorkspace,
  deleteWorkspace,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from "../workspaces";
import { Note } from "../types/note";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";

interface WorkspaceManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  onOpenStash: (noteId: string) => void;
}

export const WorkspaceManagerModal: React.FC<WorkspaceManagerModalProps> = ({
  open,
  onOpenChange,
  notes,
  onOpenStash,
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspacePreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // New Workspace form state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [desc, setDesc] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setWorkspaces(loadWorkspaces());
      setActiveId(getActiveWorkspaceId());
      setSelectedNoteIds(notes.slice(0, 3).map((n) => n.id));
    }
    // Only reset on open — refreshing on every notes change would wipe the in-progress form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = async (ws: WorkspacePreset) => {
    playClickSound();
    setActiveId(ws.id);
    setActiveWorkspaceId(ws.id);

    if (ws.noteIds.length > 0) {
      for (const noteId of ws.noteIds) {
        onOpenStash(noteId);
      }
      toast.success(`Switched to "${ws.name}"`, `Restored ${ws.noteIds.length} notes.`);
    } else {
      // If template workspace with no assigned notes, pick first note
      if (notes.length > 0) {
        onOpenStash(notes[0].id);
      }
      toast.info(`Switched to "${ws.name}"`);
    }

    onOpenChange(false);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playClickSound();
    const created = saveWorkspace(name, icon, desc, selectedNoteIds);
    setWorkspaces(loadWorkspaces());
    setName("");
    setDesc("");
    setIsCreating(false);
    toast.success("Workspace layout created", `"${created.name}" is ready to launch.`);
  };

  const handleDelete = (id: string, name: string) => {
    playClickSound();
    deleteWorkspace(id);
    setWorkspaces(loadWorkspaces());
    if (activeId === id) {
      setActiveId(null);
      setActiveWorkspaceId(null);
    }
    toast.info("Workspace deleted", `Removed "${name}".`);
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[90vw] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
        <DialogHeader className="p-4 pr-12 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SquaresFour className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Desktop Workspaces
              </DialogTitle>
              <div className="text-xs text-muted-foreground">
                Save & switch multi-window desktop spatial presets
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-1"
          >
            {isCreating ? <X className="h-3.5 w-3.5" weight="bold" /> : <Plus className="h-3.5 w-3.5" weight="bold" />}
            <span>{isCreating ? "Cancel" : "New Layout"}</span>
          </button>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
          {/* Creation Form */}
          {isCreating && (
            <form onSubmit={handleSaveNew} className="p-3.5 rounded-xl bg-card border border-border space-y-3">
              <div className="text-xs font-semibold text-foreground">Create Spatial Workspace</div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-10 text-center px-2 py-1.5 text-sm rounded-lg bg-muted border border-border"
                />
                <input
                  type="text"
                  placeholder="Workspace Name (e.g., Code Blitz)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground"
                />
              </div>

              <input
                type="text"
                placeholder="Description / Purpose..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground"
              />

              <div className="space-y-1.5">
                <div className="text-[11px] text-muted-foreground font-medium">
                  Select notes to include in this layout:
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 border border-border/80 rounded-lg p-1 bg-muted/20">
                  {notes.map((n) => {
                    const isSelected = selectedNoteIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => toggleNoteSelection(n.id)}
                        className={cn(
                          "flex items-center space-x-2 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0",
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                          )}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" weight="bold" />}
                        </div>
                        <span className="truncate">{n.title || "Untitled Stash"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                Save Workspace Preset
              </button>
            </form>
          )}

          {/* Workspace List */}
          <div className="space-y-2">
            {workspaces.map((ws) => {
              const isActive = activeId === ws.id;

              return (
                <div
                  key={ws.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border bg-card transition-all group",
                    isActive ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-border/80"
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xl p-2 rounded-lg bg-muted/60">{ws.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-foreground truncate">{ws.name}</span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{ws.description}</p>
                      <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {ws.noteIds.length > 0 ? `${ws.noteIds.length} stashes attached` : "Default layout"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleApply(ws)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                      )}
                    >
                      <Desktop className="h-3.5 w-3.5" />
                      <span>{isActive ? "Re-apply" : "Launch"}</span>
                    </button>

                    {!ws.id.startsWith("ws-focus") && !ws.id.startsWith("ws-dev") && !ws.id.startsWith("ws-finance") && (
                      <button
                        onClick={() => handleDelete(ws.id, ws.name)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
