import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import {
  useUIStore,
  ZOOM_PRESETS,
  MIN_ZOOM,
  MAX_ZOOM,
  ACCENT_COLORS,
  FontFamily,
  CardDensity,
  EditorFontSize,
  EditorLineHeight,
  DefaultWindowSize,
  SettingsTab,
} from "@/stores/ui-store";
import {
  playSuccessSound,
  playPopSound,
  playClickSound,
} from "@/lib/utils/sound-effects";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { Note, Settings } from "@/features/stash/types/note";
import { NOTE_COLORS } from "@/features/stash/types/color";
import {
  PAPER_PATTERNS,
  FONT_PERSONAS,
  FRAME_STYLES,
  getPaperPatternStyle,
  getProtectedNotesCount,
  getUnlockedInSessionCount,
  lockAllProtectedNotes,
  clearAllNotePins,
} from "@/features/stash/note-meta";
import { taskSummary } from "@/features/stash/task-summary";
import {
  downloadMarkdownArchive,
  copyAllNotesAsMarkdown,
} from "@/lib/utils/markdown-export";
import {
  formatShortcut,
  SHORTCUTS,
  SHORTCUTS_LIST,
  exportShortcutsMarkdown,
  ShortcutCategory,
} from "@/lib/keyboard/shortcuts";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Check,
  CopySimple as Copy,
  DownloadSimple as Download,
  FileText,
  Keyboard,
  Stack as Layers,
  LockSimple as Lock,
  Minus,
  Desktop as Monitor,
  Moon,
  Plus,
  ArrowCounterClockwise as RotateCcw,
  MagnifyingGlass as Search,
  Shield,
  ShieldCheck,
  Faders as Sliders,
  Sparkle as Sparkles,
  Sun,
  Trash as Trash2,
  TextT as Type,
  LockSimpleOpen as Unlock,
  UploadSimple as Upload,
  SpeakerHigh as Volume2,
  Palette,
  Terminal,
} from "@phosphor-icons/react";
import {
  THEMES_LIST,
  THEME_CATEGORIES,
  ThemeCategory,
  TERMINAL_PROMPTS,
} from "@/lib/themes/theme-definitions";
import { cn } from "@/lib/utils/cn";

const TABS: { id: SettingsTab; label: string; icon: typeof Layers }[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "editor", label: "Editor & Writing", icon: Type },
  { id: "notes", label: "Notes & Defaults", icon: Layers },
  { id: "security", label: "Vault & Privacy", icon: Shield },
  { id: "shortcuts", label: "Shortcuts Matrix", icon: Keyboard },
  { id: "data", label: "Data & Insights", icon: FileText },
  { id: "about", label: "About", icon: Sparkles },
];

/** A labelled row with its control on the right — the only row shape here. */
const Row: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => (
  <div className={cn("flex items-start justify-between gap-6", className)}>
    <div className="min-w-0">
      <div className="text-xs font-medium text-foreground">{title}</div>
      {description && (
        <div className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">
          {description}
        </div>
      )}
    </div>
    <div className="shrink-0 pt-0.5">{children}</div>
  </div>
);

const ShortcutRecorder: React.FC<{
  value: string;
  onSave: (s: string) => Promise<void>;
}> = ({ value, onSave }) => {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      setRecording(false);
      setDraft(value);
      return;
    }
    const mods: string[] = [];
    if (e.ctrlKey || e.metaKey) mods.push("CommandOrControl");
    if (e.shiftKey) mods.push("Shift");
    if (e.altKey) mods.push("Alt");
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (["Control", "Meta", "Shift", "Alt"].includes(key)) return;
    const combo = [...mods, key].join("+");
    setDraft(combo);
    setRecording(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          "rounded border px-2.5 py-1 font-mono text-[11px] outline-none transition-colors",
          recording
            ? "border-brand bg-brand/10 text-foreground ring-2 ring-brand/30"
            : "border-border bg-muted/60 text-foreground"
        )}
      >
        {recording ? "Press key combo…" : draft}
      </div>
      {!recording ? (
        <Button size="sm" variant="outline" onClick={() => setRecording(true)}>
          Record
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRecording(false);
            setDraft(value);
          }}
        >
          Cancel
        </Button>
      )}
      {draft !== value && !recording && (
        <Button size="sm" onClick={() => void onSave(draft)}>
          Apply
        </Button>
      )}
    </div>
  );
};

export const SettingsModal: React.FC = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    settingsInitialTab,
    setSettingsInitialTab,
    theme,
    setTheme,
    setRoute,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    accentColor,
    setAccentColor,
    fontFamily,
    setFontFamily,
    cardDensity,
    setCardDensity,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    showWordCount,
    setShowWordCount,
    showRelativeTime,
    setShowRelativeTime,
    showColorRibbon,
    setShowColorRibbon,
    showWidgetBadges,
    setShowWidgetBadges,
    userDisplayName,
    setUserDisplayName,
    showGreetingHeader,
    setShowGreetingHeader,
    // Editor settings
    editorFontSize,
    setEditorFontSize,
    editorLineHeight,
    setEditorLineHeight,
    editorSpellcheck,
    setEditorSpellcheck,
    autoTitleFromFirstLine,
    setAutoTitleFromFirstLine,
    inlineMathEnabled,
    setInlineMathEnabled,
    directLinkClick,
    setDirectLinkClick,
    // Note default settings
    defaultPaper,
    setDefaultPaper,
    defaultFontPersona,
    setDefaultFontPersona,
    defaultFrame,
    setDefaultFrame,
    defaultOpacity,
    setDefaultOpacity,
    defaultWindowSize,
    setDefaultWindowSize,
    // Security settings
    maskLockedPreviews,
    setMaskLockedPreviews,
    autoLockTimeout,
    setAutoLockTimeout,
    terminalSettings,
    setTerminalSettings,
  } = useUIStore();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [justSaved, setJustSaved] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmClearPins, setConfirmClearPins] = useState(false);
  const [shortcutsSearch, setShortcutsSearch] = useState("");
  const [shortcutCategory, setShortcutCategory] = useState<"all" | ShortcutCategory>("all");
  const [themeCategory, setThemeCategory] = useState<ThemeCategory>("all");
  const [protectedCount, setProtectedCount] = useState<number>(0);
  const [unlockedCount, setUnlockedCount] = useState<number>(0);

  const [vaultStats, setVaultStats] = useState<{
    totalNotes: number;
    activeNotes: number;
    archivedNotes: number;
    trashNotes: number;
    pinnedNotes: number;
    favoriteNotes: number;
    totalWords: number;
    totalTasks: number;
    completedTasks: number;
    estimatedKb: number;
    allNotes: Note[];
  }>({
    totalNotes: 0,
    activeNotes: 0,
    archivedNotes: 0,
    trashNotes: 0,
    pinnedNotes: 0,
    favoriteNotes: 0,
    totalWords: 0,
    totalTasks: 0,
    completedTasks: 0,
    estimatedKb: 0,
    allNotes: [],
  });

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (settingsInitialTab) {
      setActiveTab(settingsInitialTab);
      setSettingsInitialTab(null);
    }
  }, [settingsInitialTab, setSettingsInitialTab]);

  const loadVaultStats = useCallback(async () => {
    try {
      const active = await stashIpc.listNotes();
      const archived = await stashIpc.listNotes("archive");
      const trash = await stashIpc.listNotes("trash");
      const all = [...active, ...archived, ...trash];

      let words = 0;
      let totalTasks = 0;
      let doneTasks = 0;
      let pinned = 0;
      let favorites = 0;

      for (const n of all) {
        if (n.plainText) {
          const w = n.plainText.trim().split(/\s+/).filter(Boolean).length;
          words += w;
        }
        if (n.isPinned) pinned++;
        if (n.isFavorite) favorites++;
        const s = taskSummary(n.contentJson);
        totalTasks += s.total;
        doneTasks += s.done;
      }

      const rawJson = JSON.stringify(all);
      const kb = Math.round((rawJson.length * 2) / 1024);

      setVaultStats({
        totalNotes: all.length,
        activeNotes: active.length,
        archivedNotes: archived.length,
        trashNotes: trash.length,
        pinnedNotes: pinned,
        favoriteNotes: favorites,
        totalWords: words,
        totalTasks,
        completedTasks: doneTasks,
        estimatedKb: Math.max(1, kb),
        allNotes: all,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      stashIpc.getSettings().then(setSettings);
      setProtectedCount(getProtectedNotesCount());
      setUnlockedCount(getUnlockedInSessionCount());
      loadVaultStats();
    }
  }, [settingsOpen, loadVaultStats]);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    []
  );

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    void stashIpc.updateSettings(next);

    setJustSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 1500);
  };

  const handleExport = async () => {
    try {
      const data = await stashIpc.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stash-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show({
        message: "Export complete",
        description: `${data.notes.length} notes written to a JSON backup.`,
      });
    } catch {
      toast.error("Export failed", "Nothing was written.");
    }
  };

  const handleExportMarkdownArchive = () => {
    const activeNotes = vaultStats.allNotes.filter((n) => n.deletedAt === null);
    if (activeNotes.length === 0) {
      toast.show({ message: "No notes available to export" });
      return;
    }
    downloadMarkdownArchive(activeNotes);
    if (soundEffectsEnabled) playSuccessSound();
    toast.show({
      message: "Markdown archive created",
      description: `Exported ${activeNotes.length} notes to a formatted Markdown digest.`,
    });
  };

  const handleCopyMarkdownToClipboard = async () => {
    const activeNotes = vaultStats.allNotes.filter((n) => n.deletedAt === null);
    if (activeNotes.length === 0) {
      toast.show({ message: "No notes available to copy" });
      return;
    }
    const success = await copyAllNotesAsMarkdown(activeNotes);
    if (success) {
      if (soundEffectsEnabled) playSuccessSound();
      toast.show({
        message: "Copied all notes as Markdown",
        description: `${activeNotes.length} notes copied to clipboard.`,
      });
    } else {
      toast.error("Clipboard copy failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.notes)) {
        throw new Error("unrecognised backup");
      }
      await stashIpc.importData(parsed);
      loadVaultStats();
      toast.show({
        message: "Import complete",
        description: `${parsed.notes.length} notes added to your stash.`,
      });
    } catch {
      toast.error(
        "Import failed",
        "That file isn't a Stash backup. Your existing notes are untouched."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleEmptyTrash = async () => {
    await stashIpc.emptyTrash();
    setConfirmEmpty(false);
    loadVaultStats();
    toast.show({ message: "Trash emptied" });
  };

  const handleClearAllPins = () => {
    clearAllNotePins();
    setProtectedCount(0);
    setUnlockedCount(0);
    setConfirmClearPins(false);
    if (soundEffectsEnabled) playSuccessSound();
    toast.show({
      message: "PIN locks removed",
      description: "All notes in your stash are now unlocked.",
    });
  };

  const handleLockAllNow = () => {
    lockAllProtectedNotes();
    setUnlockedCount(0);
    if (soundEffectsEnabled) playClickSound();
    toast.show({
      message: "Vault locked",
      description: "All protected stashes are now locked.",
    });
  };

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_LIST.filter((s) => {
      const matchesCat = shortcutCategory === "all" || s.category === shortcutCategory;
      if (!matchesCat) return false;
      if (!shortcutsSearch.trim()) return true;
      const q = shortcutsSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.toLowerCase().includes(q) ||
        s.context.toLowerCase().includes(q)
      );
    });
  }, [shortcutCategory, shortcutsSearch]);

  const handleCopyShortcutsMarkdown = async () => {
    const md = exportShortcutsMarkdown();
    await navigator.clipboard.writeText(md);
    if (soundEffectsEnabled) playSuccessSound();
    toast.show({
      message: "Shortcuts copied",
      description: "Full markdown shortcuts table copied to clipboard.",
    });
  };

  return (
    <>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 rounded-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-sm font-semibold">Settings & Preferences</DialogTitle>
              <span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                v0.1.0
              </span>
            </div>
            {justSaved && (
              <span className="flex items-center gap-1 pr-6 text-2xs font-medium text-success">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </DialogHeader>

          <div className="flex h-[520px]">
            {/* Sidebar navigation */}
            <nav className="w-48 shrink-0 space-y-0.5 border-r border-border bg-surface p-2.5 overflow-y-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (soundEffectsEnabled) playClickSound();
                    }}
                    className={cn(
                      "w-full rounded-md px-2.5 py-[7px] text-left text-xs transition-colors flex items-center gap-2.5 cursor-pointer",
                      isSelected
                        ? "bg-surface-hover font-medium text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/60"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isSelected ? "text-brand" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Tab content area */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* -------------------- GENERAL TAB -------------------- */}
              {activeTab === "general" && settings && (
                <>
                  <Row
                    title="Welcome Carousel"
                    description="The first-run onboarding carousel. It stays dismissed until you open it again."
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        update("hasCompletedOnboarding", false);
                        setRoute("onboarding");
                        setSettingsOpen(false);
                      }}
                    >
                      Show again
                    </Button>
                  </Row>

                  <Row
                    title="Close to tray"
                    description="Keep Stash running in the background when the library window closes."
                    className="border-t border-border pt-4"
                  >
                    <Switch
                      checked={settings.closeToTray}
                      onCheckedChange={(v) => update("closeToTray", v)}
                    />
                  </Row>

                  <Row
                    title="Restore open stashes"
                    description="Reopen the floating notes you left open when Stash restarts."
                  >
                    <Switch
                      checked={settings.restoreOpenNotes}
                      onCheckedChange={(v) => update("restoreOpenNotes", v)}
                    />
                  </Row>

                  <Row
                    title="Launch at startup"
                    description="Automatically start Stash when your computer boots up."
                    className="border-t border-border pt-4"
                  >
                    <Switch
                      checked={settings.launchAtStartup}
                      onCheckedChange={(v) => update("launchAtStartup", v)}
                    />
                  </Row>

                  <Row
                    title="Global quick capture shortcut"
                    description="Works from any application to quickly capture a new stash."
                    className="border-t border-border pt-4"
                  >
                    <ShortcutRecorder
                      value={settings.globalShortcut || "CommandOrControl+Shift+N"}
                      onSave={async (newShortcut) => {
                        try {
                          await stashIpc.updateGlobalShortcut(newShortcut);
                          update("globalShortcut", newShortcut);
                          toast.show({
                            message: "Global shortcut updated",
                            description: newShortcut,
                          });
                        } catch (err: any) {
                          toast.error(
                            "Invalid shortcut",
                            err?.message ?? "Could not register that key combination."
                          );
                        }
                      }}
                    />
                  </Row>
                </>
              )}

              {/* -------------------- APPEARANCE TAB (THEME STUDIO & TERMINAL UX) -------------------- */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  {/* Quick Base Mode Switcher */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">Base Mode</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        Active: {theme}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "system", label: "System Default", icon: Monitor },
                          { id: "light", label: "Light Canvas", icon: Sun },
                          { id: "dark", label: "Dark Canvas", icon: Moon },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const selected = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setTheme(item.id);
                              update("theme", item.id);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-md border p-3 transition-all cursor-pointer",
                              selected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30 text-foreground font-semibold"
                                : "border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-2xs font-medium">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme Studio & Gallery */}
                  <div className="border-t border-border pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div>
                        <span className="block text-xs font-semibold text-foreground">
                          Theme Studio & Visual Palettes
                        </span>
                        <p className="text-2xs text-muted-foreground">
                          Select from 14 curated aesthetics including Terminal Hacker CLI, Retro Amber CRT, Cyberpunk, and code editor palettes.
                        </p>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3.5 mt-2">
                      {THEME_CATEGORIES.map((cat) => {
                        const isCatSelected = themeCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setThemeCategory(cat.id)}
                            className={cn(
                              "px-2.5 py-1 text-2xs font-medium rounded-full border transition-all cursor-pointer",
                              isCatSelected
                                ? "bg-brand text-brand-foreground border-brand shadow-xs font-semibold"
                                : "bg-surface border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            )}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Theme Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {THEMES_LIST.filter(
                        (t) => themeCategory === "all" || t.category === themeCategory
                      ).map((item) => {
                        const isSelected = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setTheme(item.id);
                              update("theme", item.id);
                              if (soundEffectsEnabled) playPopSound();
                              toast.show({
                                message: `Applied ${item.name}`,
                                description: item.isTerminalStyle
                                  ? "Terminal mode active with sharp CLI styling"
                                  : "Visual theme updated across all windows",
                              });
                            }}
                            className={cn(
                              "flex flex-col text-left rounded-lg border p-3 transition-all cursor-pointer relative group",
                              isSelected
                                ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand/40"
                                : "border-border/70 bg-surface/40 hover:bg-surface-hover hover:border-border"
                            )}
                          >
                            <div className="flex items-start justify-between gap-1 w-full">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-foreground">
                                    {item.name}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                                        item.isTerminalStyle
                                          ? "bg-green-500/15 text-green-500 border border-green-500/30"
                                          : "bg-surface-hover text-muted-foreground border border-border"
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                  {item.tagline}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                {isSelected && (
                                  <span className="h-4 w-4 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
                                    <Check className="h-2.5 w-2.5" weight="bold" />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Color Swatch Dots */}
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                                style={{ backgroundColor: item.swatches.bg }}
                                title="Background"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                                style={{ backgroundColor: item.swatches.surface }}
                                title="Surface"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                                style={{ backgroundColor: item.swatches.accent }}
                                title="Accent"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                                style={{ backgroundColor: item.swatches.fg }}
                                title="Foreground"
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                                style={{ backgroundColor: item.swatches.border }}
                                title="Border"
                              />
                              <span className="text-[10px] font-mono text-muted-foreground ml-auto uppercase">
                                {item.isDark ? "Dark" : "Light"}
                              </span>
                            </div>

                            {/* Miniature Live Preview Box */}
                            <div
                              className="mt-2.5 rounded p-2 text-[10px] leading-snug border transition-all pointer-events-none select-none"
                              style={{
                                backgroundColor: item.swatches.surface,
                                borderColor: item.swatches.border,
                                color: item.swatches.fg,
                              }}
                            >
                              <div
                                className="flex items-center justify-between pb-1 border-b"
                                style={{ borderColor: item.swatches.border }}
                              >
                                <span
                                  className="font-bold font-mono text-[9px] truncate"
                                  style={{ color: item.swatches.accent }}
                                >
                                  {item.isTerminalStyle ? "$ stash --new" : "quick-note.md"}
                                </span>
                                <span className="text-[8px] opacity-75 font-mono">
                                  {item.isTerminalStyle ? "CLI" : "TXT"}
                                </span>
                              </div>
                              <p className="mt-1 opacity-90 truncate font-mono">
                                {item.isTerminalStyle
                                  ? "echo 'High focus memory layer'"
                                  : "Lightweight ambient desktop capture"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terminal & Retro Hacker UX Engine Suite */}
                  <div className="border-t border-border pt-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal className="h-4 w-4 text-brand" />
                      <span className="text-xs font-semibold text-foreground">
                        Terminal & Hacker UX Engine
                      </span>
                    </div>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Tailor the command-prompt experience, CRT scanline raster overlays, and sharp terminal geometry.
                    </p>

                    <Row
                      title="CRT raster scanline overlay"
                      description="Simulate vintage cathode-ray tube horizontal scanlines across all app windows."
                    >
                      <Switch
                        checked={terminalSettings.crtScanlines}
                        onCheckedChange={(checked) =>
                          setTerminalSettings({ crtScanlines: checked })
                        }
                      />
                    </Row>

                    <Row
                      title="Sharp box geometry (0px corners)"
                      description="Enforce razor-sharp rectangular borders on note cards, buttons, and popovers for a true CLI look."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={terminalSettings.sharpBorders}
                        onCheckedChange={(checked) =>
                          setTerminalSettings({ sharpBorders: checked })
                        }
                      />
                    </Row>

                    <Row
                      title="Phosphor bloom & glow highlights"
                      description="Add subtle luminous CRT text-shadow and glowing borders in Terminal Matrix and Amber modes."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={terminalSettings.glowEffects}
                        onCheckedChange={(checked) =>
                          setTerminalSettings({ glowEffects: checked })
                        }
                      />
                    </Row>

                    <Row
                      title="Blinking block cursor (▋)"
                      description="Show an animated terminal block cursor in search bars and scratchpads."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={terminalSettings.blinkingBlockCursor}
                        onCheckedChange={(checked) =>
                          setTerminalSettings({ blinkingBlockCursor: checked })
                        }
                      />
                    </Row>

                    <div className="border-t border-border/50 pt-3">
                      <span className="block text-xs font-semibold text-foreground mb-1">
                        Terminal Command Prompt Symbol
                      </span>
                      <p className="text-2xs text-muted-foreground mb-2.5">
                        Shell prompt prefix displayed in library search and terminal inputs.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TERMINAL_PROMPTS.map((prompt) => {
                          const isSelected = terminalSettings.promptSymbol === prompt.id;
                          return (
                            <button
                              key={prompt.id}
                              type="button"
                              onClick={() => {
                                setTerminalSettings({ promptSymbol: prompt.id });
                                if (soundEffectsEnabled) playClickSound();
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-md border p-2 text-left font-mono text-xs transition-all cursor-pointer",
                                isSelected
                                  ? "border-brand bg-brand/10 font-bold text-brand shadow-xs ring-1 ring-brand/30"
                                  : "border-border/60 hover:bg-surface-hover hover:border-border text-foreground"
                              )}
                            >
                              <span className="truncate">{prompt.label}</span>
                              {isSelected && <Check className="h-3 w-3 shrink-0 text-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Interface Zoom Level */}
                  <div className="border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium">Interface Zoom Level</span>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          Adjust global DPI scaling across all windows and floating notes.
                        </p>
                      </div>
                      {zoomLevel !== 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            resetZoom();
                            update("zoomLevel", 100);
                          }}
                          className="h-7 gap-1.5 px-2 text-2xs text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
                        <button
                          onClick={() => {
                            const next = Math.max(MIN_ZOOM, zoomLevel - 10);
                            zoomOut();
                            update("zoomLevel", next);
                          }}
                          disabled={zoomLevel <= MIN_ZOOM}
                          className="flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          title={`Zoom out (${formatShortcut(SHORTCUTS.zoomOut)})`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="w-14 text-center font-mono text-xs font-medium text-foreground">
                          {zoomLevel}%
                        </span>

                        <button
                          onClick={() => {
                            const next = Math.min(MAX_ZOOM, zoomLevel + 10);
                            zoomIn();
                            update("zoomLevel", next);
                          }}
                          disabled={zoomLevel >= MAX_ZOOM}
                          className="flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          title={`Zoom in (${formatShortcut(SHORTCUTS.zoomIn)})`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {ZOOM_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setZoomLevel(preset);
                              update("zoomLevel", preset);
                            }}
                            className={cn(
                              "rounded-sm border px-2 py-1 text-2xs font-medium transition-colors cursor-pointer",
                              zoomLevel === preset
                                ? "border-brand bg-brand/10 text-brand font-semibold"
                                : "border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            )}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- PERSONALIZATION TAB -------------------- */}
              {activeTab === "personalization" && (
                <div className="space-y-6">
                  {/* Accent Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        Brand Accent & Aura Glow
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        Active: {ACCENT_COLORS.find((a) => a.id === accentColor)?.label}
                      </span>
                    </div>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Select your signature desktop accent color. Immediately tints buttons, indicators, and glow highlights.
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {ACCENT_COLORS.map((accent) => {
                        const isSelected = accentColor === accent.id;
                        return (
                          <button
                            key={accent.id}
                            type="button"
                            onClick={() => {
                              setAccentColor(accent.id);
                              if (soundEffectsEnabled) playPopSound();
                            }}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30"
                                : "border-border/60 hover:bg-surface-hover hover:border-border"
                            )}
                          >
                            <span
                              className={cn(
                                "h-5 w-5 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center transition-transform",
                                isSelected ? "scale-110 shadow-sm" : ""
                              )}
                              style={{ backgroundColor: accent.dotColor }}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white drop-shadow" weight="bold" />
                              )}
                            </span>
                            <span className="text-[10px] font-medium truncate max-w-full">
                              {accent.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Typography Font Family */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Typography & Font Family
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Change the default font style across your scratchpads, library cards, and markdown editor.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "sans",
                          label: "Modern Sans",
                          sample: "Clean & Crisp UI",
                          fontClass: "font-sans",
                        },
                        {
                          id: "mono",
                          label: "Developer Mono",
                          sample: "const code = true;",
                          fontClass: "font-mono",
                        },
                        {
                          id: "serif",
                          label: "Editorial Serif",
                          sample: "Calm & Bookish Prose",
                          fontClass: "font-serif",
                        },
                        {
                          id: "rounded",
                          label: "Soft Rounded",
                          sample: "Friendly & Casual",
                          fontClass: "font-sans",
                        },
                      ].map((item) => {
                        const isSelected = fontFamily === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setFontFamily(item.id as FontFamily);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30"
                                : "border-border/60 hover:bg-surface-hover hover:border-border"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {item.label}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-brand" />}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {item.sample}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Density */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Library Card Density
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Control the compactness and spacing of note cards in the library.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: "compact",
                          label: "Compact",
                          desc: "1-line summary, high density",
                        },
                        {
                          id: "comfortable",
                          label: "Comfortable",
                          desc: "Standard spacing & preview",
                        },
                        {
                          id: "spacious",
                          label: "Spacious",
                          desc: "Expanded padding & metadata",
                        },
                      ].map((d) => {
                        const isSelected = cardDensity === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setCardDensity(d.id as CardDensity);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30 font-semibold"
                                : "border-border/60 hover:bg-surface-hover hover:border-border"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {d.label}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-brand" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {d.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visual Metadata Toggles */}
                  <div className="border-t border-border pt-5 space-y-3">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Card Metadata Badges
                    </span>

                    <Row
                      title="Word count & reading time"
                      description="Display word count badge (e.g. 142 words · 1m read) on note cards."
                    >
                      <Switch
                        checked={showWordCount}
                        onCheckedChange={setShowWordCount}
                      />
                    </Row>

                    <Row
                      title="Relative timestamps"
                      description="Show friendly time descriptions (e.g. '5m ago', 'Yesterday') instead of raw timestamps."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={showRelativeTime}
                        onCheckedChange={setShowRelativeTime}
                      />
                    </Row>

                    <Row
                      title="Color accent ribbon"
                      description="Highlight cards with a vertical accent bar matching the stash color."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={showColorRibbon}
                        onCheckedChange={setShowColorRibbon}
                      />
                    </Row>

                    <Row
                      title="Widget indicator badges"
                      description="Show miniature icon badges for attached widgets (currency, timer, streaks)."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={showWidgetBadges}
                        onCheckedChange={setShowWidgetBadges}
                      />
                    </Row>
                  </div>

                  {/* Audio & Sound Effects */}
                  <div className="border-t border-border pt-5">
                    <Row
                      title="Sound Effects (Haptic Audio)"
                      description="Play synthesized gentle micro-chimes when stashing, completing tasks, or toggling filters."
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-2xs gap-1.5 cursor-pointer"
                          onClick={() => playSuccessSound()}
                        >
                          <Volume2 className="h-3.5 w-3.5 text-brand" />
                          <span>Test Chime</span>
                        </Button>
                        <Switch
                          checked={soundEffectsEnabled}
                          onCheckedChange={setSoundEffectsEnabled}
                        />
                      </div>
                    </Row>
                  </div>

                  {/* Personalized Greeting */}
                  <div className="border-t border-border pt-5 space-y-3">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Identity & Greeting
                    </span>
                    <Row
                      title="Personalized Moniker"
                      description="The name used in library greetings and focus prompts."
                    >
                      <input
                        type="text"
                        placeholder="e.g. Alex, Hyun..."
                        value={userDisplayName}
                        onChange={(e) => setUserDisplayName(e.target.value)}
                        className="h-7 w-32 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand"
                      />
                    </Row>

                    <Row
                      title="Show Daily Focus Greeting"
                      description="Display the greeting banner and focus summary in the library header."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={showGreetingHeader}
                        onCheckedChange={setShowGreetingHeader}
                      />
                    </Row>
                  </div>
                </div>
              )}

              {/* -------------------- EDITOR & WRITING TAB (NEW!) -------------------- */}
              {activeTab === "editor" && (
                <div className="space-y-6">
                  {/* Editor Base Font Size */}
                  <div>
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Editor Base Font Size
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Adjust default typography size inside floating stash windows.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        [
                          { id: "13px", label: "Compact", size: "13px" },
                          { id: "14px", label: "Standard", size: "14px" },
                          { id: "16px", label: "Comfortable", size: "16px" },
                          { id: "18px", label: "Large", size: "18px" },
                        ] as const
                      ).map((item) => {
                        const isSelected = editorFontSize === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setEditorFontSize(item.id as EditorFontSize);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1 rounded-lg border py-2.5 px-2 text-center transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30 font-semibold text-brand"
                                : "border-border/60 hover:bg-surface-hover hover:border-border text-foreground"
                            )}
                          >
                            <span className="text-xs">{item.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {item.size}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Preview Box */}
                    <div
                      className="mt-3 p-3.5 rounded-lg border border-border/70 bg-surface/70 text-foreground transition-all"
                      style={{
                        fontSize: editorFontSize,
                        lineHeight:
                          editorLineHeight === "tight"
                            ? 1.375
                            : editorLineHeight === "relaxed"
                            ? 1.875
                            : 1.625,
                      }}
                    >
                      <p className="font-semibold text-foreground/90">
                        Capture it. Stash it. Find it instantly.
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        A lightweight ambient desktop memory layer designed for high-focus workflows.
                      </p>
                    </div>
                  </div>

                  {/* Line Spacing / Height */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Line Spacing & Paragraph Height
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Configure vertical breathing room between paragraphs and list items.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "tight", label: "Tight (1.35x)", desc: "Snug, code-like density" },
                        { id: "normal", label: "Balanced (1.6x)", desc: "Standard reading height" },
                        { id: "relaxed", label: "Relaxed (1.85x)", desc: "Spacious prose format" },
                      ].map((item) => {
                        const isSelected = editorLineHeight === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setEditorLineHeight(item.id as EditorLineHeight);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30 font-semibold"
                                : "border-border/60 hover:bg-surface-hover hover:border-border"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {item.label}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-brand" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {item.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Writing Intelligence & Toggles */}
                  <div className="border-t border-border pt-5 space-y-3">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Writing & Automation
                    </span>

                    <Row
                      title="Auto-detect note title from first line"
                      description="When a note's title is blank, automatically title it from your first written thought."
                    >
                      <Switch
                        checked={autoTitleFromFirstLine}
                        onCheckedChange={setAutoTitleFromFirstLine}
                      />
                    </Row>

                    <Row
                      title="Native OS spellchecking"
                      description="Highlight spelling errors directly inside the note editor."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={editorSpellcheck}
                        onCheckedChange={setEditorSpellcheck}
                      />
                    </Row>

                    <Row
                      title="Inline math calculator engine"
                      description="Evaluate arithmetic inline whenever you type '=' (e.g. '15 * 8 =' automatically inserts '120')."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={inlineMathEnabled}
                        onCheckedChange={setInlineMathEnabled}
                      />
                    </Row>

                    <Row
                      title="Single-click opens links"
                      description="Open hyperlinks directly on click (when off, requires Ctrl/Cmd+Click to avoid misclicks while editing)."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={directLinkClick}
                        onCheckedChange={setDirectLinkClick}
                      />
                    </Row>
                  </div>
                </div>
              )}

              {/* -------------------- NOTES & DEFAULTS TAB (SUPERCHARGED) -------------------- */}
              {activeTab === "notes" && settings && (
                <div className="space-y-6">
                  {/* Default Color */}
                  <div>
                    <span className="mb-2 block text-xs font-medium">
                      Default Stash Color
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => update("defaultColor", c.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-sm border px-2 py-1.5 text-left transition-colors cursor-pointer",
                            settings.defaultColor === c.id
                              ? "border-brand bg-brand/5 font-medium"
                              : "border-border hover:bg-surface-hover"
                          )}
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: c.dotColor }}
                          />
                          <span className="text-2xs">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default Paper Pattern */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Default Paper Texture
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      New floating stashes will automatically be created with this tactile texture.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PAPER_PATTERNS.map((p) => {
                        const isSelected = defaultPaper === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setDefaultPaper(p.id);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "relative flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all overflow-hidden cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30"
                                : "border-border/60 hover:bg-surface-hover"
                            )}
                          >
                            <div
                              className="pointer-events-none absolute inset-0 select-none text-current rounded-lg"
                              style={getPaperPatternStyle(p.id)}
                              aria-hidden="true"
                            />
                            <div className="relative z-10 flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {p.label}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-brand" weight="bold" />}
                            </div>
                            <span className="relative z-10 text-[10px] text-muted-foreground leading-tight">
                              {p.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Typography Persona */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Default Typography Persona
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Choose the default font persona applied to newly created notes.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_PERSONAS.map((f) => {
                        const isSelected = defaultFontPersona === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setDefaultFontPersona(f.id);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30"
                                : "border-border/60 hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {f.label}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-brand" />}
                            </div>
                            <span className={cn("text-[11px] text-muted-foreground", f.fontClass)}>
                              {f.preview}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Window Frame Style */}
                  <div className="border-t border-border pt-5">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Default Window Frame & Border
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Select the ambient frame aesthetic for floating stash windows.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FRAME_STYLES.map((fr) => {
                        const isSelected = defaultFrame === fr.id;
                        return (
                          <button
                            key={fr.id}
                            type="button"
                            onClick={() => {
                              setDefaultFrame(fr.id);
                              if (soundEffectsEnabled) playClickSound();
                            }}
                            className={cn(
                              "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand/10 shadow-xs ring-1 ring-brand/30"
                                : "border-border/60 hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-medium text-foreground">
                                {fr.label}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-brand" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {fr.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Floating Size & Opacity */}
                  <div className="border-t border-border pt-5 space-y-4">
                    <Row
                      title="Default floating window size"
                      description="The starting geometry dimensions when creating a new stash."
                    >
                      <div className="flex items-center gap-1.5">
                        {[
                          { id: "compact", label: "Compact (460x520)" },
                          { id: "standard", label: "Standard (560x640)" },
                          { id: "spacious", label: "Spacious (680x760)" },
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => setDefaultWindowSize(sz.id as DefaultWindowSize)}
                            className={cn(
                              "rounded-sm border px-2 py-1 text-2xs font-medium transition-colors cursor-pointer",
                              defaultWindowSize === sz.id
                                ? "border-brand bg-brand/10 text-brand font-semibold"
                                : "border-border text-muted-foreground hover:bg-surface-hover"
                            )}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </Row>

                    <Row
                      title="Default window opacity (Ghost Mode)"
                      description="Translucency level for new floating notes (can be toggled per note)."
                      className="border-t border-border/50 pt-3"
                    >
                      <div className="flex items-center gap-1.5">
                        {[
                          { val: 100, label: "100% Solid" },
                          { val: 90, label: "90% Glass" },
                          { val: 80, label: "80% Ghost" },
                        ].map((op) => (
                          <button
                            key={op.val}
                            type="button"
                            onClick={() => setDefaultOpacity(op.val)}
                            className={cn(
                              "rounded-sm border px-2 py-1 text-2xs font-medium transition-colors cursor-pointer",
                              defaultOpacity === op.val
                                ? "border-brand bg-brand/10 text-brand font-semibold"
                                : "border-border text-muted-foreground hover:bg-surface-hover"
                            )}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </Row>

                    <Row
                      title="Keep new stashes on top"
                      description="Floating stashes start pinned above other applications."
                      className="border-t border-border/50 pt-3"
                    >
                      <Switch
                        checked={settings.defaultAlwaysOnTop}
                        onCheckedChange={(v) => update("defaultAlwaysOnTop", v)}
                      />
                    </Row>
                  </div>
                </div>
              )}

              {/* -------------------- SECURITY & VAULT TAB (NEW!) -------------------- */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span>Local Vault Protection</span>
                          <span className="rounded-xs bg-brand/10 text-brand px-1.5 py-0.2 font-mono text-[10px]">
                            Offline & Private
                          </span>
                        </div>
                        <p className="text-2xs text-muted-foreground mt-0.5">
                          {protectedCount === 0
                            ? "No notes are currently locked with a PIN."
                            : `${protectedCount} ${
                                protectedCount === 1 ? "note is" : "notes are"
                              } locked with a PIN (${unlockedCount} unlocked in this session).`}
                        </p>
                      </div>
                    </div>
                    {protectedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLockAllNow}
                        className="gap-1.5 h-8 text-2xs text-foreground cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        <span>Lock All Now</span>
                      </Button>
                    )}
                  </div>

                  {/* Security Controls */}
                  <div className="space-y-4">
                    <span className="block text-xs font-semibold text-foreground mb-1">
                      Privacy Preferences
                    </span>

                    <Row
                      title="Mask locked note previews"
                      description="Hide text, tasks, and previews of PIN-protected notes across library cards and list view until unlocked."
                    >
                      <Switch
                        checked={maskLockedPreviews}
                        onCheckedChange={setMaskLockedPreviews}
                      />
                    </Row>

                    <Row
                      title="Session auto-lock timeout"
                      description="Automatically re-lock protected notes after inactivity."
                      className="border-t border-border/50 pt-3"
                    >
                      <div className="flex items-center gap-1">
                        {[
                          { val: 0, label: "Immediate" },
                          { val: 5, label: "5m" },
                          { val: 15, label: "15m" },
                          { val: 30, label: "30m" },
                          { val: -1, label: "Never" },
                        ].map((t) => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setAutoLockTimeout(t.val)}
                            className={cn(
                              "rounded-sm border px-2 py-1 text-2xs font-medium transition-colors cursor-pointer",
                              autoLockTimeout === t.val
                                ? "border-brand bg-brand/10 text-brand font-semibold"
                                : "border-border text-muted-foreground hover:bg-surface-hover"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </Row>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-destructive">
                          Remove All PIN Locks
                        </div>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          Clears all security PINs across every protected note in your vault.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={protectedCount === 0}
                        onClick={() => setConfirmClearPins(true)}
                        className="h-8 text-2xs text-destructive hover:bg-destructive/10"
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" />
                        Clear All PINs
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- SHORTCUTS MATRIX TAB (NEW!) -------------------- */}
              {activeTab === "shortcuts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">
                        Keyboard Shortcuts & Hotkeys Matrix
                      </span>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        High-speed shortcuts to capture, organize, and format with zero friction.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyShortcutsMarkdown}
                      className="gap-1.5 h-7 text-2xs"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Cheat Sheet</span>
                    </Button>
                  </div>

                  {/* Search and Category Filters */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search shortcuts by name or keys…"
                        value={shortcutsSearch}
                        onChange={(e) => setShortcutsSearch(e.target.value)}
                        className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "all", label: `All (${SHORTCUTS_LIST.length})` },
                        { id: "global", label: "Global & OS" },
                        { id: "editor", label: "Stash Editor" },
                        { id: "library", label: "Library Hub" },
                        { id: "windows", label: "Windows & Scale" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setShortcutCategory(cat.id as any)}
                          className={cn(
                            "rounded-sm border px-2 py-0.5 text-2xs font-medium transition-colors cursor-pointer",
                            shortcutCategory === cat.id
                              ? "border-brand bg-brand/10 text-brand font-semibold"
                              : "border-border text-muted-foreground hover:bg-surface-hover"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shortcuts List */}
                  <div className="divide-y divide-border/60 rounded-lg border border-border bg-surface/50 max-h-[300px] overflow-y-auto">
                    {filteredShortcuts.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 hover:bg-surface-hover/50 transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="text-xs font-medium text-foreground flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="rounded-xs bg-muted/70 px-1.5 py-0.2 font-mono text-[9px] text-muted-foreground">
                              {s.context}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {s.description}
                          </div>
                        </div>
                        <kbd className="shrink-0 rounded border border-border/80 bg-surface px-2 py-1 font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                          {formatShortcut(s.keys)}
                        </kbd>
                      </div>
                    ))}
                    {filteredShortcuts.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No shortcuts matched your search query.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -------------------- DATA & INSIGHTS TAB (SUPERCHARGED) -------------------- */}
              {activeTab === "data" && (
                <div className="space-y-6">
                  {/* Knowledge & Storage Insights HUD */}
                  <div>
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      Vault Analytics & Knowledge Insights
                    </span>
                    <p className="text-2xs text-muted-foreground mb-3">
                      Overview of your private local memory archive.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="rounded-lg border border-border bg-surface p-3">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Total Stashes
                        </span>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {vaultStats.totalNotes}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {vaultStats.activeNotes} active · {vaultStats.archivedNotes} archived
                        </span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-3">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Words Written
                        </span>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {vaultStats.totalWords.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          ~{Math.max(1, Math.round(vaultStats.totalWords / 200))}m total reading time
                        </span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-3">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Tasks Tracked
                        </span>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {vaultStats.completedTasks}/{vaultStats.totalTasks}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {vaultStats.totalTasks > 0
                            ? `${Math.round((vaultStats.completedTasks / vaultStats.totalTasks) * 100)}% completed`
                            : "No checklist tasks"}
                        </span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-3">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Storage Footprint
                        </span>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {vaultStats.estimatedKb} KB
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          SQLite WAL database
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Markdown Archive Export (NEW FEATURE) */}
                  <div className="border-t border-border pt-5">
                    <div className="text-xs font-medium">Export as Markdown Archive</div>
                    <p className="mb-2.5 mt-0.5 text-2xs text-muted-foreground">
                      Export all active notes into a structured Markdown digest document with headers, timestamps, and tags.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleExportMarkdownArchive} variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5 text-primary" />
                        Export .md Archive
                      </Button>
                      <Button onClick={handleCopyMarkdownToClipboard} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                        Copy as Markdown
                      </Button>
                    </div>
                  </div>

                  {/* JSON Full Backup & Restore */}
                  <div className="border-t border-border pt-5">
                    <div className="text-xs font-medium">Full JSON Database Backup</div>
                    <p className="mb-2 mt-0.5 text-2xs text-muted-foreground">
                      A complete portable JSON backup of every note, widget, tag, and geometry state.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Export JSON Backup
                      </Button>

                      <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-2xs font-medium shadow-xs transition-colors hover:bg-surface-hover">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Restore from JSON…</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImport}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Empty Trash */}
                  <div className="border-t border-border pt-5">
                    <div className="text-xs font-medium text-destructive">
                      Empty Trash
                    </div>
                    <p className="mb-2 mt-0.5 text-2xs text-muted-foreground">
                      Permanently destroys every note in Trash ({vaultStats.trashNotes} notes). This cannot be undone.
                    </p>
                    <Button
                      onClick={() => setConfirmEmpty(true)}
                      variant="destructive"
                      size="sm"
                      disabled={vaultStats.trashNotes === 0}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Empty Trash ({vaultStats.trashNotes})
                    </Button>
                  </div>
                </div>
              )}

              {/* -------------------- ABOUT TAB -------------------- */}
              {activeTab === "about" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Stash Desktop</span>
                    <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      v0.1.0
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A quiet place for everything you don't want to lose. Capture it, stash it, find it instantly.
                  </p>
                  <div className="space-y-1.5 rounded-lg border border-border bg-surface p-3.5 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    <div className="text-foreground font-semibold">Native Desktop Architecture:</div>
                    <div>• Tauri 2 + Rust Core with SQLite FTS5 Full-Text Search</div>
                    <div>• React 18 + Tiptap ProseMirror Rich Text Engine</div>
                    <div>• 100% Local-First: Zero cloud sync, zero telemetry, absolute data sovereignty</div>
                    <div>• Multi-window floating geometry with translucent Ghost mode</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmEmpty}
        onOpenChange={setConfirmEmpty}
        title="Empty the Trash?"
        description="Every note in Trash will be permanently destroyed along with its revision history. This cannot be undone."
        confirmLabel="Empty Trash"
        onConfirm={handleEmptyTrash}
      />

      <ConfirmDialog
        open={confirmClearPins}
        onOpenChange={setConfirmClearPins}
        title="Remove All Note PINs?"
        description="This will clear the security lock from all PIN-protected notes in your library. Notes will become openly readable."
        confirmLabel="Remove All PINs"
        onConfirm={handleClearAllPins}
      />
    </>
  );
};
