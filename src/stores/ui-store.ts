import { create } from "zustand";
import { NoteColor } from "@/features/stash/types/color";
import { SidebarSection } from "@/features/stash/types/note";

const VIEW_MODE_KEY = "stash_view_mode";
const SIDEBAR_KEY = "stash_sidebar_collapsed";
const SORT_KEY = "stash_sort";
const GROUP_BY_KEY = "stash_group_by";
export const ZOOM_KEY = "stash_zoom_level";
export const ACCENT_KEY = "stash_accent_color";
export const FONT_KEY = "stash_font_family";
export const DENSITY_KEY = "stash_card_density";
export const SOUND_KEY = "stash_sound_enabled";
export const WORD_COUNT_KEY = "stash_show_word_count";
export const REL_TIME_KEY = "stash_show_rel_time";
export const RIBBON_KEY = "stash_show_color_ribbon";
export const WIDGET_BADGES_KEY = "stash_show_widget_badges";
export const USER_NAME_KEY = "stash_user_display_name";
export const GREETING_KEY = "stash_show_greeting_header";

export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 70;
export const MAX_ZOOM = 200;
export const ZOOM_STEP = 10;
export const ZOOM_PRESETS = [75, 90, 100, 110, 125, 150] as const;

export type SortField = "updatedAt" | "createdAt" | "title" | "color" | "words";
export type SortDir = "desc" | "asc";
export type GroupBy = "none" | "color" | "month" | "pinned";

export type AccentColor =
  | "indigo"
  | "cyan"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "slate";

export type FontFamily = "sans" | "mono" | "serif" | "rounded";
export type CardDensity = "comfortable" | "compact" | "spacious";
export type QuickFilter =
  | "all"
  | "pinned"
  | "favorites"
  | "todos"
  | "completed"
  | "vault"
  | "has_widgets";
export type DateHorizon = "all" | "today" | "week" | "month";

export interface AccentDef {
  id: AccentColor;
  label: string;
  dotColor: string;
  brandHsl: string;
  brandForeground: string;
  brandMuted: string;
  ringHsl: string;
}

export const ACCENT_COLORS: AccentDef[] = [
  {
    id: "indigo",
    label: "Indigo",
    dotColor: "#6366f1",
    brandHsl: "243 75% 59%",
    brandForeground: "0 0% 100%",
    brandMuted: "243 72% 96%",
    ringHsl: "243 75% 59%",
  },
  {
    id: "cyan",
    label: "Cyber Cyan",
    dotColor: "#06b6d4",
    brandHsl: "189 94% 43%",
    brandForeground: "0 0% 100%",
    brandMuted: "189 90% 95%",
    ringHsl: "189 94% 43%",
  },
  {
    id: "emerald",
    label: "Mint Emerald",
    dotColor: "#10b981",
    brandHsl: "160 84% 39%",
    brandForeground: "0 0% 100%",
    brandMuted: "160 80% 95%",
    ringHsl: "160 84% 39%",
  },
  {
    id: "violet",
    label: "Nebula Violet",
    dotColor: "#8b5cf6",
    brandHsl: "258 90% 66%",
    brandForeground: "0 0% 100%",
    brandMuted: "258 85% 96%",
    ringHsl: "258 90% 66%",
  },
  {
    id: "rose",
    label: "Sunset Rose",
    dotColor: "#f43f5e",
    brandHsl: "350 89% 60%",
    brandForeground: "0 0% 100%",
    brandMuted: "350 85% 96%",
    ringHsl: "350 89% 60%",
  },
  {
    id: "amber",
    label: "Warm Amber",
    dotColor: "#f59e0b",
    brandHsl: "38 92% 50%",
    brandForeground: "0 0% 100%",
    brandMuted: "38 85% 95%",
    ringHsl: "38 92% 50%",
  },
  {
    id: "slate",
    label: "Minimal Slate",
    dotColor: "#64748b",
    brandHsl: "215 16% 47%",
    brandForeground: "0 0% 100%",
    brandMuted: "215 16% 95%",
    ringHsl: "215 16% 47%",
  },
];

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
  } catch {
    /* ignore */
  }
  return { field: "updatedAt", dir: "desc" };
}

function readGroupBy(): GroupBy {
  if (typeof localStorage === "undefined") return "none";
  const v = localStorage.getItem(GROUP_BY_KEY);
  if (v === "color" || v === "month" || v === "pinned") return v as GroupBy;
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

export function readAccentColor(): AccentColor {
  if (typeof localStorage === "undefined") return "indigo";
  const v = localStorage.getItem(ACCENT_KEY);
  return (v as AccentColor) || "indigo";
}

export function readFontFamily(): FontFamily {
  if (typeof localStorage === "undefined") return "sans";
  const v = localStorage.getItem(FONT_KEY);
  return (v as FontFamily) || "sans";
}

export function readCardDensity(): CardDensity {
  if (typeof localStorage === "undefined") return "comfortable";
  const v = localStorage.getItem(DENSITY_KEY);
  return (v as CardDensity) || "comfortable";
}

export function readSoundEffects(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(SOUND_KEY);
  return v !== "false";
}

export function readShowWordCount(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(WORD_COUNT_KEY);
  return v !== "false";
}

export function readShowRelativeTime(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(REL_TIME_KEY);
  return v !== "false";
}

export function readShowColorRibbon(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(RIBBON_KEY);
  return v !== "false";
}

export function readShowWidgetBadges(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(WIDGET_BADGES_KEY);
  return v !== "false";
}

export function readUserDisplayName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(USER_NAME_KEY) || "";
}

export function readShowGreetingHeader(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(GREETING_KEY);
  return v !== "false";
}

export function applyAccentToDocument(accent: AccentColor) {
  if (typeof document === "undefined") return;
  const def = ACCENT_COLORS.find((a) => a.id === accent) || ACCENT_COLORS[0];
  const root = document.documentElement;
  root.style.setProperty("--brand", def.brandHsl);
  root.style.setProperty("--brand-foreground", def.brandForeground);
  root.style.setProperty("--brand-muted", def.brandMuted);
  root.style.setProperty("--ring", def.ringHsl);
  root.style.setProperty("--selection", def.brandHsl);
  root.setAttribute("data-accent", def.id);
}

export function applyFontToDocument(font: FontFamily) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font", font);
}

export function applyDensityToDocument(density: CardDensity) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-density", density);
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

// Initial hydration
applyZoomToDocument(readZoomLevel());
applyAccentToDocument(readAccentColor());
applyFontToDocument(readFontFamily());
applyDensityToDocument(readCardDensity());

// Broadcast channel to sync UI preferences across open Tauri windows
let syncChannel: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    syncChannel = new BroadcastChannel("stash_ui_sync");
  } catch {
    /* ignore */
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

  // Personalization settings
  accentColor: AccentColor;
  fontFamily: FontFamily;
  cardDensity: CardDensity;
  quickFilter: QuickFilter;
  dateHorizon: DateHorizon;
  soundEffectsEnabled: boolean;
  showWordCount: boolean;
  showRelativeTime: boolean;
  showColorRibbon: boolean;
  showWidgetBadges: boolean;
  userDisplayName: string;
  showGreetingHeader: boolean;

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

  // Personalization setters
  setAccentColor: (accent: AccentColor, broadcast?: boolean) => void;
  setFontFamily: (font: FontFamily, broadcast?: boolean) => void;
  setCardDensity: (density: CardDensity, broadcast?: boolean) => void;
  setQuickFilter: (filter: QuickFilter) => void;
  setDateHorizon: (horizon: DateHorizon) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setShowWordCount: (show: boolean) => void;
  setShowRelativeTime: (show: boolean) => void;
  setShowColorRibbon: (show: boolean) => void;
  setShowWidgetBadges: (show: boolean) => void;
  setUserDisplayName: (name: string) => void;
  setShowGreetingHeader: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
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

  accentColor: readAccentColor(),
  fontFamily: readFontFamily(),
  cardDensity: readCardDensity(),
  quickFilter: "all",
  dateHorizon: "all",
  soundEffectsEnabled: readSoundEffects(),
  showWordCount: readShowWordCount(),
  showRelativeTime: readShowRelativeTime(),
  showColorRibbon: readShowColorRibbon(),
  showWidgetBadges: readShowWidgetBadges(),
  userDisplayName: readUserDisplayName(),
  showGreetingHeader: readShowGreetingHeader(),

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
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "zoom", zoomLevel: clamped });
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

  setAccentColor: (accent, broadcast = true) => {
    applyAccentToDocument(accent);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ACCENT_KEY, accent);
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "accent", accentColor: accent });
    }
    set({ accentColor: accent });
  },

  setFontFamily: (font, broadcast = true) => {
    applyFontToDocument(font);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(FONT_KEY, font);
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "font", fontFamily: font });
    }
    set({ fontFamily: font });
  },

  setCardDensity: (density, broadcast = true) => {
    applyDensityToDocument(density);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DENSITY_KEY, density);
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "density", cardDensity: density });
    }
    set({ cardDensity: density });
  },

  setQuickFilter: (quickFilter) => set({ quickFilter }),
  setDateHorizon: (dateHorizon) => set({ dateHorizon }),

  setSoundEffectsEnabled: (enabled) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SOUND_KEY, String(enabled));
    }
    set({ soundEffectsEnabled: enabled });
  },

  setShowWordCount: (show) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(WORD_COUNT_KEY, String(show));
    }
    set({ showWordCount: show });
  },

  setShowRelativeTime: (show) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(REL_TIME_KEY, String(show));
    }
    set({ showRelativeTime: show });
  },

  setShowColorRibbon: (show) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(RIBBON_KEY, String(show));
    }
    set({ showColorRibbon: show });
  },

  setShowWidgetBadges: (show) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(WIDGET_BADGES_KEY, String(show));
    }
    set({ showWidgetBadges: show });
  },

  setUserDisplayName: (name) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(USER_NAME_KEY, name);
    }
    set({ userDisplayName: name });
  },

  setShowGreetingHeader: (show) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(GREETING_KEY, String(show));
    }
    set({ showGreetingHeader: show });
  },
}));

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === "zoom" && typeof data.zoomLevel === "number") {
      applyZoomToDocument(data.zoomLevel);
      useUIStore.setState({ zoomLevel: data.zoomLevel });
    } else if (data.type === "accent" && typeof data.accentColor === "string") {
      applyAccentToDocument(data.accentColor);
      useUIStore.setState({ accentColor: data.accentColor });
    } else if (data.type === "font" && typeof data.fontFamily === "string") {
      applyFontToDocument(data.fontFamily);
      useUIStore.setState({ fontFamily: data.fontFamily });
    } else if (data.type === "density" && typeof data.cardDensity === "string") {
      applyDensityToDocument(data.cardDensity);
      useUIStore.setState({ cardDensity: data.cardDensity });
    }
  };
}
