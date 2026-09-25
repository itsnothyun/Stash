import { create } from "zustand";
import { NoteColor } from "@/features/stash/types/color";
import { SidebarSection } from "@/features/stash/types/note";
import {
  PaperPattern,
  NoteFontPersona,
  NoteFrameStyle,
  DEFAULT_PAPER_KEY,
  DEFAULT_FONT_PERSONA_KEY,
  DEFAULT_FRAME_KEY,
  DEFAULT_OPACITY_KEY,
} from "@/features/stash/note-meta";
import {
  AppTheme,
  TerminalUXSettings,
  DEFAULT_TERMINAL_SETTINGS,
  THEMES_LIST,
} from "@/lib/themes/theme-definitions";

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

// New settings keys
export const EDITOR_FONT_SIZE_KEY = "stash_editor_font_size";
export const EDITOR_LINE_HEIGHT_KEY = "stash_editor_line_height";
export const EDITOR_SPELLCHECK_KEY = "stash_editor_spellcheck";
export const AUTO_TITLE_KEY = "stash_auto_title_first_line";
export const INLINE_MATH_KEY = "stash_inline_math_enabled";
export const DIRECT_LINK_CLICK_KEY = "stash_direct_link_click";
export const DEFAULT_WINDOW_SIZE_KEY = "stash_default_window_size";
export const MASK_LOCKED_PREVIEWS_KEY = "stash_mask_locked_previews";
export const AUTO_LOCK_TIMEOUT_KEY = "stash_auto_lock_timeout";
export const THEME_KEY = "stash_app_theme";
export const TERMINAL_SETTINGS_KEY = "stash_terminal_settings";
export const ICON_SET_KEY = "stash_icon_set";

export type IconSet = "colorful" | "monochrome";
export type { AppTheme, TerminalUXSettings };

export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 70;
export const MAX_ZOOM = 200;
export const ZOOM_STEP = 10;
export const ZOOM_PRESETS = [75, 90, 100, 110, 125, 150] as const;

export type SortField = "updatedAt" | "createdAt" | "title" | "color" | "words";
export type SortDir = "desc" | "asc";
export type GroupBy = "none" | "color" | "month" | "pinned";

export type SettingsTab =
  | "general"
  | "appearance"
  | "personalization"
  | "editor"
  | "notes"
  | "security"
  | "shortcuts"
  | "data"
  | "about";

export type EditorFontSize = "13px" | "14px" | "16px" | "18px";
export type EditorLineHeight = "tight" | "normal" | "relaxed";
export type DefaultWindowSize = "compact" | "standard" | "spacious";

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

export function readEditorFontSize(): EditorFontSize {
  if (typeof localStorage === "undefined") return "14px";
  const v = localStorage.getItem(EDITOR_FONT_SIZE_KEY);
  return (v as EditorFontSize) || "14px";
}

export function readEditorLineHeight(): EditorLineHeight {
  if (typeof localStorage === "undefined") return "normal";
  const v = localStorage.getItem(EDITOR_LINE_HEIGHT_KEY);
  return (v as EditorLineHeight) || "normal";
}

export function readEditorSpellcheck(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(EDITOR_SPELLCHECK_KEY) !== "false";
}

export function readAutoTitle(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(AUTO_TITLE_KEY) !== "false";
}

export function readInlineMath(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(INLINE_MATH_KEY) !== "false";
}

export function readDirectLinkClick(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DIRECT_LINK_CLICK_KEY) === "true";
}

export function readDefaultPaper(): PaperPattern {
  if (typeof localStorage === "undefined") return "plain";
  const v = localStorage.getItem(DEFAULT_PAPER_KEY);
  return (v as PaperPattern) || "plain";
}

export function readDefaultFontPersona(): NoteFontPersona {
  if (typeof localStorage === "undefined") return "sans";
  const v = localStorage.getItem(DEFAULT_FONT_PERSONA_KEY);
  return (v as NoteFontPersona) || "sans";
}

export function readDefaultFrame(): NoteFrameStyle {
  if (typeof localStorage === "undefined") return "default";
  const v = localStorage.getItem(DEFAULT_FRAME_KEY);
  return (v as NoteFrameStyle) || "default";
}

export function readDefaultOpacity(): number {
  if (typeof localStorage === "undefined") return 100;
  const v = localStorage.getItem(DEFAULT_OPACITY_KEY);
  const parsed = v ? parseInt(v, 10) : 100;
  return isNaN(parsed) ? 100 : parsed;
}

export function readDefaultWindowSize(): DefaultWindowSize {
  if (typeof localStorage === "undefined") return "standard";
  const v = localStorage.getItem(DEFAULT_WINDOW_SIZE_KEY);
  return (v as DefaultWindowSize) || "standard";
}

export function readMaskLockedPreviews(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(MASK_LOCKED_PREVIEWS_KEY) !== "false";
}

export function readAutoLockTimeout(): number {
  if (typeof localStorage === "undefined") return 15;
  const v = localStorage.getItem(AUTO_LOCK_TIMEOUT_KEY);
  const parsed = v ? parseInt(v, 10) : 15;
  return isNaN(parsed) ? 15 : parsed;
}

export function readTheme(): AppTheme {
  if (typeof localStorage === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  return (v as AppTheme) || "dark";
}

export function readTerminalSettings(): TerminalUXSettings {
  if (typeof localStorage === "undefined") return DEFAULT_TERMINAL_SETTINGS;
  try {
    const raw = localStorage.getItem(TERMINAL_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_TERMINAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_TERMINAL_SETTINGS;
}

export function readIconSet(): IconSet {
  if (typeof localStorage === "undefined") return "colorful";
  const v = localStorage.getItem(ICON_SET_KEY);
  return v === "monochrome" ? "monochrome" : "colorful";
}

export function applyThemeToDocument(theme: AppTheme, terminalSettings?: TerminalUXSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  let effectiveTheme = theme;
  if (theme === "system") {
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    effectiveTheme = prefersDark ? "dark" : "light";
  }

  root.setAttribute("data-theme", effectiveTheme);

  const themeDef = THEMES_LIST.find((t) => t.id === effectiveTheme);
  const isDark = themeDef ? themeDef.isDark : effectiveTheme !== "light";

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const tSettings = terminalSettings || readTerminalSettings();
  if (tSettings.sharpBorders || themeDef?.isTerminalStyle) {
    root.setAttribute("data-terminal-sharp", "true");
  } else {
    root.removeAttribute("data-terminal-sharp");
  }

  if (tSettings.glowEffects) {
    root.setAttribute("data-terminal-glow", "true");
  } else {
    root.removeAttribute("data-terminal-glow");
  }

  if (themeDef?.recommendedFont && (effectiveTheme === "terminal" || effectiveTheme === "amber-crt")) {
    root.setAttribute("data-font", "mono");
  }
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

export function applyIconSetToDocument(iconSet: IconSet) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-icon-set", iconSet);
}

export function applyEditorStylesToDocument(fontSize: EditorFontSize, lineHeight: EditorLineHeight) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--stash-editor-font-size", fontSize);
  const lhMap: Record<EditorLineHeight, string> = {
    tight: "1.375",
    normal: "1.625",
    relaxed: "1.875",
  };
  root.style.setProperty("--stash-editor-line-height", lhMap[lineHeight] || "1.625");
}

export function applyZoomToDocument(level: number) {
  const factor = level / 100;
  const isTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauriRuntime) {
    // Native Tauri webview zoom (hardware-accelerated Webview2 scaling). This
    // scales pointer hit-testing along with rendering, so it must be the only
    // zoom mechanism in Tauri — stacking CSS zoom on top double-compounds the
    // scale and desyncs click coordinates from Radix Portal content (dropdown
    // menus render at their trigger's getBoundingClientRect(), computed once,
    // and go stale against a second, independently-timed zoom layer).
    import("@tauri-apps/api/webview")
      .then(({ getCurrentWebview }) => {
        const webview = getCurrentWebview();
        if (webview && typeof webview.setZoom === "function") {
          webview.setZoom(factor).catch(() => {});
        }
      })
      .catch(() => {});
    return;
  }

  // Browser fallback: no native zoom API, so use CSS zoom instead.
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
applyIconSetToDocument(readIconSet());
applyEditorStylesToDocument(readEditorFontSize(), readEditorLineHeight());
applyThemeToDocument(readTheme(), readTerminalSettings());

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
  theme: AppTheme;
  terminalSettings: TerminalUXSettings;
  zoomLevel: number;
  sortField: SortField;
  sortDir: SortDir;
  groupBy: GroupBy;

  // Personalization settings
  accentColor: AccentColor;
  iconSet: IconSet;
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

  // New Editor & Writing settings
  editorFontSize: EditorFontSize;
  editorLineHeight: EditorLineHeight;
  editorSpellcheck: boolean;
  autoTitleFromFirstLine: boolean;
  inlineMathEnabled: boolean;
  directLinkClick: boolean;

  // New Note & Floating Window defaults
  defaultPaper: PaperPattern;
  defaultFontPersona: NoteFontPersona;
  defaultFrame: NoteFrameStyle;
  defaultOpacity: number;
  defaultWindowSize: DefaultWindowSize;

  // New Security & Privacy settings
  maskLockedPreviews: boolean;
  autoLockTimeout: number;

  // Settings initial tab navigation
  settingsInitialTab: SettingsTab | null;

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
  setSettingsInitialTab: (tab: SettingsTab | null) => void;
  openSettingsToTab: (tab: SettingsTab) => void;
  setTheme: (theme: AppTheme, broadcast?: boolean) => void;
  setTerminalSettings: (settings: Partial<TerminalUXSettings>, broadcast?: boolean) => void;
  setZoomLevel: (level: number, broadcast?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setSort: (field: SortField, dir: SortDir) => void;
  toggleSortDir: () => void;
  setGroupBy: (g: GroupBy) => void;

  // Personalization setters
  setAccentColor: (accent: AccentColor, broadcast?: boolean) => void;
  setIconSet: (iconSet: IconSet, broadcast?: boolean) => void;
  toggleIconSet: (broadcast?: boolean) => void;
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

  // Editor setters
  setEditorFontSize: (size: EditorFontSize, broadcast?: boolean) => void;
  setEditorLineHeight: (height: EditorLineHeight, broadcast?: boolean) => void;
  setEditorSpellcheck: (spellcheck: boolean, broadcast?: boolean) => void;
  setAutoTitleFromFirstLine: (autoTitle: boolean) => void;
  setInlineMathEnabled: (enabled: boolean) => void;
  setDirectLinkClick: (direct: boolean) => void;

  // Note default setters
  setDefaultPaper: (paper: PaperPattern) => void;
  setDefaultFontPersona: (font: NoteFontPersona) => void;
  setDefaultFrame: (frame: NoteFrameStyle) => void;
  setDefaultOpacity: (opacity: number) => void;
  setDefaultWindowSize: (size: DefaultWindowSize) => void;

  // Security setters
  setMaskLockedPreviews: (mask: boolean, broadcast?: boolean) => void;
  setAutoLockTimeout: (timeout: number) => void;
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
  settingsInitialTab: null,
  theme: readTheme(),
  terminalSettings: readTerminalSettings(),
  zoomLevel: readZoomLevel(),
  sortField: readSort().field,
  sortDir: readSort().dir,
  groupBy: readGroupBy(),

  accentColor: readAccentColor(),
  iconSet: readIconSet(),
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

  editorFontSize: readEditorFontSize(),
  editorLineHeight: readEditorLineHeight(),
  editorSpellcheck: readEditorSpellcheck(),
  autoTitleFromFirstLine: readAutoTitle(),
  inlineMathEnabled: readInlineMath(),
  directLinkClick: readDirectLinkClick(),

  defaultPaper: readDefaultPaper(),
  defaultFontPersona: readDefaultFontPersona(),
  defaultFrame: readDefaultFrame(),
  defaultOpacity: readDefaultOpacity(),
  defaultWindowSize: readDefaultWindowSize(),

  maskLockedPreviews: readMaskLockedPreviews(),
  autoLockTimeout: readAutoLockTimeout(),

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
  setSettingsInitialTab: (tab) => set({ settingsInitialTab: tab }),
  openSettingsToTab: (tab) => set({ settingsOpen: true, settingsInitialTab: tab }),
  setTheme: (theme, broadcast = true) => {
    set({ theme });
    applyThemeToDocument(theme, get().terminalSettings);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, theme);
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "theme", theme });
    }
  },
  setTerminalSettings: (patch, broadcast = true) => {
    const updated = { ...get().terminalSettings, ...patch };
    set({ terminalSettings: updated });
    applyThemeToDocument(get().theme, updated);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TERMINAL_SETTINGS_KEY, JSON.stringify(updated));
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "terminalSettings", terminalSettings: updated });
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

  setIconSet: (iconSet, broadcast = true) => {
    applyIconSetToDocument(iconSet);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ICON_SET_KEY, iconSet);
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "icon_set", iconSet });
    }
    set({ iconSet });
  },

  toggleIconSet: (broadcast = true) => {
    const next = get().iconSet === "colorful" ? "monochrome" : "colorful";
    get().setIconSet(next, broadcast);
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

  setEditorFontSize: (fontSize, broadcast = true) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(EDITOR_FONT_SIZE_KEY, fontSize);
    }
    applyEditorStylesToDocument(fontSize, get().editorLineHeight);
    if (broadcast && syncChannel) {
      syncChannel.postMessage({
        type: "editor_styles",
        fontSize,
        lineHeight: get().editorLineHeight,
      });
    }
    set({ editorFontSize: fontSize });
  },

  setEditorLineHeight: (lineHeight, broadcast = true) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(EDITOR_LINE_HEIGHT_KEY, lineHeight);
    }
    applyEditorStylesToDocument(get().editorFontSize, lineHeight);
    if (broadcast && syncChannel) {
      syncChannel.postMessage({
        type: "editor_styles",
        fontSize: get().editorFontSize,
        lineHeight,
      });
    }
    set({ editorLineHeight: lineHeight });
  },

  setEditorSpellcheck: (spellcheck, broadcast = true) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(EDITOR_SPELLCHECK_KEY, String(spellcheck));
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "editor_spellcheck", spellcheck });
    }
    set({ editorSpellcheck: spellcheck });
  },

  setAutoTitleFromFirstLine: (autoTitle) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTO_TITLE_KEY, String(autoTitle));
    }
    set({ autoTitleFromFirstLine: autoTitle });
  },

  setInlineMathEnabled: (enabled) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INLINE_MATH_KEY, String(enabled));
    }
    set({ inlineMathEnabled: enabled });
  },

  setDirectLinkClick: (direct) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DIRECT_LINK_CLICK_KEY, String(direct));
    }
    set({ directLinkClick: direct });
  },

  setDefaultPaper: (paper) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEFAULT_PAPER_KEY, paper);
    }
    set({ defaultPaper: paper });
  },

  setDefaultFontPersona: (font) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEFAULT_FONT_PERSONA_KEY, font);
    }
    set({ defaultFontPersona: font });
  },

  setDefaultFrame: (frame) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEFAULT_FRAME_KEY, frame);
    }
    set({ defaultFrame: frame });
  },

  setDefaultOpacity: (opacity) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEFAULT_OPACITY_KEY, String(opacity));
    }
    set({ defaultOpacity: opacity });
  },

  setDefaultWindowSize: (size) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEFAULT_WINDOW_SIZE_KEY, size);
    }
    set({ defaultWindowSize: size });
  },

  setMaskLockedPreviews: (mask, broadcast = true) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(MASK_LOCKED_PREVIEWS_KEY, String(mask));
    }
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "mask_previews", mask });
    }
    set({ maskLockedPreviews: mask });
  },

  setAutoLockTimeout: (timeout) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTO_LOCK_TIMEOUT_KEY, String(timeout));
    }
    set({ autoLockTimeout: timeout });
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
    } else if (data.type === "icon_set" && typeof data.iconSet === "string") {
      applyIconSetToDocument(data.iconSet as IconSet);
      useUIStore.setState({ iconSet: data.iconSet as IconSet });
    } else if (data.type === "font" && typeof data.fontFamily === "string") {
      applyFontToDocument(data.fontFamily);
      useUIStore.setState({ fontFamily: data.fontFamily });
    } else if (data.type === "density" && typeof data.cardDensity === "string") {
      applyDensityToDocument(data.cardDensity);
      useUIStore.setState({ cardDensity: data.cardDensity });
    } else if (data.type === "editor_styles") {
      applyEditorStylesToDocument(data.fontSize, data.lineHeight);
      useUIStore.setState({
        editorFontSize: data.fontSize,
        editorLineHeight: data.lineHeight,
      });
    } else if (data.type === "editor_spellcheck") {
      useUIStore.setState({ editorSpellcheck: data.spellcheck });
    } else if (data.type === "mask_previews") {
      useUIStore.setState({ maskLockedPreviews: data.mask });
    } else if (data.type === "theme" && typeof data.theme === "string") {
      const currentTerminal = useUIStore.getState().terminalSettings;
      applyThemeToDocument(data.theme as AppTheme, currentTerminal);
      useUIStore.setState({ theme: data.theme as AppTheme });
    } else if (data.type === "terminalSettings" && data.terminalSettings) {
      const currentTheme = useUIStore.getState().theme;
      applyThemeToDocument(currentTheme, data.terminalSettings);
      useUIStore.setState({ terminalSettings: data.terminalSettings });
    }
  };
}
