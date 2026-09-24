import React, { useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTE_COLORS, NoteColor } from "@/features/stash/types/color";
import { Tag } from "@/features/stash/types/note";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Increment to pull focus here — the shortcut registry owns the chord. */
  focusToken?: number;
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  selectedColor: NoteColor | null;
  onSelectColor: (color: NoteColor | null) => void;
  includeArchived: boolean;
  onToggleIncludeArchived: (val: boolean) => void;
  showFilterButton?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  focusToken = 0,
  tags,
  selectedTagId,
  onSelectTag,
  selectedColor,
  onSelectColor,
  includeArchived,
  onToggleIncludeArchived,
  showFilterButton = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusToken]);

  const activeFilterCount =
    (selectedTagId ? 1 : 0) + (selectedColor ? 1 : 0) + (includeArchived ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (query) onQueryChange("");
              else inputRef.current?.blur();
            }
          }}
          placeholder="Search your stash..."
          aria-label="Search your stash"
          className="h-8 w-52 rounded border border-border bg-surface pl-8 pr-14 text-xs text-foreground placeholder:text-muted-foreground transition-[width,border-color,box-shadow] duration-200 ease-soft focus:w-64 focus:border-ring/60 focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-ring/20 lg:w-64 lg:focus:w-72"
        />

        <div className="absolute right-2 flex items-center">
          {query ? (
            <button
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="rounded-xs p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden rounded-xs border border-border px-1 py-px font-mono text-[10px] text-subtle sm:inline-block">
              {formatShortcut(SHORTCUTS.search)}
            </kbd>
          )}
        </div>
      </div>

      {showFilterButton && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Filter"
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded border transition-colors",
                activeFilterCount > 0
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-[9px] font-semibold text-brand-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-64 space-y-3 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onSelectTag(null);
                    onSelectColor(null);
                    onToggleIncludeArchived(false);
                  }}
                  className="text-2xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-2xs font-medium text-muted-foreground">
                Color
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectColor(selectedColor === c.id ? null : c.id)}
                    aria-label={c.label}
                    aria-pressed={selectedColor === c.id}
                    className={cn(
                      "h-5 w-5 rounded-full border border-black/10 transition-transform duration-150 ease-soft dark:border-white/10",
                      selectedColor === c.id
                        ? "scale-110 ring-2 ring-brand ring-offset-2 ring-offset-popover"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c.dotColor }}
                  />
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <span className="mb-1.5 block text-2xs font-medium text-muted-foreground">
                  Tags
                </span>
                <div className="flex max-h-24 flex-wrap items-center gap-1 overflow-y-auto">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTag(selectedTagId === t.id ? null : t.id)}
                      className={cn(
                        "rounded-xs border px-2 py-0.5 text-2xs transition-colors",
                        selectedTagId === t.id
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      )}
                    >
                      #{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 border-t border-border pt-2.5">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => onToggleIncludeArchived(e.target.checked)}
                className="h-3 w-3 rounded-xs accent-brand"
              />
              <span className="text-2xs text-muted-foreground">
                Include archived notes
              </span>
            </label>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
