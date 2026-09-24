import React, { useEffect, useRef, useState } from "react";
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
} from "@/stores/ui-store";
import {
  playSuccessSound,
  playPopSound,
  playClickSound,
} from "@/lib/utils/sound-effects";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { Settings } from "@/features/stash/types/note";
import { NOTE_COLORS } from "@/features/stash/types/color";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";
import {
  Check,
  Download,
  Minus,
  Monitor,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SettingsTab =
  | "general"
  | "appearance"
  | "personalization"
  | "notes"
  | "data"
  | "about";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "personalization", label: "Personalization" },
  { id: "notes", label: "Notes" },
  { id: "data", label: "Data" },
  { id: "about", label: "About" },
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
  } = useUIStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [justSaved, setJustSaved] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (settingsOpen) stashIpc.getSettings().then(setSettings);
  }, [settingsOpen]);

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.notes)) {
        throw new Error("unrecognised backup");
      }
      await stashIpc.importData(parsed);
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
    toast.show({ message: "Trash emptied" });
  };

  return (
    <>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 rounded-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="text-sm font-semibold">Settings</DialogTitle>
            {justSaved && (
              <span className="flex items-center gap-1 pr-6 text-2xs font-medium text-success">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </DialogHeader>

          <div className="flex h-[480px]">
            <nav className="w-40 shrink-0 space-y-1 border-r border-border bg-surface p-2.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-sm px-2.5 py-[7px] text-left text-xs transition-colors",
                    activeTab === tab.id
                      ? "bg-surface-hover font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {activeTab === "general" && settings && (
                <>
                  <Row
                    title="Welcome"
                    description="The first-run carousel. It stays dismissed until you open it again."
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
                    description="Keep Stash running in the background when the library closes."
                    className="border-t border-border pt-4"
                  >
                    <Switch
                      checked={settings.closeToTray}
                      onCheckedChange={(v) => update("closeToTray", v)}
                    />
                  </Row>

                  <Row
                    title="Restore open stashes"
                    description="Reopen the notes you left floating when Stash restarts."
                  >
                    <Switch
                      checked={settings.restoreOpenNotes}
                      onCheckedChange={(v) => update("restoreOpenNotes", v)}
                    />
                  </Row>

                  <Row
                    title="Launch at startup"
                    description="Automatically start Stash when your computer boots."
                    className="border-t border-border pt-4"
                  >
                    <Switch
                      checked={settings.launchAtStartup}
                      onCheckedChange={(v) => update("launchAtStartup", v)}
                    />
                  </Row>

                  <Row
                    title="Global quick capture"
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

              {activeTab === "appearance" && (
                <div>
                  <span className="mb-2 block text-xs font-medium">Theme</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "system", label: "System", icon: Monitor },
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
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
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-md border p-3.5 transition-colors",
                            selected
                              ? "border-brand bg-brand/5 text-foreground"
                              : "border-border text-muted-foreground hover:bg-surface-hover"
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                          <span className="text-2xs font-medium">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-2xs leading-relaxed text-muted-foreground">
                    Applies immediately to the library and every floating stash.
                  </p>

                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium">Zoom Level</span>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          Adjust global scaling across all windows and notes.
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
                              "rounded-sm border px-2 py-1 text-2xs font-medium transition-colors",
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

                    <div className="mt-3 flex items-center gap-3 text-2xs text-muted-foreground">
                      <span className="font-medium">Shortcuts:</span>
                      <span className="inline-flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {formatShortcut(SHORTCUTS.zoomIn)}
                        </kbd>
                        In
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {formatShortcut(SHORTCUTS.zoomOut)}
                        </kbd>
                        Out
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {formatShortcut(SHORTCUTS.resetZoom)}
                        </kbd>
                        Reset
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                        <Check className="h-3 w-3 text-white drop-shadow stroke-[3]" />
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
              Change the font style across your scratchpads, library cards, and markdown editor.
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
                placeholder="e.g. Hyun, Alex..."
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

      {activeTab === "notes" && settings && (
                <>
                  <div>
                    <span className="mb-2 block text-xs font-medium">
                      Default color
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => update("defaultColor", c.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-sm border px-2 py-1.5 text-left transition-colors",
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

                  <Row
                    title="Keep new stashes on top"
                    description="Floating stashes start pinned above other applications."
                    className="border-t border-border pt-4"
                  >
                    <Switch
                      checked={settings.defaultAlwaysOnTop}
                      onCheckedChange={(v) => update("defaultAlwaysOnTop", v)}
                    />
                  </Row>
                </>
              )}

              {activeTab === "data" && (
                <>
                  <div>
                    <div className="text-xs font-medium">Export your stash</div>
                    <p className="mb-2 mt-0.5 text-2xs text-muted-foreground">
                      A complete JSON backup of every note, tag and window state.
                    </p>
                    <Button onClick={handleExport} variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" />
                      Export backup
                    </Button>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-medium">Import notes</div>
                    <p className="mb-2 mt-0.5 text-2xs text-muted-foreground">
                      Restore from a Stash JSON backup. Existing notes are kept.
                    </p>
                    <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-surface-elevated px-2.5 text-2xs font-medium shadow-xs transition-colors hover:bg-surface-hover">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Choose a backup…</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-medium text-destructive">
                      Empty Trash
                    </div>
                    <p className="mb-2 mt-0.5 text-2xs text-muted-foreground">
                      Permanently destroys every note in Trash. This cannot be
                      undone.
                    </p>
                    <Button
                      onClick={() => setConfirmEmpty(true)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Empty Trash
                    </Button>
                  </div>
                </>
              )}

              {activeTab === "about" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Stash</span>
                    <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      v0.1.0
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A quiet place for everything you don't want to lose. Capture
                    it, stash it, find it instantly.
                  </p>
                  <div className="space-y-1 rounded-md border border-border bg-surface p-3 font-mono text-[10px] text-muted-foreground">
                    <div>Tauri 2 · Rust · React · SQLite (FTS5)</div>
                    <div>Local-first — no account, no sync, no telemetry</div>
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
        description="Every note in Trash will be destroyed along with its revision history. This cannot be undone."
        confirmLabel="Empty Trash"
        onConfirm={handleEmptyTrash}
      />
    </>
  );
};
