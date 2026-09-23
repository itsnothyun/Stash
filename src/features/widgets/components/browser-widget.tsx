import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  ExternalLink,
  Magnet,
  Copy,
  Tv,
  Sparkles,
} from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { NoteWidgetData } from "../types";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface BrowserWidgetProps {
  widget: NoteWidgetData;
  noteId?: string;
  onUpdateWidget: (updated: Partial<NoteWidgetData>) => void;
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export interface BrowserWidgetConfig {
  url?: string;
  title?: string;
  isDetached?: boolean;
}

const DEFAULT_EMBED_URL = "https://www.youtube.com/watch?v=jfKfPfyJRdk";

const PRESETS = [
  { label: "Lofi Live", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", icon: "🎵", isNativeOnly: false },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/Main_Page", icon: "📖", isNativeOnly: false },
  { label: "YouTube", url: "https://www.youtube.com", icon: "▶", isNativeOnly: true },
  { label: "Google", url: "https://www.google.com", icon: "G", isNativeOnly: true },
  { label: "ChatGPT", url: "https://chatgpt.com", icon: "✦", isNativeOnly: true },
  { label: "GitHub", url: "https://github.com", icon: "⌥", isNativeOnly: true },
];

/**
 * Checks whether a URL is known to reject iframe embedding due to X-Frame-Options or CSP.
 */
function isRestrictedFromIframe(url: string): boolean {
  try {
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Check if it's a YouTube video watch or embed link (which CAN be embedded)
    const isYtVideo =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(trimmed);
    if (isYtVideo) return false;

    // Wikipedia allows iframe embedding
    if (/wikipedia\.org/i.test(trimmed)) return false;

    // Top sites that strictly send X-Frame-Options: SAMEORIGIN / DENY
    if (
      /youtube\.com/i.test(trimmed) ||
      /google\.com/i.test(trimmed) ||
      /chatgpt\.com/i.test(trimmed) ||
      /openai\.com/i.test(trimmed) ||
      /github\.com/i.test(trimmed) ||
      /reddit\.com/i.test(trimmed) ||
      /x\.com|twitter\.com/i.test(trimmed) ||
      /netflix\.com/i.test(trimmed) ||
      /instagram\.com|facebook\.com/i.test(trimmed)
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Normalizes input URL into an embeddable format when possible.
 */
function normalizeWebUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0&enablejsapi=1";

  // Check if it's a YouTube video
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

  // Fallback to Wikipedia search or direct query
  return `https://en.m.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(trimmed)}`;
}

export const BrowserWidget: React.FC<BrowserWidgetProps> = ({
  widget,
  noteId = "",
  onUpdateWidget,
  onInsertToNote,
  className,
}) => {
  const config = (widget.config || {}) as BrowserWidgetConfig;
  const currentUrl = config.url || DEFAULT_EMBED_URL;
  const isDetached = Boolean(config.isDetached);

  const [inputVal, setInputVal] = useState(currentUrl);
  const [iframeSrc, setIframeSrc] = useState(normalizeWebUrl(currentUrl));
  const [history, setHistory] = useState<string[]>([currentUrl]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isBlocked = isRestrictedFromIframe(inputVal);

  // Sync state if widget config updates externally
  useEffect(() => {
    if (config.url && config.url !== inputVal) {
      setInputVal(config.url);
      setIframeSrc(normalizeWebUrl(config.url));
    }
  }, [config.url]);

  // Listen for docking events from the Desktop PiP window
  useEffect(() => {
    const unlistenDock = stashIpc.listenToEvent<{
      noteId: string;
      widgetId: string;
      url?: string;
    }>("stash://dock-browser-widget", (payload) => {
      if (payload.widgetId === widget.id || (payload.noteId === noteId && !payload.widgetId)) {
        const nextUrl = payload.url || currentUrl;
        setInputVal(nextUrl);
        setIframeSrc(normalizeWebUrl(nextUrl));
        onUpdateWidget({
          config: {
            ...config,
            isDetached: false,
            url: nextUrl,
          },
        });
        toast.show({
          message: "Browser Magnetically Docked",
          description: "Seamlessly snapped back into note.",
        });
      }
    });

    const unlistenUrl = stashIpc.listenToEvent<{
      noteId?: string;
      widgetId?: string;
      url: string;
    }>("stash://pip-browser-url-changed", (payload) => {
      if (payload.widgetId === widget.id && payload.url) {
        setInputVal(payload.url);
        onUpdateWidget({
          config: {
            ...config,
            url: payload.url,
          },
        });
      }
    });

    return () => {
      unlistenDock.then((fn) => fn());
      unlistenUrl.then((fn) => fn());
    };
  }, [widget.id, noteId, config, currentUrl, onUpdateWidget]);

  const navigateTo = useCallback(
    (url: string) => {
      const normalized = normalizeWebUrl(url);
      setInputVal(url);
      setIframeSrc(normalized);
      setIsLoading(true);

      setHistory((prev) => [...prev.slice(0, historyIdx + 1), url]);
      setHistoryIdx((prev) => prev + 1);

      onUpdateWidget({
        config: {
          ...config,
          url,
        },
      });
    },
    [historyIdx, config, onUpdateWidget]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (isRestrictedFromIframe(inputVal)) {
      // If user submitted a site like google.com or youtube.com, launch immediately in PiP
      void handleDetachToPip(inputVal);
      return;
    }

    navigateTo(inputVal);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setInputVal(prev);
      setIframeSrc(normalizeWebUrl(prev));
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
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

  const handleDetachToPip = async (targetUrl?: string) => {
    const urlToOpen = targetUrl || inputVal || DEFAULT_EMBED_URL;
    try {
      onUpdateWidget({
        config: {
          ...config,
          isDetached: true,
          url: urlToOpen,
        },
      });

      await stashIpc.openPipBrowser({
        url: urlToOpen,
        noteId,
        widgetId: widget.id,
      });

      toast.show({
        message: "Picture-in-Picture Active",
        description: "Floating window is now active above desktop.",
      });
    } catch (e) {
      console.error("Failed to open PiP window", e);
      toast.error("Could not open PiP window", String(e));
    }
  };

  const handleSnapBack = async () => {
    onUpdateWidget({
      config: {
        ...config,
        isDetached: false,
      },
    });

    await stashIpc.closePipBrowser();

    toast.show({
      message: "Magnetically Docked",
      description: "Browser returned to your note canvas.",
    });
  };

  const handleInsertLink = () => {
    if (!onInsertToNote) return;
    const cleanUrl = inputVal.trim();
    const domain = cleanUrl.replace(/^https?:\/\//i, "").split("/")[0] || "Web Link";
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const isYt = /youtube\.com|youtu\.be/i.test(cleanUrl);
    const titlePrefix = isYt ? "▶️ YouTube Media" : "🌐 Web Reference";

    const summary = `\n### ${titlePrefix}: [${domain}](${cleanUrl})
> *Saved from Browser on ${dateStr}*

- **Link**: [${cleanUrl}](${cleanUrl})\n`;

    onInsertToNote(summary);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inputVal);
    toast.show({ message: "URL copied to clipboard" });
  };

  // If currently popped out into desktop window, show the magnetic docked placeholder
  if (isDetached) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "relative flex flex-col items-center justify-center p-6 rounded-b-xl border-t border-dashed border-primary/40 bg-primary/5 text-center overflow-hidden select-none",
          className
        )}
      >
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/10 via-brand/20 to-primary/10 blur-md pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col items-center gap-3 max-w-sm">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 text-primary shadow-inner">
            <Magnet className="h-6 w-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground tracking-wide flex items-center justify-center gap-1.5">
              <span>Active in Picture-in-Picture</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
                Floating
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs font-mono">
              {inputVal}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleSnapBack}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Magnet className="h-3.5 w-3.5 rotate-45" />
              <span>Snap Back to Note</span>
            </button>

            <button
              type="button"
              onClick={() => handleDetachToPip()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Bring PiP window to front"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Focus PiP</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.94, y: -10, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "flex flex-col bg-background/95 rounded-b-xl border-t border-border/40 overflow-hidden select-none",
        className
      )}
    >
      {/* Browser Controls Bar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 border-b border-border/40 text-xs">
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
            onClick={() => navigateTo(DEFAULT_EMBED_URL)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Default Player"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Address / Search Bar */}
        <form onSubmit={handleFormSubmit} className="flex-1 min-w-0 flex items-center relative">
          <div className="absolute left-2 text-muted-foreground pointer-events-none">
            <Globe className="h-3 w-3" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter web URL or YouTube video link..."
            className="w-full h-7 pl-6 pr-2 rounded-md bg-background border border-border/70 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
          />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Copy current URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {onInsertToNote && (
            <WidgetInsertButton
              onInsert={handleInsertLink}
              label="Insert to note"
              insertedLabel="Inserted to note!"
              variant="compact"
            />
          )}

          {/* Seamless Magnetic PiP Detach Button */}
          <button
            type="button"
            onClick={() => handleDetachToPip()}
            className="flex items-center gap-1 px-2.5 h-7 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-medium transition-all group shadow-2xs"
            title="Detach into native floating Picture-in-Picture window"
          >
            <Magnet className="h-3 w-3 group-hover:rotate-45 transition-transform text-primary" />
            <span>Pop out PiP</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* Preset Bookmarks Row */}
      <div className="flex items-center gap-1 px-2.5 py-1 bg-muted/20 border-b border-border/30 overflow-x-auto no-scrollbar text-[10px]">
        <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider text-[9px] mr-1 shrink-0">
          Bookmarks:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              if (p.isNativeOnly) {
                // If it's a native-only site like Google, YouTube or ChatGPT, pop out directly
                void handleDetachToPip(p.url);
              } else {
                navigateTo(p.url);
              }
            }}
            className={cn(
              "px-2 py-0.5 rounded border text-[10px] whitespace-nowrap transition-colors flex items-center gap-1",
              inputVal.includes(p.url.replace("https://www.", "").replace("https://", ""))
                ? "bg-primary/15 text-primary border-primary/30 font-medium"
                : "border-transparent bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground"
            )}
            title={p.isNativeOnly ? "Opens in unrestricted native PiP window" : "Embeds directly in note"}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {p.isNativeOnly && <ExternalLink className="h-2 w-2 opacity-60 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* Viewport Frame */}
      <div className="relative w-full h-[320px] bg-card overflow-hidden">
        {/* If the current site strictly rejects iframe embedding, show the native PiP Portal Card */}
        {isBlocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-card via-background to-card text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-sm">
              <Tv className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground tracking-tight">
              Native PiP Desktop Mode
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              <span className="font-mono text-foreground font-medium">{inputVal}</span> restricts
              being embedded in frames. Open it in our native Picture-in-Picture window where all
              sites, videos, and accounts load 100% unrestricted.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleDetachToPip()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch in Picture-in-Picture</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </button>
              <button
                type="button"
                onClick={() => navigateTo(DEFAULT_EMBED_URL)}
                className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Player
              </button>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-xs z-10 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-popover/90 border border-border shadow-sm text-xs text-foreground">
                  <RotateCw className="h-3 w-3 animate-spin text-primary" />
                  <span>Loading embed player…</span>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title="Stash Browser Viewport"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </>
        )}
      </div>
    </motion.div>
  );
};
