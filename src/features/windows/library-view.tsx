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
import { AmbientSoundBar } from "@/features/focus/ambient-sound-bar";
import { QuickCaptureHud } from "@/features/capture/quick-capture-hud";
import { TemplateModal } from "@/features/templates/template-modal";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { formatShortcut, SHORTCUTS, useShortcuts } from "@/lib/keyboard/shortcuts";
import { NOTE_COLORS } from "@/features/stash/types/color";
import { NOTE_TEMPLATES, getTemplateIconStyle } from "@/features/stash/templates";
import { colorClass } from "@/lib/icons/icon-theme";
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
  CalendarBlank,
  Check,
  ClipboardText,
  DownloadSimple,
  FileText,
  Keyboard,
  SquaresFour,
  List as ListIcon,
  Stack,
  CheckSquareOffset,
  LockSimple,
  Palette,
  SidebarSimple,
  PushPin,
  Plus,
  ArrowClockwise,
  GearSix,
  SortAscending,
  SortDescending,
  Star,
  Trash,
  X,
  Funnel,
  ArrowCounterClockwise,
  Lightning,
  Cpu,
} from "@phosphor-icons/react";
import { PerformanceHub } from "@/features/performance/components/performance-hub";
import {
  openOrCreateTodayStash,
  findTodayNote,
  isTodayTitle,
} from "@/features/stash/daily-stash";
import {
  hasNotePin,
  hasNoteWidgets,
  getProtectedNotesCount,
  lockAllProtectedNotes,
} from "@/features/stash/note-meta";
import { downloadMarkdownArchive } from "@/lib/utils/markdown-export";
import { playClickSound } from "@/lib/utils/sound-effects";
import { FilterSortControl } from "./components/filter-sort-control";
import { getSystemUsername, getQuirkyGreeting } from "@/lib/utils/greetings";
import { cn } from "@/lib/utils/cn";

interface LibraryViewProps {
  onUpdateSettings: (patch: Partial<Settings>) => void | Promise<void>;
  onCapture: () => void | Promise<void>;
}

interface NavItem {
  id: SidebarSection;
  label: string;
  icon: React.ComponentType<{ className?: string; weight?: any }>;
}

/** Grouped like the rest of the shell: what you keep, then where it goes. */
const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Library",
    items: [
      { id: "all", label: "All Notes", icon: Stack },
      { id: "todos", label: "To-dos", icon: CheckSquareOffset },
      { id: "pinned", label: "Pinned", icon: PushPin },
      { id: "favorites", label: "Favorites", icon: Star },
    ],
  },
  {
    heading: "System & Health",
    items: [
      { id: "performance", label: "PC Performance", icon: Cpu },
    ],
  },
  {
    heading: "Storage",
    items: [
      { id: "archive", label: "Archive", icon: Archive },
      { id: "trash", label: "Trash", icon: Trash },
    ],
  },
];

const SECTION_TITLES: Record<SidebarSection, string> = {
  all: "All Notes",
  todos: "To-dos",
  pinned: "Pinned",
  favorites: "Favorites",
  tags: "Tagged",
  performance: "PC Performance & Bottleneck Radar",
  archive: "Archive",
  trash: "Trash",
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  onUpdateSettings,
  onCapture,
}) => {
  const {
    theme,
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
    openSettingsToTab,
    sortField,
    sortDir,
    setSort,
    groupBy,
    setGroupBy,
    quickFilter,
    setQuickFilter,
    dateHorizon,
    setDateHorizon,
    userDisplayName,
    showGreetingHeader,
    iconSet,
  } = useUIStore();
  const isColorful = iconSet === "colorful";

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [protectedNotesCount, setProtectedNotesCount] = useState<number>(() => getProtectedNotesCount());
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [username, setUsername] = useState<string>("Friend");

  useEffect(() => {
    getSystemUsername().then(setUsername);
  }, []);

  const activeUsername = (userDisplayName && userDisplayName.trim().length > 0) ? userDisplayName.trim() : username;
  const quirkyGreeting = useMemo(() => getQuirkyGreeting(activeUsername), [activeUsername]);
  const isTerminal =
    theme === "terminal" ||
    theme === "amber-crt" ||
    theme === "cyberpunk" ||
    theme === "e-ink";

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
        } else if (sortField === "words") {
          const aWords = (a.plainText?.trim() || "").split(/\s+/).filter(Boolean).length;
          const bWords = (b.plainText?.trim() || "").split(/\s+/).filter(Boolean).length;
          cmp = aWords - bWords;
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
      setProtectedNotesCount(getProtectedNotesCount());
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

  /* -------------------------- filtering & counts ------------------------- */

  const noteCountsByColor = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      const color = n.color || "paper";
      counts[color] = (counts[color] || 0) + 1;
    }
    return counts;
  }, [notes]);

  const noteCountsByTag = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      if (n.tags) {
        for (const t of n.tags) {
          counts[t.id] = (counts[t.id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;

    // Quick filter preset
    if (quickFilter === "pinned") {
      result = result.filter((n) => n.isPinned);
    } else if (quickFilter === "favorites") {
      result = result.filter((n) => n.isFavorite);
    } else if (quickFilter === "todos") {
      result = result.filter((n) => taskSummary(n.contentJson).total > 0);
    } else if (quickFilter === "completed") {
      result = result.filter((n) => {
        const s = taskSummary(n.contentJson);
        return s.total > 0 && s.done === s.total;
      });
    } else if (quickFilter === "vault") {
      result = result.filter((n) => hasNotePin(n.id));
    } else if (quickFilter === "has_widgets") {
      result = result.filter((n) => hasNoteWidgets(n.id));
    }

    // Date horizon filter
    if (dateHorizon && dateHorizon !== "all") {
      const now = Date.now();
      result = result.filter((n) => {
        const d = new Date(n.updatedAt).getTime();
        if (isNaN(d)) return true;
        if (dateHorizon === "today") {
          return (
            new Date(n.updatedAt).toDateString() === new Date().toDateString() ||
            isTodayTitle(n.title)
          );
        } else if (dateHorizon === "week") {
          return now - d <= 7 * 86400000;
        } else if (dateHorizon === "month") {
          return now - d <= 30 * 86400000;
        }
        return true;
      });
    }

    return result;
  }, [notes, quickFilter, dateHorizon]);

  /* ------------------------------ keyboard ------------------------------ */

  const selectedNote = useMemo(
    () => filteredNotes.find((n) => n.id === selectedNoteId) ?? null,
    [filteredNotes, selectedNoteId]
  );

  const moveSelection = useCallback(
    (delta: number) => {
      if (filteredNotes.length === 0) return;
      const current = filteredNotes.findIndex((n) => n.id === selectedNoteId);
      const next =
        current === -1
          ? 0
          : Math.min(Math.max(current + delta, 0), filteredNotes.length - 1);
      setSelectedNoteId(filteredNotes[next].id);
    },
    [filteredNotes, selectedNoteId, setSelectedNoteId]
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

  const handleRefreshLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadNotes(), loadTags()]);
      toast.show({ message: "Library refreshed" });
    } catch {
      toast.show({ message: "Refreshed" });
    } finally {
      setIsLoading(false);
    }
  }, [loadNotes, loadTags]);

  useShortcuts([
    { keys: "f5", run: () => void handleRefreshLibrary() },
    { keys: "mod+r", run: () => void handleRefreshLibrary() },
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
    {
      keys: "ctrl+shift+space",
      run: () => setQuickCaptureOpen(true),
    },
    {
      keys: "mod+shift+c",
      run: () => setQuickCaptureOpen(true),
    },
    {
      keys: "ctrl+t",
      run: () => setTemplateModalOpen(true),
    },
  ]);

  /* -------------------------------- render ------------------------------ */

  const sectionTitle = isSearching
    ? "Search results"
    : selectedTagId
    ? `#${tags.find((t) => t.id === selectedTagId)?.name ?? "tag"}`
    : SECTION_TITLES[activeSection];

  const groupedNotes = useMemo((): { label: string; notes: Note[] }[] => {
    if (groupBy === "none") return [{ label: "", notes: filteredNotes }];
    if (groupBy === "pinned") {
      const pinned = filteredNotes.filter((n) => n.isPinned);
      const others = filteredNotes.filter((n) => !n.isPinned);
      const groups: { label: string; notes: Note[] }[] = [];
      if (pinned.length > 0) {
        groups.push({ label: "📌 Pinned Stashes", notes: pinned });
      }
      if (others.length > 0) {
        groups.push({ label: "Other Stashes", notes: others });
      }
      return groups;
    }
    if (groupBy === "color") {
      const map = new Map<string, Note[]>();
      for (const n of filteredNotes) {
        const key = n.color || "Paper";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(n);
      }
      return Array.from(map.entries()).map(([label, grouped]) => ({ label, notes: grouped }));
    }
    // month
    const map = new Map<string, Note[]>();
    for (const n of filteredNotes) {
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
  }, [filteredNotes, groupBy]);

  const collectionProps = {
    notes: filteredNotes,
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
            title={`Today's Stash (${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })})`}
            aria-label="Open or create Today's Daily Stash"
            className={cn(
              "liquid-glass-shell group relative mb-3 flex items-center justify-center rounded-xl p-[1.5px] cursor-pointer transition-all duration-200 select-none",
              sidebarCollapsed ? "mx-auto h-9 w-9" : "w-full",
              todayNote && selectedNoteId === todayNote.id
                ? "ring-2 ring-primary/50 shadow-md"
                : ""
            )}
          >
            <div
              className={cn(
                "liquid-glass-track liquid-glass-sheen flex w-full items-center rounded-xl transition-all",
                sidebarCollapsed
                  ? "h-full justify-center p-0"
                  : "justify-start gap-2.5 px-2.5 py-1.5"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
                  <div className="flex h-5 w-5 flex-col items-center justify-center rounded-md border border-border/70 bg-surface/80 shadow-2xs overflow-hidden">
                    <div className="h-1.5 w-full bg-primary/70 shrink-0" />
                    <span className="text-[9px] font-bold font-mono leading-none text-foreground">
                      {new Date().getDate()}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full",
                      todayNote
                        ? "glass-active-beacon bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                        : "bg-primary/30 group-hover:bg-primary transition-colors"
                    )}
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col text-left min-w-0 leading-tight">
                    <span className="text-xs font-semibold tracking-tight text-foreground truncate">
                      Today's Stash
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {new Date().toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                            weight={isActive ? "bold" : "regular"}
                          />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" weight="regular" />
                          <span>{item.label}</span>
                        </div>
                        <ContextMenuItem onClick={() => goToSection(item.id)}>
                          <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          <span>Open {item.label}</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => void handleRefreshLibrary()}>
                          <ArrowClockwise className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                          <span>Refresh Library</span>
                          <ContextMenuShortcut>F5</ContextMenuShortcut>
                        </ContextMenuItem>
                        {item.id === "trash" ? (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              disabled={notes.length === 0}
                              onClick={() => setConfirmEmptyTrash(true)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash className="mr-2 h-3.5 w-3.5" />
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
                              <Plus className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
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

        <div className="border-t border-sidebar-border p-2.5 space-y-1">
          {protectedNotesCount > 0 && (
            <button
              onClick={() => {
                lockAllProtectedNotes();
                playClickSound();
                toast.show({
                  message: "Vault locked",
                  description: "All protected stashes are now locked.",
                });
              }}
              title={sidebarCollapsed ? "Lock all protected stashes" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-sm px-2 py-[7px] text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <LockSimple className="h-4 w-4 shrink-0 text-muted-foreground" />
              {!sidebarCollapsed && (
                <>
                  <span>Lock Vault</span>
                  <span className="ml-auto rounded-xs bg-muted text-foreground/80 px-1.5 py-0.2 font-mono text-[9px] font-semibold border border-border/50">
                    {protectedNotesCount}
                  </span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => openSettingsToTab("shortcuts")}
            title={sidebarCollapsed ? "Keyboard Shortcuts" : undefined}
            className={cn(
                "flex w-full items-center gap-2.5 rounded-sm px-2 py-[7px] text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" />
            {!sidebarCollapsed && <span>Shortcuts</span>}
          </button>

          <button
            onClick={() => openSettingsToTab("general")}
            title={sidebarCollapsed ? "Settings" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-sm px-2 py-[7px] text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <GearSix
              className="h-4 w-4 shrink-0 text-muted-foreground"
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
    </ContextMenuTrigger>

    <ContextMenuContent className="w-56">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
        <StashLogo size={14} showText={false} />
        <span>Stash Library</span>
      </div>

      <ContextMenuItem onClick={() => void handleRefreshLibrary()}>
        <ArrowClockwise className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>Refresh Library</span>
        <ContextMenuShortcut>F5</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={() => void onCapture()}>
        <Plus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>New Stash Note</span>
        <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleOpenTodayStash}>
        <CalendarBlank className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>Today's Daily Stash</span>
      </ContextMenuItem>

      {/* Templates */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>New from Template</span>
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
                    widgets: tmpl.widgets,
                  });
                  toast.show({ message: `Created ${tmpl.name}` });
                }}
                className="flex items-center gap-2 cursor-pointer py-1.5"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-foreground">
                  <Icon className="h-3.5 w-3.5 text-foreground/80" />
                </div>
                <span>{tmpl.name}</span>
              </ContextMenuItem>
            );
          })}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      {/* Quick Navigation Submenu */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Stack className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Go to View</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => {
            const ItemIcon = item.icon;
            const isActive =
              activeSection === item.id && !selectedTagId && !isSearching;
            return (
              <ContextMenuItem
                key={item.id}
                onClick={() => goToSection(item.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <Check className="h-3 w-3 text-foreground" />
                )}
              </ContextMenuItem>
            );
          })}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem onClick={toggleSidebar}>
        <SidebarSimple className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>{sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={() => setSettingsOpen(true)}>
        <GearSix className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>Settings</span>
        <ContextMenuShortcut>Ctrl+,</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>

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
              <SidebarSimple className="h-3.5 w-3.5" />
            </button>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {sectionTitle}
            </span>
          </div>

          <div className="no-drag-region flex items-center">
            <WindowControls />
          </div>
        </div>

        {activeSection === "performance" ? (
          <div className="relative flex-1 overflow-y-auto">
            <PerformanceHub />
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0">
            {activeSection === "all" && !isSearching && !selectedTagId && !selectedColorFilter && showGreetingHeader ? (
              <>
                <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground">
                  {quirkyGreeting.title}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>{quirkyGreeting.subtitle}</span>
                  <span className="opacity-40">•</span>
                  <span className="font-medium text-foreground/80">
                    {isLoading
                      ? "Loading…"
                      : `${filteredNotes.length} ${filteredNotes.length === 1 ? "stash" : "stashes"}${
                          filteredNotes.length !== notes.length ? ` (of ${notes.length})` : ""
                        }`}
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-[1.375rem] font-semibold tracking-tight">
                    {isTerminal ? `> ${sectionTitle.toLowerCase()}` : sectionTitle}
                  </h1>
                  {isTerminal && (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-brand/40 bg-brand/10 text-brand font-semibold select-none flex items-center gap-1.5 shadow-xs">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                      <span>TTY: STASH-SHELL</span>
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isLoading
                    ? "Loading…"
                    : `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}${
                        filteredNotes.length !== notes.length ? ` (of ${notes.length})` : ""
                      }`}
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
              </>
            )}
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
              showFilterButton={false}
            />

            <FilterSortControl
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={setSort}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              selectedColor={selectedColorFilter}
              onSelectColor={setSelectedColorFilter}
              tags={tags}
              selectedTagId={selectedTagId}
              onSelectTag={setSelectedTagId}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              dateHorizon={dateHorizon}
              onDateHorizonChange={setDateHorizon}
              noteCountsByColor={noteCountsByColor}
              noteCountsByTag={noteCountsByTag}
              totalNotesCount={notes.length}
              filteredNotesCount={filteredNotes.length}
              includeArchived={includeArchived}
              onToggleIncludeArchived={setIncludeArchived}
            />

            {/* Ambient Focus Soundscapes */}
            <AmbientSoundBar />

            {/* Quick Capture Spotlight Button */}
            <button
              type="button"
              onClick={() => setQuickCaptureOpen(true)}
              title="Quick Capture HUD (Ctrl+Shift+Space)"
              className="flex h-8 items-center gap-1.5 px-2.5 rounded border border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              <Lightning className="h-3.5 w-3.5 text-amber-500" weight="fill" />
              <span className="hidden sm:inline">Capture</span>
            </button>

            <NewStashMenu
              onCreate={() => void onCapture()}
              onOpenTemplateStudio={() => setTemplateModalOpen(true)}
            />
          </div>
        </div>

        {/* Collection with custom canvas right-click context menu */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="relative flex-1 overflow-y-auto px-6 py-5">
              {filteredNotes.length === 0 && !isLoading ? (
                notes.length === 0 ? (
                  <EmptyStash
                    section={activeSection}
                    isSearching={isSearching}
                    onCapture={onCapture}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                      <Funnel className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No stashes match your filters</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Try clearing or adjusting your quick filter preset or date horizon.
                    </p>
                    <button
                      onClick={() => {
                        setQuickFilter("all");
                        setDateHorizon("all");
                        setSelectedColorFilter(null);
                        setSelectedTagId(null);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <ArrowCounterClockwise className="h-3.5 w-3.5" />
                      Reset All Filters
                    </button>
                  </div>
                )
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
            <ContextMenuItem onClick={() => void handleRefreshLibrary()}>
              <ArrowClockwise className={cn("mr-2 h-3.5 w-3.5", colorClass("text-emerald-500", isColorful, "text-muted-foreground"))} />
              <span>Refresh Library</span>
              <ContextMenuShortcut>F5</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={() => void onCapture()}>
              <Plus className={cn("mr-2 h-3.5 w-3.5", colorClass("text-primary", isColorful, "text-muted-foreground"))} />
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
              <CheckSquareOffset className={cn("mr-2 h-3.5 w-3.5", colorClass("text-emerald-500", isColorful, "text-muted-foreground"))} />
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
              <ClipboardText className={cn("mr-2 h-3.5 w-3.5", colorClass("text-blue-500", isColorful, "text-muted-foreground"))} />
              <span>Paste from Clipboard</span>
            </ContextMenuItem>

            {/* Templates */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FileText className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-muted-foreground"))} />
                <span>Note Templates</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-52">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Templates
                </div>
                {NOTE_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const { iconColor, iconBg } = getTemplateIconStyle(tmpl, isColorful);
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
                          widgets: tmpl.widgets,
                        });
                        toast.show({ message: `Created ${tmpl.name}` });
                      }}
                      className="flex items-center gap-2 cursor-pointer py-1.5"
                    >
                      <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded", iconBg)}>
                        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
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
                <SquaresFour className={cn("mr-2 h-3.5 w-3.5", colorClass("text-blue-500", isColorful, "text-muted-foreground"))} />
                <span>View Mode</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-36">
                <ContextMenuItem
                  onClick={() => setViewMode("grid")}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <SquaresFour className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Grid View</span>
                  </div>
                  {viewMode === "grid" && <Check className="h-3.5 w-3.5 text-foreground" />}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => setViewMode("list")}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <ListIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>List View</span>
                  </div>
                  {viewMode === "list" && <Check className="h-3.5 w-3.5 text-foreground" />}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Sort Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <SortAscending className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-muted-foreground"))} />
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
                        <SortAscending className="h-3 w-3 text-foreground" />
                      ) : (
                        <SortDescending className="h-3 w-3 text-foreground" />
                      )
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Group By Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Stack className={cn("mr-2 h-3.5 w-3.5", colorClass("text-teal-500", isColorful, "text-muted-foreground"))} />
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
                    {groupBy === g && <Check className="h-3 w-3 text-foreground" />}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Color Filter */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className={cn("mr-2 h-3.5 w-3.5", colorClass("text-pink-500", isColorful, "text-muted-foreground"))} />
                <span>Filter by Color</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem
                  onClick={() => setSelectedColorFilter(null)}
                  className="flex items-center justify-between"
                >
                  <span>All Colors</span>
                  {!selectedColorFilter && <Check className="h-3 w-3 text-foreground" />}
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
                      <Check className="h-3 w-3 text-foreground" />
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={() => void handleRefreshLibrary()}>
              <ArrowClockwise className={cn("mr-2 h-3.5 w-3.5", colorClass("text-emerald-500", isColorful, "text-muted-foreground"))} />
              <span>Refresh Library</span>
              <ContextMenuShortcut>F5</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => setSettingsOpen(true)}>
              <GearSix className={cn("mr-2 h-3.5 w-3.5", colorClass("text-indigo-500", isColorful, "text-muted-foreground"))} />
              <span>Preferences</span>
              <ContextMenuShortcut>Ctrl+,</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
          </>
        )}

        {/* Bulk action bar */}
        {bulkSelected.size > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-elevated px-6 py-2.5 shadow-lg">
            <span className="text-xs font-medium text-muted-foreground">
              {bulkSelected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const selectedNotes = notes.filter((n) => bulkSelected.has(n.id));
                  downloadMarkdownArchive(selectedNotes);
                  toast.show({
                    message: "Exported selected notes",
                    description: `${selectedNotes.length} notes saved as Markdown archive.`,
                  });
                }}
                className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
              >
                <DownloadSimple className="h-3.5 w-3.5 text-muted-foreground" />
                Export Markdown
              </button>
              {activeSection !== "trash" && (
                <button
                  onClick={() => void handleBulkArchive()}
                  className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  Archive
                </button>
              )}
              <button
                onClick={() => void handleBulkTrash()}
                className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash className="h-3.5 w-3.5 text-destructive" />
                Trash
              </button>
              <button
                onClick={clearBulkSelection}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                title="Clear selection (Esc)"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </main>

      <CommandPalette
        onCapture={onCapture}
        onOpenTemplateStudio={() => setTemplateModalOpen(true)}
        onQuickCapture={() => setQuickCaptureOpen(true)}
        currentNote={selectedNote}
        onOpenNote={openFloating}
        onDuplicateNote={handleDuplicate}
        onArchiveNote={handleArchive}
        onTrashNote={handleTrash}
        onToggleViewMode={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        onUpdateSettings={onUpdateSettings}
      />

      <SettingsModal />

      <TemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
      />

      <QuickCaptureHud
        open={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
        onNoteCreated={() => void loadNotes()}
      />

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
