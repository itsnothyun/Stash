import { create } from "zustand";
import { NoteColor } from "@/features/stash/types/color";
import { SidebarSection } from "@/features/stash/types/note";

const VIEW_MODE_KEY = "stash_view_mode";
const SIDEBAR_KEY = "stash_sidebar_collapsed";
const SORT_KEY = "stash_sort";
const GROUP_BY_KEY = "stash_group_by";
export const ZOOM_KEY = "stash_zoom_level";
export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 70;
export const MAX_ZOOM = 200;
export const ZOOM_STEP = 10;
export const ZOOM_PRESETS = [75, 90, 100, 110, 125, 150] as const;

export type SortField = "updatedAt" | "createdAt" | "title" | "color";
export type SortDir = "desc" | "asc";
export type GroupBy = "none" | "color" | "month";

function readViewMode(): "grid" | "list" {
  if (typeof localStorage === "undefined") return "grid";
  return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
}

function readSidebarCollapsed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SIDEBAR_KEY) === "true";
}

function readSort(): { field: SortField; dir: SortDir } {
  if (typeof localStorage === "undefined") return { field: "updatedAt", dir: "desc" };
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (raw) return JSON.parse(raw) as { field: SortField; dir: SortDir };
  } catch { /* ignore */ }
  return { field: "updatedAt", dir: "desc" };
}

function readGroupBy(): GroupBy {
  if (typeof localStorage === "undefined") return "none";
  const v = localStorage.getItem(GROUP_BY_KEY);
  if (v === "color" || v === "month") return v;
  return "none";
}

export function readZoomLevel(): number {
  if (typeof localStorage === "undefined") return DEFAULT_ZOOM;
  const raw = localStorage.getItem(ZOOM_KEY);
  if (!raw) return DEFAULT_ZOOM;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM
    ? parsed
    : DEFAULT_ZOOM;
}

export function applyZoomToDocument(level: number) {
  const factor = level / 100;

  // 1. Native Tauri webview zoom (hardware-accelerated Webview2 scaling)
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    import("@tauri-apps/api/webview")
      .then(({ getCurrentWebview }) => {
        const webview = getCurrentWebview();
        if (webview && typeof webview.setZoom === "function") {
          webview.setZoom(factor).catch(() => {});
        }
      })
      .catch(() => {});
  }

  // 2. CSS zoom applied to both documentElement and body
  if (typeof document !== "undefined") {
    const zoomStr = String(factor);
    document.documentElement.style.zoom = zoomStr;
    if (document.body) {
      document.body.style.zoom = zoomStr;
    }
  }
}

// Ensure the saved zoom level is immediately applied
applyZoomToDocument(readZoomLevel());

// Broadcast channel to instantly sync zoom across all open Tauri windows
let zoomChannel: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    zoomChannel = new BroadcastChannel("stash_zoom_sync");
  } catch {
    // Ignore if not supported in environment
  }
}

/** Which surface the library window is currently showing. */
export type LibraryRoute = "onboarding" | "library";

interface UIState {
  route: LibraryRoute;
  activeSection: SidebarSection;
  selectedTagId: string | null;
  selectedColorFilter: NoteColor | null;
  searchQuery: string;
  /** Bumped to ask the search field to take focus. */
  searchFocusToken: number;
  viewMode: "grid" | "list";
  sidebarCollapsed: boolean;
  selectedNoteId: string | null;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  theme: "system" | "light" | "dark";
  zoomLevel: number;
  sortField: SortField;
  sortDir: SortDir;
  groupBy: GroupBy;

  setRoute: (route: LibraryRoute) => void;
  setActiveSection: (section: SidebarSection) => void;
  setSelectedTagId: (tagId: string | null) => void;
  setSelectedColorFilter: (color: NoteColor | null) => void;
  setSearchQuery: (query: string) => void;
  requestSearchFocus: () => void;
  setViewMode: (mode: "grid" | "list") => void;
  toggleSidebar: () => void;
  setSelectedNoteId: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTheme: (theme: "system" | "light" | "dark") => void;
  setZoomLevel: (level: number, broadcast?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setSort: (field: SortField, dir: SortDir) => void;
  toggleSortDir: () => void;
  setGroupBy: (g: GroupBy) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Stays off the welcome until settings say it has not been completed.
  route: "library",
  activeSection: "all",
  selectedTagId: null,
  selectedColorFilter: null,
  searchQuery: "",
  searchFocusToken: 0,
  viewMode: readViewMode(),
  sidebarCollapsed: readSidebarCollapsed(),
  selectedNoteId: null,
  commandPaletteOpen: false,
  settingsOpen: false,
  theme: "system",
  zoomLevel: readZoomLevel(),
  sortField: readSort().field,
  sortDir: readSort().dir,
  groupBy: readGroupBy(),

  setRoute: (route) => set({ route }),
  setActiveSection: (section) =>
    set({ activeSection: section, selectedTagId: null }),
  setSelectedTagId: (tagId) =>
    set({ selectedTagId: tagId, activeSection: "tags" }),
  setSelectedColorFilter: (color) =>
    set((s) => ({
      selectedColorFilter: s.selectedColorFilter === color ? null : color,
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  requestSearchFocus: () =>
    set((s) => ({ route: "library", searchFocusToken: s.searchFocusToken + 1 })),
  setViewMode: (viewMode) => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
    set({ viewMode });
  },
  toggleSidebar: () =>
    set((s) => {
      const sidebarCollapsed = !s.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
      return { sidebarCollapsed };
    }),
  setSelectedNoteId: (selectedNoteId) => set({ selectedNoteId }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setTheme: (theme) => {
    set({ theme });
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  },
  setZoomLevel: (level, broadcast = true) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(level)));
    applyZoomToDocument(clamped);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ZOOM_KEY, String(clamped));
    }
    if (broadcast && zoomChannel) {
      zoomChannel.postMessage({ zoomLevel: clamped });
    }
    set({ zoomLevel: clamped });
  },
  zoomIn: () => {
    const current = get().zoomLevel;
    const next = Math.min(MAX_ZOOM, Math.round((current + ZOOM_STEP) / 10) * 10);
    get().setZoomLevel(next);
  },
  zoomOut: () => {
    const current = get().zoomLevel;
    const next = Math.max(MIN_ZOOM, Math.round((current - ZOOM_STEP) / 10) * 10);
    get().setZoomLevel(next);
  },
  resetZoom: () => {
    get().setZoomLevel(DEFAULT_ZOOM);
  },
  setSort: (field, dir) => {
    localStorage.setItem(SORT_KEY, JSON.stringify({ field, dir }));
    set({ sortField: field, sortDir: dir });
  },
  toggleSortDir: () => {
    const { sortField, sortDir, setSort } = get();
    setSort(sortField, sortDir === "asc" ? "desc" : "asc");
  },
  setGroupBy: (g) => {
    localStorage.setItem(GROUP_BY_KEY, g);
    set({ groupBy: g });
  },
}));

if (zoomChannel) {
  zoomChannel.onmessage = (event) => {
    const level = event.data?.zoomLevel;
    if (typeof level === "number" && Number.isFinite(level)) {
      applyZoomToDocument(level);
      useUIStore.setState({ zoomLevel: level });
    }
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === ZOOM_KEY && e.newValue) {
      const level = Number(e.newValue);
      if (Number.isFinite(level) && level >= MIN_ZOOM && level <= MAX_ZOOM) {
        applyZoomToDocument(level);
        useUIStore.setState({ zoomLevel: level });
      }
    }
  });
}
