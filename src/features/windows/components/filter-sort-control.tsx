import React from "react";
import {
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  SortAsc,
  SortDesc,
  Check,
  RotateCcw,
  Layers2,
  Calendar,
  Clock,
  Type,
  Palette,
  Archive,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTE_COLORS, NoteColor } from "@/features/stash/types/color";
import { Tag } from "@/features/stash/types/note";
import { SortField, SortDir, GroupBy } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";

export type { SortField, SortDir, GroupBy };

interface FilterSortControlProps {
  // View mode
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;

  // Sorting
  sortField: SortField;
  sortDir: "asc" | "desc";
  onSortChange: (field: SortField, dir: "asc" | "desc") => void;

  // Grouping
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;

  // Color Filter
  selectedColor: NoteColor | null;
  onSelectColor: (color: NoteColor | null) => void;

  // Tag Filter
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;

  // Archived
  includeArchived: boolean;
  onToggleIncludeArchived: (include: boolean) => void;

  className?: string;
}

export const FilterSortControl: React.FC<FilterSortControlProps> = ({
  viewMode,
  onViewModeChange,
  sortField,
  sortDir,
  onSortChange,
  groupBy,
  onGroupByChange,
  selectedColor,
  onSelectColor,
  tags,
  selectedTagId,
  onSelectTag,
  includeArchived,
  onToggleIncludeArchived,
  className,
}) => {
  // Calculate active filter count
  let activeFiltersCount = 0;
  if (selectedColor) activeFiltersCount++;
  if (selectedTagId) activeFiltersCount++;
  if (includeArchived) activeFiltersCount++;
  if (groupBy !== "none") activeFiltersCount++;
  if (sortField !== "updatedAt" || sortDir !== "desc") activeFiltersCount++;

  const handleReset = () => {
    onSelectColor(null);
    onSelectTag(null);
    onToggleIncludeArchived(false);
    onGroupByChange("none");
    onSortChange("updatedAt", "desc");
  };

  const sortOptions: { field: SortField; label: string; icon: React.FC<{ className?: string }> }[] = [
    { field: "updatedAt", label: "Last modified", icon: Clock },
    { field: "createdAt", label: "Date created", icon: Calendar },
    { field: "title", label: "Title (A–Z)", icon: Type },
    { field: "color", label: "Color", icon: Palette },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter and Sort options"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all shadow-2xs select-none cursor-pointer",
            activeFiltersCount > 0
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            className
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Filter & Sort</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-3 space-y-3.5 text-xs shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>Display & Filter</span>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Mode & Grouping */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Layout View
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-muted/40 border border-border/50">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span>Sort By</span>
            <button
              type="button"
              onClick={() => onSortChange(sortField, sortDir === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1 normal-case font-medium text-primary hover:underline cursor-pointer"
            >
              {sortDir === "asc" ? (
                <>
                  <SortAsc className="h-3 w-3" />
                  <span>Ascending</span>
                </>
              ) : (
                <>
                  <SortDesc className="h-3 w-3" />
                  <span>Descending</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {sortOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = sortField === opt.field;
              return (
                <button
                  key={opt.field}
                  type="button"
                  onClick={() => onSortChange(opt.field, isActive && sortDir === "asc" ? "desc" : "asc")}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border text-left",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs"
                      : "border-border/40 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group By */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Layers2 className="h-3 w-3" />
            <span>Group Stashes</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["none", "color", "month"] as GroupBy[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGroupByChange(g)}
                className={cn(
                  "py-1 px-1.5 text-center rounded-md text-[10px] font-medium transition-all border cursor-pointer",
                  groupBy === g
                    ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs"
                    : "border-border/40 bg-background/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {g === "none" ? "None" : g === "color" ? "By Color" : "By Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span>Filter Color</span>
            {selectedColor && (
              <button
                type="button"
                onClick={() => onSelectColor(null)}
                className="text-2xs font-normal normal-case text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectColor(selectedColor === c.id ? null : c.id)}
                title={c.label}
                aria-label={c.label}
                className={cn(
                  "relative flex h-5 w-5 items-center justify-center rounded-full border border-black/15 dark:border-white/15 transition-transform duration-150 cursor-pointer",
                  selectedColor === c.id
                    ? "scale-115 ring-2 ring-primary ring-offset-2 ring-offset-popover shadow-xs"
                    : "hover:scale-110 opacity-85 hover:opacity-100"
                )}
                style={{ backgroundColor: c.dotColor }}
              >
                {selectedColor === c.id && <Check className="h-3 w-3 text-black drop-shadow stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter (if tags exist) */}
        {tags.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              <span>Filter Tag</span>
              {selectedTagId && (
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className="text-2xs font-normal normal-case text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex max-h-20 flex-wrap items-center gap-1 overflow-y-auto pr-1 scrollbar-thin">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTag(selectedTagId === t.id ? null : t.id)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer",
                    selectedTagId === t.id
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Archived Checkbox */}
        <div className="pt-2 border-t border-border/50">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => onToggleIncludeArchived(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Archive className="h-3 w-3" />
              <span>Include archived stashes</span>
            </div>
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
};
