import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Note } from "../types/note";
import { getColorClass } from "../types/color";
import {
  PaperPattern,
  getPaperPatternStyle,
  NoteFontPersona,
  FONT_PERSONAS,
  NoteFrameStyle,
  getFrameStyleClass,
} from "../note-meta";
import { deriveNoteTitle } from "@/lib/utils/text";
import { formatNoteDate } from "@/lib/utils/dates";
import { toBlob, toPng } from "html-to-image";
import { toast } from "@/components/ui/toast";
import {
  Camera,
  Copy,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StashLogo } from "@/components/shared/stash-logo";

interface NoteExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  noteEmoji?: string | null;
  notePaper?: PaperPattern;
  noteFont?: NoteFontPersona;
  noteFrame?: NoteFrameStyle;
}

type BackdropPreset =
  | "sunset"
  | "aurora"
  | "ocean"
  | "slate"
  | "paper"
  | "neon"
  | "transparent";

const BACKDROPS: {
  id: BackdropPreset;
  label: string;
  bgClass: string;
  dotColor: string;
}[] = [
  {
    id: "sunset",
    label: "Sunset Glow",
    bgClass: "bg-gradient-to-br from-rose-500 via-pink-500 to-indigo-600",
    dotColor: "#ec4899",
  },
  {
    id: "aurora",
    label: "Deep Aurora",
    bgClass: "bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600",
    dotColor: "#14b8a6",
  },
  {
    id: "ocean",
    label: "Azure Ocean",
    bgClass: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-700",
    dotColor: "#3b82f6",
  },
  {
    id: "neon",
    label: "Cyber Neon",
    bgClass: "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-cyan-400",
    dotColor: "#c026d3",
  },
  {
    id: "slate",
    label: "Dark Minimal",
    bgClass: "bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950",
    dotColor: "#0f172a",
  },
  {
    id: "paper",
    label: "Warm Craft",
    bgClass: "bg-gradient-to-br from-amber-100 via-orange-50 to-stone-200 text-stone-800",
    dotColor: "#f59e0b",
  },
  {
    id: "transparent",
    label: "Transparent",
    bgClass: "bg-transparent border-2 border-dashed border-border/60",
    dotColor: "#a1a1aa",
  },
];

export const NoteExportImageModal: React.FC<NoteExportImageModalProps> = ({
  isOpen,
  onClose,
  note,
  noteEmoji,
  notePaper = "plain",
  noteFont = "sans",
  noteFrame = "default",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedBackdrop, setSelectedBackdrop] =
    useState<BackdropPreset>("sunset");
  const [padding, setPadding] = useState<number>(40);
  const [cardRadius, setCardRadius] = useState<number>(14);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showTrafficDots, setShowTrafficDots] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const displayTitle = deriveNoteTitle(note.title, note.plainText);
  const currentBackdrop =
    BACKDROPS.find((b) => b.id === selectedBackdrop) || BACKDROPS[0];
  const fontPersona = FONT_PERSONAS.find((f) => f.id === noteFont);

  // Parse lines or checklist items from plainText
  const contentLines = (note.plainText || "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });
      if (!blob) throw new Error("Could not generate image blob");

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.show({
          message: "Card copied to clipboard! Ready to paste into Slack or Docs.",
        });
      } else {
        toast.show({
          message: "Clipboard image API not supported; downloading PNG instead.",
        });
        handleDownloadImage();
      }
    } catch (err) {
      console.error(err);
      toast.show({ message: "Failed to copy image to clipboard" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });
      const link = document.createElement("a");
      const safeTitle = (note.title || "stash-note")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .slice(0, 32);
      link.download = `${safeTitle || "stash"}-card.png`;
      link.href = dataUrl;
      link.click();
      toast.show({ message: `Downloaded ${safeTitle || "stash"}-card.png` });
    } catch (err) {
      console.error(err);
      toast.show({ message: "Failed to download PNG image" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 border border-border shadow-2xl rounded-2xl bg-background">
        <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Share Note as Beautiful Image
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Export or copy high-resolution, social-ready graphics for Slack, Discord, and presentations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mr-6">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{isExporting ? "Rendering…" : "Copy Image"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Controls Sidebar */}
          <div className="p-4 border-r border-border/60 space-y-4 bg-muted/10 text-xs">
            {/* Backdrop Palette */}
            <div>
              <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block mb-2">
                Backdrop Theme
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {BACKDROPS.map((bd) => {
                  const isSelected = selectedBackdrop === bd.id;
                  return (
                    <button
                      key={bd.id}
                      type="button"
                      onClick={() => setSelectedBackdrop(bd.id)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 font-semibold shadow-xs"
                          : "border-border/60 hover:bg-muted/50"
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: bd.dotColor }}
                      />
                      <span className="text-[11px] truncate">{bd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Padding Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">Canvas Padding</span>
                <span className="font-mono text-muted-foreground">{padding}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="64"
                step="4"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Corner Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">Card Curvature</span>
                <span className="font-mono text-muted-foreground">{cardRadius}px</span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                step="2"
                value={cardRadius}
                onChange={(e) => setCardRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-border/40 space-y-2 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Window Dots</span>
                <input
                  type="checkbox"
                  checked={showTrafficDots}
                  onChange={(e) => setShowTrafficDots(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Stash Watermark</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
              </label>
            </div>
          </div>

          {/* Live Preview Canvas Area */}
          <div className="md:col-span-2 p-6 flex items-center justify-center bg-muted/40 min-h-[380px] max-h-[460px] overflow-auto select-none">
            {/* The Actual Export Wrapper Node */}
            <div
              ref={cardRef}
              style={{ padding: `${padding}px` }}
              className={cn(
                "transition-all duration-200 flex flex-col items-center justify-center max-w-[540px] w-full",
                currentBackdrop.bgClass
              )}
            >
              {/* Inner Stash Card */}
              <div
                style={{ borderRadius: `${cardRadius}px` }}
                className={cn(
                  "relative w-full overflow-hidden border shadow-2xl transition-all",
                  getColorClass(note.color),
                  getFrameStyleClass(noteFrame)
                )}
              >
                {/* Tactile Paper Texture Backdrop if selected */}
                {notePaper !== "plain" && (
                  <div
                    className="pointer-events-none absolute inset-0 text-foreground z-0"
                    style={getPaperPatternStyle(notePaper)}
                  />
                )}

                {/* Card Header Chrome */}
                <div className="relative z-10 flex h-8 items-center justify-between border-b border-current/10 px-3 select-none">
                  <div className="flex items-center gap-2">
                    {showTrafficDots && (
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      {noteEmoji && <span>{noteEmoji}</span>}
                      <span className="truncate max-w-[200px]">
                        {displayTitle || "Untitled Stash"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground opacity-70 font-mono">
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>

                {/* Card Content Body */}
                <div
                  className={cn(
                    "relative z-10 p-4 pt-3 text-xs leading-relaxed max-h-[300px] overflow-hidden select-text",
                    fontPersona?.fontClass
                  )}
                >
                  {contentLines.length === 0 ? (
                    <p className="italic text-muted-foreground/60 py-3">
                      (No text content in this note)
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {contentLines.slice(0, 14).map((line, idx) => {
                        const isBullet = line.startsWith("- ") || line.startsWith("* ");
                        const isTodo = line.startsWith("[ ] ") || line.startsWith("[x] ");
                        const isTodoDone = line.startsWith("[x] ");

                        if (isTodo) {
                          return (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span
                                className={cn(
                                  "h-3 w-3 mt-0.5 rounded-[3px] border flex items-center justify-center shrink-0",
                                  isTodoDone
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-current/40"
                                )}
                              >
                                {isTodoDone && <Check className="h-2 w-2 stroke-[3]" />}
                              </span>
                              <span
                                className={cn(
                                  isTodoDone && "line-through opacity-50"
                                )}
                              >
                                {line.replace(/^\[[ x]\]\s*/, "")}
                              </span>
                            </div>
                          );
                        }

                        if (isBullet) {
                          return (
                            <div key={idx} className="flex items-start gap-1.5 pl-1">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60 shrink-0" />
                              <span>{line.replace(/^[-*]\s*/, "")}</span>
                            </div>
                          );
                        }

                        return <p key={idx}>{line}</p>;
                      })}
                      {contentLines.length > 14 && (
                        <p className="text-[10px] opacity-50 italic pt-1">
                          +{contentLines.length - 14} more lines
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Watermark */}
                {showWatermark && (
                  <div className="relative z-10 px-4 py-2 border-t border-current/5 flex items-center justify-between text-[10px] text-muted-foreground/75 bg-current/[0.02]">
                    <div className="flex items-center gap-1.5">
                      <StashLogo size={12} showText={false} />
                      <span className="font-semibold tracking-tight">Stash</span>
                    </div>
                    <span className="text-[9px] opacity-70">local-first notes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
