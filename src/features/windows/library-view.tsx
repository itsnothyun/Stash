import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Note,
  Settings,
  SidebarSection,
  Tag,
} from "@/features/stash/types/note";
import { taskSummary } from "@/features/stash/task-summary";
import { NoteColor } from "@/features/stash/types/color";
import { GroupBy, SortField, useUIStore } from "@/stores/ui-store";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { StashLogo } from "@/components/shared/stash-logo";
import { WindowControls } from "@/components/desktop/window-controls";
import { SearchBar } from "@/features/search/components/search-bar";
import { TagManager } from "@/features/tags/components/tag-manager";
import { NoteGrid } from "@/features/stash/components/note-grid";
import { NoteList } from "@/features/stash/components/note-list";
import { EmptyStash } from "@/features/stash/components/empty-stash";
import { CommandPalette } from "@/features/command-menu/command-palette";
import { SettingsModal } from "@/features/settings/settings-modal";
import { NewStashMenu } from "@/features/capture/new-stash-menu";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { formatShortcut, SHORTCUTS, useShortcuts } from "@/lib/keyboard/shortcuts";
import { NOTE_COLORS } from "@/features/stash/types/color";
import { NOTE_TEMPLATES } from "@/features/stash/templates";
import { createAndOpenStash } from "@/features/capture/create-stash";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Archive,
  Check,
  Clipboard,
  FileText,
  Layers2,
  LayoutGrid,
  Layers,
  List as ListIcon,
  ListChecks,
  ListTodo,
  Palette,
  PanelLeft,
  Pin,
  Plus,
  RotateCcw,
  Settings as SettingsIcon,
  SortAsc,
  SortDesc,
  Star,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import {
  openOrCreateTodayStash,
  findTodayNote,
} from "@/features/stash/daily-stash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

interface LibraryViewProps {
  onUpdateSettings: (patch: Partial<Settings>) => void | Promise<void>;
  onCapture: () => void | Promise<void>;
}

interface NavItem {
  id: SidebarSection;
  label: string;
  icon: typeof Layers;
}

/** Grouped like the rest of the shell: what you keep, then where it goes. */
const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Library",
    items: [
      { id: "all", label: "All Notes", icon: Layers },
      { id: "todos", label: "To-dos", icon: ListChecks },
      { id: "pinned", label: "Pinned", icon: Pin },
      { id: "favorites", label: "Favorites", icon: Star },
    ],
  },
  {
    heading: "Storage",
    items: [
      { id: "archive", label: "Archive", icon: Archive },
      { id: "trash", label: "Trash", icon: Trash2 },
    ],
  },
];

const SECTION_TITLES: Record<SidebarSection, string> = {
  all: "All Notes",
  todos: "To-dos",
  pinned: "Pinned",
  favorites: "Favorites",
  tags: "Tagged",
  archive: "Archive",
  trash: "Trash",
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  onUpdateSettings,
  onCapture,
}) => {
  const {
    activeSection,
    setActiveSection,
    selectedTagId,
    setSelectedTagId,
    selectedColorFilter,
    setSelectedColorFilter,
    searchQuery,
    setSearchQuery,
    searchFocusToken,
    viewMode,
    setViewMode,
    sidebarCollapsed,
    toggleSidebar,
    selectedNoteId,
    setSelectedNoteId,
    setSettingsOpen,
    sortField,
    sortDir,
    setSort,
    groupBy,
    setGroupBy,
  } = useUIStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const isSearching = searchQuery.trim().length > 0;

  /* ------------------------------- loading ------------------------------ */

  const loadTags = useCallback(async () => {
    try {
      setTags(await stashIpc.listTags());
    } catch {
      // Tags are auxiliary; a failure here must not blank the library.
    }
  }, []);

  const sortNotes = useCallback(
    (list: Note[]): Note[] => {
      const sorted = [...list];
      sorted.sort((a, b) => {
        let cmp = 0;
        if (sortField === "title") {
          cmp = (a.title || "").localeCompare(b.title || "");
        } else if (sortField === "color") {
          cmp = (a.color || "").localeCompare(b.color || "");
        } else if (sortField === "createdAt") {
          cmp = a.createdAt.localeCompare(b.createdAt);
        } else {
          cmp = a.updatedAt.localeCompare(b.updatedAt);
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
      return sorted;
    },
    [sortField, sortDir]
  );

  const loadNotes = useCallback(async () => {
    try {
      if (isSearching) {
        let results = await stashIpc.searchNotes(searchQuery, includeArchived);
        if (selectedTagId) {
          results = results.filter((n) =>
            n.tags?.some((t) => t.id === selectedTagId)
          );
        }
        if (selectedColorFilter) {
          results = results.filter((n) => n.color === selectedColorFilter);
        }
        setNotes(sortNotes(results));
      } else {
        let loaded = await stashIpc.listNotes(
          activeSection,
          selectedTagId || undefined,
          selectedColorFilter || undefined
        );
        // The database prefilter is a substring check. Drop anything that
        // does not actually contain a task.
        if (activeSection === "todos") {
          loaded = loaded.filter((note) => taskSummary(note.contentJson).total > 0);
        }
        setNotes(sortNotes(loaded));
      }
    } catch {
      toast.error("Could not load your stash", "Try reopening the window.");
    } finally {
      setIsLoading(false);
    }
  }, [
    isSearching,
    searchQuery,
    includeArchived,
    selectedTagId,
    selectedColorFilter,
    activeSection,
    sortNotes,
  ]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Another window changed something: refresh quietly, keep what's on screen
  // until the new data lands.
  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    const subscribe = (event: string, handler: () => void) => {
      stashIpc.listenToEvent(event, handler).then((fn) => unlisteners.push(fn));
    };

    subscribe("stash://note-updated", () => loadNotes());
    subscribe("stash://note-deleted", () => loadNotes());
    subscribe("stash://refresh-all", () => {
      loadNotes();
      loadTags();
    });

    const handleMeta = () => {
      setNotes((prev) => [...prev]);
    };
    window.addEventListener("stash:note-meta-changed", handleMeta);

    return () => {
      unlisteners.forEach((fn) => fn());
      window.removeEventListener("stash:note-meta-changed", handleMeta);
    };
  }, [loadNotes, loadTags]);

  /* ------------------------------- actions ------------------------------ */

  const openFloating = useCallback(async (noteId: string) => {
    await stashIpc.openFloatingStash(noteId);
  }, []);

  const patchNote = async (note: Note, patch: Partial<Note>) => {
    await stashIpc.updateNote({ id: note.id, version: note.version, ...patch });
    loadNotes();
  };

  const handleToggleFavorite = (note: Note) =>
    patchNote(note, { isFavorite: !note.isFavorite });

  const handleTogglePinned = (note: Note) =>
    patchNote(note, { isPinned: !note.isPinned });

  const handleChangeColor = (note: Note, color: NoteColor) =>
    patchNote(note, { color });

  const handleDuplicate = async (note: Note) => {
    await stashIpc.duplicateNote(note.id);
    loadNotes();
  };

  const handleArchive = async (note: Note) => {
    const archiving = !note.isArchived;
    await stashIpc.setNoteArchived(note.id, archiving);
    loadNotes();
    toast.undoable(archiving ? "Archived" : "Restored from Archive", async () => {
      await stashIpc.setNoteArchived(note.id, !archiving);
      loadNotes();
    });
  };

  const handleTrash = async (note: Note) => {
    await stashIpc.trashNote(note.id);
    loadNotes();
    toast.undoable("Moved to Trash", async () => {
      await stashIpc.restoreNote(note.id);
      loadNotes();
    });
  };

  const handleRestore = async (note: Note) => {
    await stashIpc.restoreNote(note.id);
    loadNotes();
  };

  const handlePermanentDelete = async () => {
    if (!pendingDelete) return;
    await stashIpc.deleteNotePermanently(pendingDelete.id);
    setPendingDelete(null);
    loadNotes();
  };

  const handleEmptyTrash = async () => {
    await stashIpc.emptyTrash();
    setConfirmEmptyTrash(false);
    loadNotes();
    toast.show({ message: "Trash emptied" });
  };

  const handleCreateTag = async (name: string) => {
    await stashIpc.createTag(name);
    loadTags();
  };

  const handleDeleteTag = async (id: string) => {
    await stashIpc.deleteTag(id);
    if (selectedTagId === id) setSelectedTagId(null);
    loadTags();
    loadNotes();
  };

  const goToSection = (section: SidebarSection) => {
    setSearchQuery("");
    setSelectedTagId(null);
    setActiveSection(section);
    setSelectedNoteId(null);
  };

  const clearBulkSelection = useCallback(() => setBulkSelected(new Set()), []);

  const handleToggleSelect = useCallback((id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkArchive = async () => {
    const ids = Array.from(bulkSelected);
    const count = ids.length;
    for (const id of ids) {
      await stashIpc.setNoteArchived(id, true);
    }
    clearBulkSelection();
    loadNotes();
    toast.show({ message: `${count} notes archived` });
  };

  const handleBulkTrash = async () => {
    const ids = Array.from(bulkSelected);
    const count = ids.length;
    for (const id of ids) {
      await stashIpc.trashNote(id);
    }
    clearBulkSelection();
    loadNotes();
    toast.show({ message: `${count} notes moved to Trash` });
  };

  /* ------------------------------ keyboard ------------------------------ */

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  const moveSelection = useCallback(
    (delta: number) => {
      if (notes.length === 0) return;
      const current = notes.findIndex((n) => n.id === selectedNoteId);
      const next =
        current === -1
          ? 0
          : Math.min(Math.max(current + delta, 0), notes.length - 1);
      setSelectedNoteId(notes[next].id);
    },
    [notes, selectedNoteId, setSelectedNoteId]
  );

  const todayNote = useMemo(() => findTodayNote(notes), [notes]);

  const handleOpenTodayStash = useCallback(async () => {
    try {
      const stash = await openOrCreateTodayStash(notes, openFloating);
      loadNotes();
      toast.show({ message: `Opened Today's Stash (${stash.title})` });
    } catch (err) {
      console.error(err);
      toast.show({ message: "Failed to open Today's Stash" });
    }
  }, [notes, openFloating, loadNotes]);

  useShortcuts([
    { keys: "arrowdown", run: () => moveSelection(1) },
    { keys: "arrowup", run: () => moveSelection(-1) },
    {
      keys: "escape",
      // Escape unwinds one step at a time: bulk selection, search, then the selection.
      enabled: bulkSelected.size > 0 || isSearching || selectedNoteId !== null,
      run: () => {
        if (bulkSelected.size > 0) clearBulkSelection();
        else if (isSearching) setSearchQuery("");
        else setSelectedNoteId(null);
      },
    },
    {
      keys: "enter",
      enabled: selectedNote !== null,
      run: () => selectedNote && openFloating(selectedNote.id),
    },
    {
      keys: "ctrl+shift+d",
      run: handleOpenTodayStash,
    },
    {
      keys: "cmd+shift+d",
      run: handleOpenTodayStash,
    },
    {
      keys: SHORTCUTS.duplicate,
      enabled: selectedNote !== null,
      run: () => selectedNote && handleDuplicate(selectedNote),
    },
    {
      keys: SHORTCUTS.archive,
      enabled: selectedNote !== null,
      run: () => selectedNote && handleArchive(selectedNote),
    },
  ]);

  /* -------------------------------- render ------------------------------ */

  const sectionTitle = isSearching
    ? "Search results"
    : selectedTagId
    ? `#${tags.find((t) => t.id === selectedTagId)?.name ?? "tag"}`
    : SECTION_TITLES[activeSection];

  const groupedNotes = useMemo((): { label: string; notes: Note[] }[] => {
    if (groupBy === "none") return [{ label: "", notes }];
    if (groupBy === "color") {
      const map = new Map<string, Note[]>();
      for (const n of notes) {
        const key = n.color || "Paper";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(n);
      }
      return Array.from(map.entries()).map(([label, grouped]) => ({ label, notes: grouped }));
    }
    // month
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      const key = n.updatedAt.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, grouped]) => ({
        label: new Date(key + "-01").toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
        }),
        notes: grouped,
      }));
  }, [notes, groupBy]);

  const collectionProps = {
    notes,
    selectedNoteId,
    onSelectNote: setSelectedNoteId,
    onOpenFloating: openFloating,
    onToggleFavorite: handleToggleFavorite,
    onTogglePinned: handleTogglePinned,
    onChangeColor: handleChangeColor,
    onDuplicate: handleDuplicate,
    onArchive: handleArchive,
    onTrash: handleTrash,
    onRestore: handleRestore,
    onPermanentDelete: setPendingDelete,
    selectedIds: bulkSelected,
    onToggleSelect: handleToggleSelect,
  };

  return (
    <div className="flex h-screen w-screen select-none overflow-hidden bg-background text-foreground">
      {/* ---------------------------- Sidebar ---------------------------- */}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-soft",
          sidebarCollapsed ? "w-[60px]" : "w-[232px]"
        )}
      >
        <div
          data-tauri-drag-region
          className="drag-region flex h-11 items-center px-3.5"
        >
          <StashLogo size={17} showText={!sidebarCollapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-2">
          {/* Today's Stash Quick Action in Sidebar */}
          <button
            type="button"
            onClick={handleOpenTodayStash}
            className={cn(
              "mb-3 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs",
              todayNote && selectedNoteId === todayNote.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
            )}
            title="Open or create Today's Daily Stash (Ctrl+Shift+D)"
          >
            <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-mono leading-none bg-primary text-primary-foreground rounded-full px-0.5">
                {new Date().getDate()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-1 items-center justify-between min-w-0">
                <span className="truncate">Today's Stash</span>
                <span className="text-[10px] font-mono opacity-70">
                  {new Date().toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              </div>
            )}
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.heading} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-2 pb-1.5 pt-1 text-2xs font-medium text-subtle">
                  {group.heading}
                </div>
              )}
              <div className="space-y-px">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeSection === item.id && !selectedTagId && !isSearching;
                  return (
                    <ContextMenu key={item.id}>
                      <ContextMenuTrigger asChild>
                        <button
                          onClick={() => goToSection(item.id)}
                          title={sidebarCollapsed ? item.label : undefined}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-sm px-2 py-[7px] text-xs font-medium transition-colors duration-150",
                            sidebarCollapsed && "justify-center px-0",
                            isActive
                              ? "bg-sidebar-active text-sidebar-active-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                            strokeWidth={1.75}
                          />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
                          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <ContextMenuItem onClick={() => goToSection(item.id)}>
                          <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          <span>Open {item.label}</span>
                        </ContextMenuItem>
                        {item.id === "trash" ? (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              disabled={notes.length === 0}
                              onClick={() => setConfirmEmptyTrash(true)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span>Empty Trash</span>
                            </ContextMenuItem>
                          </>
                        ) : (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => {
                                if (item.id === "todos") {
                                  void createAndOpenStash({
                                    title: "To-do List",
                                    plainText: "## Tasks\n- [ ] ",
                                  });
                                } else if (item.id === "favorites") {
                                  void createAndOpenStash({ isFavorite: true });
                                } else if (item.id === "pinned") {
                                  void createAndOpenStash({ isPinned: true });
                                } else {
                                  void onCapture();
                                }
                              }}
                            >
                              <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                              <span>New Note here</span>
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </div>
          ))}

          {!sidebarCollapsed && (
            <TagManager
              tags={tags}
              selectedTagId={selectedTagId}
              onSelectTag={(id) => {
                setSearchQuery("");
                setSelectedTagId(id);
              }}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
            />
          )}
        </nav>

        <div className="border-t border-sidebar-border p-2.5">
          <button
            onClick={() => setSettingsOpen(true)}
            title={sidebarCollapsed ? "Settings" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-sm px-2 py-[7px] text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <SettingsIcon
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
            />
            {!sidebarCollapsed && (
              <>
                <span>Settings</span>
                <kbd className="ml-auto rounded-xs border border-border px-1 py-px font-mono text-[10px] text-subtle">
                  {formatShortcut(SHORTCUTS.settings)}
                </kbd>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ---------------------------- Content ---------------------------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Window chrome */}
        <div
          data-tauri-drag-region
          className="drag-region flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border pl-3 pr-0"
        >
          <div className="no-drag-region flex min-w-0 items-center gap-2">
            <button
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {sectionTitle}
            </span>
          </div>

          <div className="no-drag-region flex items-center">
            <WindowControls />
          </div>
        </div>

        {/* Page header */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-[1.375rem] font-semibold tracking-tight">
              {sectionTitle}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
              {activeSection === "trash" && notes.length > 0 && (
                <>
                  {" · "}
                  <button
                    onClick={() => setConfirmEmptyTrash(true)}
                    className="text-destructive underline-offset-2 hover:underline"
                  >
                    Empty Trash
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              focusToken={searchFocusToken}
              tags={tags}
              selectedTagId={selectedTagId}
              onSelectTag={setSelectedTagId}
              selectedColor={selectedColorFilter}
              onSelectColor={setSelectedColorFilter}
              includeArchived={includeArchived}
              onToggleIncludeArchived={setIncludeArchived}
            />

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Sort"
                  className="flex h-8 items-center gap-1 rounded border border-border bg-surface px-2 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                >
                  {sortDir === "asc" ? (
                    <SortAsc className="h-3.5 w-3.5" />
                  ) : (
                    <SortDesc className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {sortField === "updatedAt"
                      ? "Modified"
                      : sortField === "createdAt"
                      ? "Created"
                      : sortField === "title"
                      ? "Name"
                      : "Color"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {(
                  [
                    ["updatedAt", "Last modified"],
                    ["createdAt", "Date created"],
                    ["title", "Name (A–Z)"],
                    ["color", "Color"],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <DropdownMenuItem
                    key={field}
                    onClick={() =>
                      setSort(
                        field,
                        field === sortField
                          ? sortDir === "asc"
                            ? "desc"
                            : "asc"
                          : "desc"
                      )
                    }
                    className={cn(
                      "flex items-center justify-between",
                      sortField === field && "font-medium"
                    )}
                  >
                    {label}
                    {sortField === field &&
                      (sortDir === "asc" ? (
                        <SortAsc className="h-3 w-3" />
                      ) : (
                        <SortDesc className="h-3 w-3" />
                      ))}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Group-by dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Group by"
                  className={cn(
                    "flex h-8 items-center gap-1 rounded border border-border bg-surface px-2 text-xs hover:bg-surface-hover",
                    groupBy !== "none"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Layers2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {groupBy === "color"
                      ? "By Color"
                      : groupBy === "month"
                      ? "By Month"
                      : "Group"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(["none", "color", "month"] as GroupBy[]).map((g) => (
                  <DropdownMenuItem
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className={cn(
                      "flex items-center justify-between",
                      groupBy === g && "font-medium"
                    )}
                  >
                    {g === "none"
                      ? "No grouping"
                      : g === "color"
                      ? "By Color"
                      : "By Month"}
                    {groupBy === g && <Check className="h-3 w-3" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View switcher */}
            <div
              role="group"
              aria-label="View"
              className="flex items-center gap-0.5 rounded-sm border border-border bg-surface p-0.5"
            >
              {(
                [
                  { mode: "grid" as const, icon: LayoutGrid, label: "Grid view" },
                  { mode: "list" as const, icon: ListIcon, label: "List view" },
                ]
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-label={label}
                  aria-pressed={viewMode === mode}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-xs transition-colors",
                    viewMode === mode
                      ? "bg-surface-elevated text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {/* Today's Stash quick button */}
            <button
              type="button"
              onClick={handleOpenTodayStash}
              title={`Open Today's Stash (${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}) · Ctrl+Shift+D`}
              className="flex h-8 items-center gap-1.5 rounded border border-border bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors shadow-xs cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Today</span>
            </button>

            <NewStashMenu onCreate={() => void onCapture()} />
          </div>
        </div>

        {/* Collection with custom canvas right-click context menu */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="relative flex-1 overflow-y-auto px-6 py-5">
              {notes.length === 0 && !isLoading ? (
                <EmptyStash
                  section={activeSection}
                  isSearching={isSearching}
                  onCapture={onCapture}
                />
              ) : groupBy === "none" ? (
                viewMode === "grid" ? (
                  <NoteGrid {...collectionProps} />
                ) : (
                  <NoteList {...collectionProps} />
                )
              ) : (
                <div className="space-y-6">
                  {groupedNotes.map((group) => (
                    <div key={group.label}>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </div>
                      {viewMode === "grid" ? (
                        <NoteGrid {...collectionProps} notes={group.notes} />
                      ) : (
                        <NoteList {...collectionProps} notes={group.notes} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={() => void onCapture()}>
              <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
              <span>New Stash Note</span>
              <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => {
                void createAndOpenStash({
                  title: "To-do List",
                  plainText: "## Tasks\n- [ ] ",
                });
              }}
            >
              <ListTodo className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>New To-do Checklist</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (!text.trim()) {
                    toast.show({ message: "Clipboard is empty" });
                    return;
                  }
                  await createAndOpenStash({ plainText: text.trim() });
                  toast.show({ message: "Created stash from clipboard" });
                } catch {
                  toast.error("Could not read clipboard", "Check clipboard permissions.");
                }
              }}
            >
              <Clipboard className="mr-2 h-3.5 w-3.5 text-sky-500" />
              <span>Paste from Clipboard</span>
            </ContextMenuItem>

            {/* Templates */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FileText className="mr-2 h-3.5 w-3.5 text-purple-500" />
                <span>Note Templates</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-52">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Templates
                </div>
                {NOTE_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <ContextMenuItem
                      key={tmpl.id}
                      onClick={() => {
                        void createAndOpenStash({
                          title: tmpl.title,
                          color: tmpl.color,
                          plainText: tmpl.plainText,
                          tagNames: tmpl.tagNames,
                          emoji: tmpl.emoji,
                          paper: tmpl.paper,
                        });
                        toast.show({ message: `Created ${tmpl.name}` });
                      }}
                      className="flex items-center gap-2 cursor-pointer py-1.5"
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                          tmpl.iconBg
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", tmpl.iconColor)} />
                      </div>
                      <span>{tmpl.name}</span>
                    </ContextMenuItem>
                  );
                })}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            {/* View Mode */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <LayoutGrid className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                <span>View Mode</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-36">
                <ContextMenuItem
                  onClick={() => setViewMode("grid")}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                    <span>Grid View</span>
                  </div>
                  {viewMode === "grid" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => setViewMode("list")}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <ListIcon className="mr-2 h-3.5 w-3.5" />
                    <span>List View</span>
                  </div>
                  {viewMode === "list" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Sort Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <SortAsc className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Sort Notes</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                {(
                  [
                    ["updatedAt", "Last modified"],
                    ["createdAt", "Date created"],
                    ["title", "Name (A–Z)"],
                    ["color", "Color"],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <ContextMenuItem
                    key={field}
                    onClick={() =>
                      setSort(
                        field,
                        field === sortField
                          ? sortDir === "asc"
                            ? "desc"
                            : "asc"
                          : "desc"
                      )
                    }
                    className="flex items-center justify-between"
                  >
                    <span>{label}</span>
                    {sortField === field && (
                      sortDir === "asc" ? (
                        <SortAsc className="h-3 w-3 text-primary" />
                      ) : (
                        <SortDesc className="h-3 w-3 text-primary" />
                      )
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Group By Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Layers2 className="mr-2 h-3.5 w-3.5 text-teal-500" />
                <span>Group By</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                {(["none", "color", "month"] as GroupBy[]).map((g) => (
                  <ContextMenuItem
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {g === "none"
                        ? "No grouping"
                        : g === "color"
                        ? "By Color"
                        : "By Month"}
                    </span>
                    {groupBy === g && <Check className="h-3 w-3 stroke-[2.5] text-primary" />}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Color Filter */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="mr-2 h-3.5 w-3.5 text-pink-500" />
                <span>Filter by Color</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem
                  onClick={() => setSelectedColorFilter(null)}
                  className="flex items-center justify-between"
                >
                  <span>All Colors</span>
                  {!selectedColorFilter && <Check className="h-3 w-3 stroke-[2.5] text-primary" />}
                </ContextMenuItem>
                <ContextMenuSeparator />
                {NOTE_COLORS.map((c) => (
                  <ContextMenuItem
                    key={c.id}
                    onClick={() => setSelectedColorFilter(c.id)}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: c.dotColor }}
                      />
                      <span>{c.label}</span>
                    </div>
                    {selectedColorFilter === c.id && (
                      <Check className="h-3 w-3 stroke-[2.5] text-primary" />
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={() => void loadNotes()}>
              <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Refresh Notes</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Preferences</span>
              <ContextMenuShortcut>Ctrl+,</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Bulk action bar */}
        {bulkSelected.size > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-elevated px-6 py-2.5 shadow-lg">
            <span className="text-xs font-medium text-muted-foreground">
              {bulkSelected.size} selected
            </span>
            <div className="flex items-center gap-2">
              {activeSection !== "trash" && (
                <button
                  onClick={() => void handleBulkArchive()}
                  className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              )}
              <button
                onClick={() => void handleBulkTrash()}
                className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Trash
              </button>
              <button
                onClick={clearBulkSelection}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                title="Clear selection (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      <CommandPalette
        onCapture={onCapture}
        currentNote={selectedNote}
        onOpenNote={openFloating}
        onDuplicateNote={handleDuplicate}
        onArchiveNote={handleArchive}
        onTrashNote={handleTrash}
        onToggleViewMode={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        onUpdateSettings={onUpdateSettings}
      />

      <SettingsModal />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this note permanently?"
        description="The note and its revision history will be destroyed. This cannot be undone."
        onConfirm={handlePermanentDelete}
      />

      <ConfirmDialog
        open={confirmEmptyTrash}
        onOpenChange={setConfirmEmptyTrash}
        title="Empty the Trash?"
        description={`${notes.length} ${
          notes.length === 1 ? "note" : "notes"
        } will be destroyed along with their revision history. This cannot be undone.`}
        confirmLabel="Empty Trash"
        onConfirm={handleEmptyTrash}
      />
    </div>
  );
};
