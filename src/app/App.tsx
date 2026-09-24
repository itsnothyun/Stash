import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { LibraryView } from "@/features/windows/library-view";
import { FloatingStashView } from "@/features/windows/floating-stash-view";
import { PipBrowserView } from "@/features/windows/pip-browser-view";
import { OnboardingScreen } from "@/features/capture/onboarding-screen";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { closeCurrentWindow } from "@/lib/tauri/window-manager";
import { Settings } from "@/features/stash/types/note";
import { IS_MAC, SHORTCUTS, useShortcuts } from "@/lib/keyboard/shortcuts";
import { Toaster, toast } from "@/components/ui/toast";
import { WindowResizeBorders } from "@/components/desktop/window-resize-borders";

export const App: React.FC = () => {
  const {
    setTheme,
    setSettingsOpen,
    setCommandPaletteOpen,
    commandPaletteOpen,
    requestSearchFocus,
    route,
    setRoute,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useUIStore();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const windowType = searchParams.get("window");
  const noteId = searchParams.get("noteId");
  const isFloatingWindow = windowType === "stash" && noteId !== null;
  const isPipBrowserWindow = windowType === "pip-browser";
  const pipUrl = searchParams.get("url") || undefined;
  const widgetId = searchParams.get("widgetId") || undefined;

  useEffect(() => {
    let cancelled = false;

    stashIpc.getSettings().then((s) => {
      if (cancelled || !s) return;
      setSettings(s);
      setTheme(s.theme);
      if (typeof s.zoomLevel === "number") setZoomLevel(s.zoomLevel);
      if (!isFloatingWindow && !s.hasCompletedOnboarding) setRoute("onboarding");
      setSettingsReady(true);
    });

    const unlisten = stashIpc.listenToEvent<Settings>(
      "stash://settings-updated",
      (updated) => {
        if (!updated) return;
        setSettings(updated);
        if (updated.theme) setTheme(updated.theme);
        if (typeof updated.zoomLevel === "number") setZoomLevel(updated.zoomLevel);
      }
    );

    return () => {
      cancelled = true;
      unlisten.then((fn) => fn());
    };
  }, [setTheme, setRoute, setZoomLevel, isFloatingWindow]);

  const persistSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!settings) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      await stashIpc.updateSettings(next);
    },
    [settings]
  );

  const capture = useCallback(async () => {
    try {
      await createAndOpenStash({ color: settings?.defaultColor });
      setRoute("library");
    } catch {
      toast.error("Could not create that stash", "Your existing notes are untouched.");
    }
  }, [settings?.defaultColor, setRoute]);

  const finishOnboarding = useCallback(async () => {
    await persistSettings({ hasCompletedOnboarding: true });
    setRoute("library");
  }, [persistSettings, setRoute]);

  const createFirstStash = useCallback(async () => {
    await persistSettings({ hasCompletedOnboarding: true });
    await capture();
  }, [persistSettings, capture]);

  const [showZoomHud, setShowZoomHud] = useState(false);
  const zoomHudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const triggerZoomHud = useCallback(() => {
    setShowZoomHud(true);
    if (zoomHudTimerRef.current) clearTimeout(zoomHudTimerRef.current);
    zoomHudTimerRef.current = setTimeout(() => setShowZoomHud(false), 1400);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    triggerZoomHud();
  }, [zoomLevel, triggerZoomHud]);

  // Debounce syncing zoom level to backend settings
  useEffect(() => {
    if (!settingsReady || !settings) return;
    if (settings.zoomLevel === zoomLevel) return;
    const timer = setTimeout(() => {
      void persistSettings({ zoomLevel });
    }, 600);
    return () => clearTimeout(timer);
  }, [zoomLevel, settingsReady, settings, persistSettings]);

  // Global capture-phase listener: captures Ctrl +, Ctrl -, Ctrl 0 before any child can swallow them
  useEffect(() => {
    const onGlobalZoomKeyDown = (e: KeyboardEvent) => {
      const mod = IS_MAC ? e.metaKey : e.ctrlKey;
      if (!mod || e.altKey) return;

      const key = e.key;
      const code = e.code;

      const isZoomIn =
        key === "+" ||
        key === "=" ||
        key === "Add" ||
        code === "Equal" ||
        code === "NumpadAdd" ||
        code === "Plus";

      const isZoomOut =
        key === "-" ||
        key === "_" ||
        key === "Subtract" ||
        code === "Minus" ||
        code === "NumpadSubtract";

      const isResetZoom =
        key === "0" ||
        code === "Digit0" ||
        code === "Numpad0";

      if (isZoomIn) {
        e.preventDefault();
        e.stopPropagation();
        zoomIn();
        return;
      }

      if (isZoomOut) {
        e.preventDefault();
        e.stopPropagation();
        zoomOut();
        return;
      }

      if (isResetZoom) {
        e.preventDefault();
        e.stopPropagation();
        resetZoom();
        return;
      }
    };

    window.addEventListener("keydown", onGlobalZoomKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onGlobalZoomKeyDown, { capture: true });
  }, [zoomIn, zoomOut, resetZoom]);

  // Support Ctrl/Cmd + Wheel zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const modPressed = IS_MAC ? e.metaKey : e.ctrlKey;
      if (!modPressed) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [zoomIn, zoomOut]);

  useShortcuts([
    {
      keys: SHORTCUTS.quickCapture,
      allowInInput: true,
      run: () => void capture(),
    },
    {
      keys: SHORTCUTS.commandPalette,
      allowInInput: true,
      enabled: !isFloatingWindow,
      run: () => setCommandPaletteOpen(!commandPaletteOpen),
    },
    {
      keys: SHORTCUTS.search,
      allowInInput: true,
      enabled: !isFloatingWindow,
      run: () => requestSearchFocus(),
    },
    {
      keys: SHORTCUTS.settings,
      allowInInput: true,
      run: () => setSettingsOpen(true),
    },
    {
      keys: SHORTCUTS.closeWindow,
      allowInInput: true,
      run: () => closeCurrentWindow(),
    },
    {
      keys: SHORTCUTS.zoomIn,
      allowInInput: true,
      run: () => zoomIn(),
    },
    {
      keys: SHORTCUTS.zoomOut,
      allowInInput: true,
      run: () => zoomOut(),
    },
    {
      keys: SHORTCUTS.resetZoom,
      allowInInput: true,
      run: () => resetZoom(),
    },
  ]);

  const zoomHudElement = showZoomHud ? (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-popover/90 px-3 py-1 text-xs font-mono font-medium text-popover-foreground shadow-md backdrop-blur-md">
        <span>Zoom:</span>
        <span className="font-semibold text-brand">{zoomLevel}%</span>
      </div>
    </div>
  ) : null;

  let content: React.ReactNode;
  if (isPipBrowserWindow) {
    content = (
      <PipBrowserView
        initialUrl={pipUrl}
        noteId={noteId || undefined}
        widgetId={widgetId}
      />
    );
  } else if (isFloatingWindow) {
    content = <FloatingStashView noteId={noteId} />;
  } else if (!settingsReady) {
    content = <div className="h-screen w-screen bg-background" />;
  } else if (route === "onboarding") {
    content = (
      <OnboardingScreen
        onCreateFirst={() => void createFirstStash()}
        onGoToDashboard={() => void finishOnboarding()}
      />
    );
  } else {
    content = (
      <LibraryView
        onUpdateSettings={persistSettings}
        onCapture={capture}
      />
    );
  }

  return (
    <>
      <WindowResizeBorders />
      {content}
      {zoomHudElement}
      <Toaster />
    </>
  );
};

export default App;
