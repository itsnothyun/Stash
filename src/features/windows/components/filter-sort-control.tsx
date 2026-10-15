import React, { useState } from "react";
import {
  SlidersHorizontal,
  CaretDown,
  SquaresFour,
  List as ListIcon,
  SortAscending,
  SortDescending,
  Check,
  ArrowCounterClockwise,
  Stack,
  CalendarBlank,
  Clock,
  TextAa,
  Palette,
  Archive,
  PushPin,
  Star,
  CheckSquareOffset,
  LockSimple,
  Sparkle,
  Funnel,
  Eye,
  FileText,
  Tag as TagIcon,
  PuzzlePiece,
} from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTE_COLORS, NoteColor } from "@/features/stash/types/color";
import { Tag } from "@/features/stash/types/note";
import {
  useUIStore,
  SortField,
  SortDir,
  GroupBy,
  QuickFilter,
  DateHorizon,
  CardDensity,
} from "@/stores/ui-store";
import { playClickSound, playPopSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";

export type { SortField, SortDir, GroupBy, QuickFilter, DateHorizon, CardDensity };

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

  // Quick Filter
  quickFilter?: QuickFilter;
  onQuickFilterChange?: (qf: QuickFilter) => void;

  // Date Horizon
  dateHorizon?: DateHorizon;
  onDateHorizonChange?: (horizon: DateHorizon) => void;

  // Note counts
  noteCountsByColor?: Record<string, number>;
  noteCountsByTag?: Record<string, number>;
  totalNotesCount?: number;
  filteredNotesCount?: number;

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
  quickFilter: propQuickFilter,
  onQuickFilterChange: propOnQuickFilterChange,
  dateHorizon: propDateHorizon,
  onDateHorizonChange: propOnDateHorizonChange,
  noteCountsByColor = {},
  noteCountsByTag = {},
  totalNotesCount,
  filteredNotesCount,
  includeArchived,
  onToggleIncludeArchived,
  className,
}) => {
  const {
    quickFilter: storeQuickFilter,
    setQuickFilter: storeSetQuickFilter,
    dateHorizon: storeDateHorizon,
    setDateHorizon: storeSetDateHorizon,
    cardDensity,
    setCardDensity,
    showWordCount,
    setShowWordCount,
    showRelativeTime,
    setShowRelativeTime,
    showColorRibbon,
    setShowColorRibbon,
    showWidgetBadges,
    setShowWidgetBadges,
    soundEffectsEnabled,
  } = useUIStore();

  const quickFilter = propQuickFilter ?? storeQuickFilter;
  const setQuickFilter = propOnQuickFilterChange ?? storeSetQuickFilter;

  const dateHorizon = propDateHorizon ?? storeDateHorizon;
  const setDateHorizon = propOnDateHorizonChange ?? storeSetDateHorizon;

  const [activeTab, setActiveTab] = useState<"filters" | "sort" | "display">("filters");
  const [tagSearch, setTagSearch] = useState("");

  const playSfx = (type: "click" | "pop" = "click") => {
    if (!soundEffectsEnabled) return;
    if (type === "pop") playPopSound();
    else playClickSound();
  };

  // Calculate total active filters count
  let activeFiltersCount = 0;
  if (selectedColor) activeFiltersCount++;
  if (selectedTagId) activeFiltersCount++;
  if (includeArchived) activeFiltersCount++;
  if (quickFilter !== "all") activeFiltersCount++;
  if (dateHorizon !== "all") activeFiltersCount++;
  if (groupBy !== "none") activeFiltersCount++;
  if (sortField !== "updatedAt" || sortDir !== "desc") activeFiltersCount++;

  const handleReset = () => {
    playSfx("pop");
    onSelectColor(null);
    onSelectTag(null);
    onToggleIncludeArchived(false);
    setQuickFilter("all");
    setDateHorizon("all");
    onGroupByChange("none");
    onSortChange("updatedAt", "desc");
  };

  const sortOptions: {
    field: SortField;
    label: string;
    icon: React.ComponentType<{ className?: string; weight?: any }>;
  }[] = [
    { field: "updatedAt", label: "Last Modified", icon: Clock },
    { field: "createdAt", label: "Date Created", icon: CalendarBlank },
    { field: "title", label: "Title (A–Z)", icon: TextAa },
    { field: "color", label: "Color Palette", icon: Palette },
    { field: "words", label: "Word Count / Length", icon: FileText },
  ];

  const quickFilterChips: {
    id: QuickFilter;
    label: string;
    icon: React.ComponentType<{ className?: string; weight?: any }>;
  }[] = [
    { id: "all", label: "All Stashes", icon: Sparkle },
    { id: "pinned", label: "Pinned", icon: PushPin },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "todos", label: "Has Tasks", icon: CheckSquareOffset },
    { id: "vault", label: "Vault Locked", icon: LockSimple },
    { id: "has_widgets", label: "With Widgets", icon: PuzzlePiece },
  ];

  const getSortSummaryLabel = () => {
    switch (sortField) {
      case "updatedAt":
        return sortDir === "desc" ? "Recent" : "Oldest";
      case "createdAt":
        return sortDir === "desc" ? "Created (New)" : "Created (Old)";
      case "title":
        return sortDir === "asc" ? "A → Z" : "Z → A";
      case "color":
        return "By Color";
      case "words":
        return sortDir === "desc" ? "Longest" : "Shortest";
      default:
        return "Sorted";
    }
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter and Sort options"
          onClick={() => playSfx("click")}
          className={cn(
            "group relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all select-none cursor-pointer shadow-xs",
            activeFiltersCount > 0
              ? "border-primary/50 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 hover:bg-primary/15"
              : "border-border/70 bg-surface text-muted-foreground hover:border-border hover:bg-surface-hover hover:text-foreground",
            className
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105" />

          {/* Title */}
          <span className="hidden whitespace-nowrap font-semibold text-xs tracking-tight lg:inline">Filter & Sort</span>

          {/* Active Filter Count Badge */}
          {activeFiltersCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-mono font-bold text-primary-foreground shadow-2xs animate-in zoom-in-75">
              {activeFiltersCount}
            </span>
          )}

          <CaretDown className="h-3 w-3 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className="w-[min(24rem,calc(100vw-1.5rem))] max-h-[var(--radix-popover-content-available-height)] p-0 text-xs shadow-2xl rounded-2xl border border-border/70 bg-popover/95 backdrop-blur-xl overflow-y-auto overflow-x-hidden"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-foreground border border-border/50">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold">Display & Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-2 rounded-full bg-muted text-foreground/80 border border-border/50 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {activeFiltersCount} active
                </span>
              )}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <ArrowCounterClockwise className="h-3 w-3" />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* Quick Filter Presets Chips */}
        <div className="p-3 pb-2 border-b border-border/40 bg-surface/50">
          <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
            <span>Quick Presets</span>
            {quickFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  playSfx("click");
                  setQuickFilter("all");
                }}
                className="text-[10px] text-primary hover:underline cursor-pointer lowercase"
              >
                clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {quickFilterChips.map((chip) => {
              const Icon = chip.icon;
              const isSelected = quickFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    playSfx("click");
                    setQuickFilter(isSelected && chip.id !== "all" ? "all" : chip.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-background/60 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Segmented Sub-Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-border/40 bg-muted/10 text-center text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              playSfx("click");
              setActiveTab("filters");
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer border-b-2",
              activeTab === "filters"
                ? "border-primary text-primary font-semibold bg-background/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Funnel className="h-3 w-3" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSfx("click");
              setActiveTab("sort");
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer border-b-2",
              activeTab === "sort"
                ? "border-primary text-primary font-semibold bg-background/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <SortAscending className="h-3 w-3" />
            <span>Sort & Group</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSfx("click");
              setActiveTab("display");
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer border-b-2",
              activeTab === "display"
                ? "border-primary text-primary font-semibold bg-background/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Cards</span>
          </button>
        </div>

        {/* Tab 1: FILTERS */}
        {activeTab === "filters" && (
          <div className="p-3.5 space-y-3.5 max-h-[340px] overflow-y-auto scrollbar-thin">
            {/* Color Filter Swatches */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  <span>Stash Color</span>
                </span>
                {selectedColor && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("click");
                      onSelectColor(null);
                    }}
                    className="text-[10px] text-primary hover:underline cursor-pointer lowercase"
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {NOTE_COLORS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  const count = noteCountsByColor[c.id];

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playSfx("click");
                        onSelectColor(isSelected ? null : c.id);
                      }}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer",
                        isSelected
                          ? "border-primary/50 bg-primary/10 text-primary font-semibold shadow-2xs"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center"
                          style={{ backgroundColor: c.dotColor }}
                        >
                          {isSelected && (
                            <Check className="h-2.5 w-2.5 text-black stroke-[3]" />
                          )}
                        </span>
                        <span className="truncate text-2xs">{c.label}</span>
                      </div>
                      {typeof count === "number" && (
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Horizon Filter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Time Horizon</span>
                </span>
                {dateHorizon !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("click");
                      setDateHorizon("all");
                    }}
                    className="text-[10px] text-primary hover:underline cursor-pointer lowercase"
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/50">
                {(
                  [
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "7 Days" },
                    { id: "month", label: "30 Days" },
                  ] as const
                ).map((horizon) => (
                  <button
                    key={horizon.id}
                    type="button"
                    onClick={() => {
                      playSfx("click");
                      setDateHorizon(horizon.id);
                    }}
                    className={cn(
                      "py-1 px-1 rounded-md text-[10px] font-medium transition-all text-center cursor-pointer",
                      dateHorizon === horizon.id
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {horizon.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    <span>Tags</span>
                  </span>
                  {selectedTagId && (
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("click");
                        onSelectTag(null);
                      }}
                      className="text-[10px] text-primary hover:underline cursor-pointer lowercase"
                    >
                      clear
                    </button>
                  )}
                </div>

                {tags.length > 6 && (
                  <input
                    type="text"
                    placeholder="Search tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
                  />
                )}

                <div className="flex max-h-24 flex-wrap items-center gap-1 overflow-y-auto pr-1 scrollbar-thin">
                  {filteredTags.map((t) => {
                    const isSelected = selectedTagId === t.id;
                    const count = noteCountsByTag[t.id];

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          playSfx("click");
                          onSelectTag(isSelected ? null : t.id);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-2xs"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <span>#{t.name}</span>
                        {typeof count === "number" && (
                          <span className="opacity-70 text-[9px]">({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Include Archived Switch */}
            <div className="pt-2 border-t border-border/50">
              <label className="flex items-center justify-between cursor-pointer select-none py-1">
                <div className="flex items-center gap-2 text-[11px] text-foreground">
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Include archived stashes</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => {
                    playSfx("click");
                    onToggleIncludeArchived(e.target.checked);
                  }}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: SORT & LAYOUT */}
        {activeTab === "sort" && (
          <div className="p-3.5 space-y-3.5 max-h-[340px] overflow-y-auto scrollbar-thin">
            {/* View Layout Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                View Layout
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-muted/40 border border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    playSfx("click");
                    onViewModeChange("grid");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SquaresFour className="h-3.5 w-3.5" />
                  <span>Gallery Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSfx("click");
                    onViewModeChange("list");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  <span>Compact List</span>
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <span>Sort Attribute</span>
                <span className="font-mono text-[9px] text-primary lowercase">
                  active: {getSortSummaryLabel()}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = sortField === opt.field;

                  return (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => {
                        playSfx("click");
                        onSortChange(
                          opt.field,
                          isActive && sortDir === "asc" ? "desc" : "asc"
                        );
                      }}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-left",
                        isActive
                          ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-2xs"
                          : "border-border/40 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{opt.label}</span>
                      </div>

                      {isActive && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-primary">
                          <span>{sortDir === "asc" ? "Ascending" : "Descending"}</span>
                          {sortDir === "asc" ? (
                            <SortAscending className="h-3.5 w-3.5" />
                          ) : (
                            <SortDescending className="h-3.5 w-3.5" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Direction Quick Toggle */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sort Direction:</span>
              <button
                type="button"
                onClick={() => {
                  playSfx("click");
                  onSortChange(sortField, sortDir === "asc" ? "desc" : "asc");
                }}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                {sortDir === "asc" ? (
                  <>
                    <SortAscending className="h-3.5 w-3.5 text-primary" />
                    <span>Ascending (A → Z, Oldest)</span>
                  </>
                ) : (
                  <>
                    <SortDescending className="h-3.5 w-3.5 text-primary" />
                    <span>Descending (Z → A, Newest)</span>
                  </>
                )}
              </button>
            </div>

            {/* Grouping Options */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Stack className="h-3 w-3" />
                <span>Group Stashes</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: "none", label: "None" },
                    { id: "color", label: "By Color" },
                    { id: "month", label: "By Month" },
                    { id: "pinned", label: "By Pinned" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      playSfx("click");
                      onGroupByChange(g.id);
                    }}
                    className={cn(
                      "py-1 px-1 text-center rounded-md text-[10px] font-medium transition-all border cursor-pointer",
                      groupBy === g.id
                        ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-2xs"
                        : "border-border/40 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DISPLAY OPTIONS (Card Density & Badges) */}
        {activeTab === "display" && (
          <div className="p-3.5 space-y-3.5 max-h-[340px] overflow-y-auto scrollbar-thin">
            {/* Card Density */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Card Density
              </label>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/50">
                {(
                  [
                    { id: "compact", label: "Compact" },
                    { id: "comfortable", label: "Comfortable" },
                    { id: "spacious", label: "Spacious" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      playSfx("click");
                      setCardDensity(d.id);
                    }}
                    className={cn(
                      "py-1 text-center rounded-md text-[11px] font-medium transition-all cursor-pointer",
                      cardDensity === d.id
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Card Metadata Badges Toggles */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                Visual Card Details
              </div>

              <label className="flex items-center justify-between cursor-pointer select-none py-1">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Show word count & reading time</span>
                </div>
                <input
                  type="checkbox"
                  checked={showWordCount}
                  onChange={(e) => {
                    playSfx("click");
                    setShowWordCount(e.target.checked);
                  }}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none py-1">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Show relative timestamps (e.g. 5m ago)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showRelativeTime}
                  onChange={(e) => {
                    playSfx("click");
                    setShowRelativeTime(e.target.checked);
                  }}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none py-1">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Show left color accent ribbon</span>
                </div>
                <input
                  type="checkbox"
                  checked={showColorRibbon}
                  onChange={(e) => {
                    playSfx("click");
                    setShowColorRibbon(e.target.checked);
                  }}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none py-1">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <PuzzlePiece className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Show attached widget indicators</span>
                </div>
                <input
                  type="checkbox"
                  checked={showWidgetBadges}
                  onChange={(e) => {
                    playSfx("click");
                    setShowWidgetBadges(e.target.checked);
                  }}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Card Footer Summary */}
        <div className="p-3 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>
            {typeof filteredNotesCount === "number" && typeof totalNotesCount === "number"
              ? `Showing ${filteredNotesCount} of ${totalNotesCount} stashes`
              : activeFiltersCount > 0
              ? `${activeFiltersCount} filters active`
              : "Standard library view"}
          </span>
          <span className="text-primary font-medium">ESC to close</span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
