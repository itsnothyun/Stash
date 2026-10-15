import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  ArrowClockwise as RotateCw,
  House as Home,
  PushPin as Pin,
  PushPinSlash as PinOff,
  Magnet,
  CopySimple as Copy,
  Minus,
  Square,
  X,
  Plus,
  Faders as Sliders,
  Television as Tv,
  Layout,
  Check,
} from "@phosphor-icons/react";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import {
  closeCurrentWindow,
  minimizeCurrentWindow,
  toggleMaximizeCurrentWindow,
  setAlwaysOnTop,
  isTauri,
} from "@/lib/tauri/window-manager";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

interface PipBrowserViewProps {
  initialUrl?: string;
  noteId?: string;
  widgetId?: string;
}

const PRESETS = [
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "Google", url: "https://www.google.com" },
  { label: "ChatGPT", url: "https://chatgpt.com" },
  { label: "Wikipedia", url: "https://www.wikipedia.org" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Reddit", url: "https://www.reddit.com" },
];

const SIZE_PRESETS = [
  { label: "16:9 Video PiP", width: 640, height: 360 },
  { label: "Compact Reading", width: 440, height: 380 },
  { label: "Standard View", width: 600, height: 440 },
  { label: "Tall Reference", width: 450, height: 650 },
  { label: "Wide Canvas", width: 850, height: 520 },
];

const OPACITY_PRESETS = [100, 85, 70, 50, 35];

function normalizeWebUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "https://www.google.com";

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&enablejsapi=1`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export const PipBrowserView: React.FC<PipBrowserViewProps> = ({
  initialUrl = "https://www.youtube.com",
  noteId = "",
  widgetId = "",
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputVal, setInputVal] = useState(initialUrl);
  const [iframeSrc, setIframeSrc] = useState(normalizeWebUrl(initialUrl));
  const [alwaysOnTopState, setAlwaysOnTopState] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Set default always-on-top for PiP
  useEffect(() => {
    void setAlwaysOnTop(true);
  }, []);

  // Listen to external navigation events if reopened with another URL
  useEffect(() => {
    const unlisten = stashIpc.listenToEvent<{
      url: string;
      noteId?: string;
      widgetId?: string;
    }>("stash://pip-browser-navigate", (payload) => {
      if (payload.url) {
        navigateTo(payload.url);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const navigateTo = (url: string) => {
    const normalized = normalizeWebUrl(url);
    setCurrentUrl(url);
    setInputVal(url);
    setIframeSrc(normalized);
    setIsLoading(true);

    setHistory((prev) => [...prev.slice(0, historyIdx + 1), url]);
    setHistoryIdx((prev) => prev + 1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    navigateTo(inputVal);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCurrentUrl(prev);
      setInputVal(prev);
      setIframeSrc(normalizeWebUrl(prev));
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setCurrentUrl(next);
      setInputVal(next);
      setIframeSrc(normalizeWebUrl(next));
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeSrc;
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    const next = !alwaysOnTopState;
    setAlwaysOnTopState(next);
    await setAlwaysOnTop(next);
    toast.show({
      message: next ? "Always on Top: Pinned" : "Always on Top: Unpinned",
    });
  };

  const handleResizeWindow = async (width: number, height: number) => {
    if (isTauri()) {
      try {
        const win = getCurrentWebviewWindow();
        await win.setSize(new LogicalSize(width, height));
      } catch (err) {
        console.error("Failed to resize window", err);
      }
    }
  };

  /**
   * Magnetically dock back into the originating note widget.
   */
  const handleDockBackToNote = async () => {
    try {
      await stashIpc.dockBrowserWidget({
        noteId,
        widgetId,
        url: currentUrl,
      });

      // Close this floating PiP window
      await closeCurrentWindow();
    } catch (e) {
      console.error("Failed to dock back into note", e);
      toast.show({
        message: "Could not dock back",
        description: String(e),
      });
    }
  };

  const handleClipToNewStash = async () => {
    try {
      const title = currentUrl.replace(/^https?:\/\//i, "").split("/")[0] || "Web Bookmark";
      await stashIpc.createNote({
        title: `Bookmark: ${title}`,
        plainText: `Captured from Picture-in-Picture Browser:\n\n${currentUrl}\n`,
      });
      toast.show({
        message: "Clipped to new Stash note",
      });
    } catch {
      toast.show({ message: "Failed to clip stash" });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.show({ message: "URL copied to clipboard" });
  };

  return (
    <div
      style={{ opacity: opacity / 100 }}
      className="h-screen w-screen flex flex-col bg-background text-foreground select-none overflow-hidden border border-border/80 rounded-xl shadow-2xl transition-opacity duration-150"
    >
      {/* Draggable Titlebar & PiP Controls */}
      <div
        data-tauri-drag-region
        className="drag-region flex items-center justify-between h-9 px-2.5 bg-muted/70 border-b border-border/50 text-xs shrink-0"
      >
        {/* Left Branding & Origin */}
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] tracking-wide text-foreground">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Tv className="h-3.5 w-3.5 text-primary" />
            <span>PiP Browser</span>
          </div>

          {noteId && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
              Attached to Note
            </span>
          )}
        </div>

        {/* Right Window Controls & Magnetic Dock Button */}
        <div className="no-drag-region flex items-center gap-1">
          {/* Seamless Magnetic Docking Button */}
          {noteId && (
            <button
              type="button"
              onClick={handleDockBackToNote}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 text-[11px] font-medium shadow-sm transition-all mr-1 group"
              title="Magnetically snap back into the note's widget shelf"
            >
              <Magnet className="h-3 w-3 group-hover:rotate-45 transition-transform" />
              <span>Dock to Note</span>
            </button>
          )}

          {/* Always on top toggle */}
          <button
            type="button"
            onClick={handleToggleAlwaysOnTop}
            className={cn(
              "p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              alwaysOnTopState ? "bg-primary/15 text-primary hover:bg-primary/20" : ""
            )}
            title={alwaysOnTopState ? "Always on Top: Active" : "Always on Top: Off"}
          >
            {alwaysOnTopState ? (
              <Pin className="h-3 w-3 fill-current" />
            ) : (
              <PinOff className="h-3 w-3" />
            )}
          </button>

          {/* Size presets dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Aspect Ratio & Window Size"
              >
                <Layout className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                PiP Sizing Presets
              </div>
              {SIZE_PRESETS.map((p) => (
                <DropdownMenuItem
                  key={p.label}
                  onClick={() => handleResizeWindow(p.width, p.height)}
                  className="text-xs"
                >
                  <span>{p.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                    {p.width}×{p.height}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Opacity / Ghost mode dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                  opacity < 100 ? "text-primary bg-primary/10" : ""
                )}
                title={`Ghost Opacity (${opacity}%)`}
              >
                <Sliders className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ghost Transparency
              </div>
              {OPACITY_PRESETS.map((op) => (
                <DropdownMenuItem
                  key={op}
                  onClick={() => setOpacity(op)}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{op}% Opacity</span>
                  {opacity === op && <Check className="h-3 w-3 text-foreground" weight="bold" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Window action controls */}
          <button
            type="button"
            onClick={() => minimizeCurrentWindow()}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeCurrentWindow()}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Maximize / Restore"
          >
            <Square className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => closeCurrentWindow()}
            className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Browser Navigation Toolbar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/30 border-b border-border/40 text-xs shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIdx <= 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            className={cn(
              "p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              isLoading ? "animate-spin text-primary" : ""
            )}
            title="Reload"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigateTo("https://www.youtube.com")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Omnibox (Search / URL) */}
        <form onSubmit={handleFormSubmit} className="flex-1 min-w-0 flex items-center relative">
          <div className="absolute left-2.5 text-muted-foreground pointer-events-none">
            <Globe className="h-3 w-3" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search Google or enter web address..."
            className="w-full h-7 pl-7 pr-2 rounded-md bg-background border border-border/70 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
          />
        </form>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Copy URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClipToNewStash}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Clip page to a new Stash note"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-1 px-2.5 py-1 bg-muted/15 border-b border-border/30 overflow-x-auto no-scrollbar text-[10px] shrink-0">
        <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider text-[9px] mr-1 shrink-0">
          Quick:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => navigateTo(p.url)}
            className={cn(
              "px-1.5 py-0.5 rounded border text-[10px] whitespace-nowrap transition-colors",
              currentUrl.includes(p.url.replace("https://www.", "").replace("https://", ""))
                ? "bg-primary/15 text-primary border-primary/30 font-medium"
                : "border-transparent bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Viewport Frame */}
      <div className="relative flex-1 w-full bg-card overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-popover/90 border border-border shadow-md text-xs text-foreground">
              <RotateCw className="h-3 w-3 animate-spin text-primary" />
              <span>Loading webpage…</span>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Picture-in-Picture Browser Viewport"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};
