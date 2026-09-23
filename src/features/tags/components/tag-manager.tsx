import React, { useState } from "react";
import { Tag } from "@/features/stash/types/note";
import { Plus, X, Tag as TagIcon, Copy, Trash2, Filter } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface TagManagerProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
  onCreateTag: (name: string) => void;
  onDeleteTag: (id: string) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  selectedTagId,
  onSelectTag,
  onCreateTag,
  onDeleteTag,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (trimmed) {
      onCreateTag(trimmed);
      setNewTagName("");
      setIsAdding(false);
    }
  };

  const handleCopyTag = (name: string) => {
    navigator.clipboard.writeText(`#${name}`);
    toast.show({ message: `Copied #${name} to clipboard` });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
        <span className="flex items-center gap-1.5 text-2xs font-medium text-subtle">
          <TagIcon className="h-3 w-3" />
          Tags
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          aria-label="Add tag"
          className="rounded-xs p-0.5 text-subtle transition-colors hover:bg-sidebar-hover hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="px-2 pb-1.5">
          <input
            type="text"
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onBlur={() => !newTagName && setIsAdding(false)}
            onKeyDown={(e) => e.key === "Escape" && setIsAdding(false)}
            placeholder="Tag name…"
            className="h-7 w-full rounded-sm border border-border bg-surface-elevated px-2 text-xs focus:border-ring/60 focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </form>
      )}

      {tags.length === 0 && !isAdding ? (
        <p className="px-2 text-2xs leading-relaxed text-subtle">
          No tags yet. Organising is optional.
        </p>
      ) : (
        <div className="space-y-px">
          {tags.map((tag) => {
            const isSelected = selectedTagId === tag.id;
            return (
              <ContextMenu key={tag.id}>
                <ContextMenuTrigger asChild>
                  <div
                    onClick={() => onSelectTag(isSelected ? null : tag.id)}
                    className={cn(
                      "group flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-[6px] text-xs transition-colors",
                      isSelected
                        ? "bg-sidebar-active font-medium text-sidebar-active-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                    )}
                  >
                    <span className="truncate">#{tag.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(tag.id);
                      }}
                      aria-label={`Delete tag ${tag.name}`}
                      title="Delete tag — notes keep their content"
                      className="rounded-xs p-0.5 opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
                    <TagIcon className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">#{tag.name}</span>
                  </div>

                  <ContextMenuItem onClick={() => onSelectTag(isSelected ? null : tag.id)}>
                    <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>{isSelected ? "Clear filter" : "Filter by tag"}</span>
                  </ContextMenuItem>

                  <ContextMenuItem onClick={() => handleCopyTag(tag.name)}>
                    <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Copy tag name</span>
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    onClick={() => onDeleteTag(tag.id)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Delete tag</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
};
