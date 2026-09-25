import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NoteColor, NOTE_COLORS } from "@/features/stash/types/color";
import {
  EMOJI_PRESETS,
  FONT_PERSONAS,
  FRAME_STYLES,
  NoteFontPersona,
  NoteFrameStyle,
  PAPER_PATTERNS,
  PaperPattern,
  getPaperPatternStyle,
  getFrameStyleClass,
} from "@/features/stash/note-meta";
import {
  Smiley as Smile,
  FileText,
  TextT as Type,
  Square,
  Palette,
  Sparkle as Sparkles,
  Check,
  ArrowCounterClockwise as RotateCcw,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

interface NotePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  noteColor: NoteColor;
  onChangeColor?: (color: NoteColor) => void;
  currentEmoji: string | null;
  onChangeEmoji: (emoji: string | null) => void;
  currentPaper: PaperPattern;
  onChangePaper: (paper: PaperPattern) => void;
  currentFont: NoteFontPersona;
  onChangeFont: (font: NoteFontPersona) => void;
  currentFrame: NoteFrameStyle;
  onChangeFrame: (frame: NoteFrameStyle) => void;
}

type PersonaTab = "emoji" | "paper" | "font" | "frame" | "color";

const TABS: { id: PersonaTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "emoji", label: "Emoji Icon", icon: Smile },
  { id: "paper", label: "Paper Pattern", icon: FileText },
  { id: "font", label: "Typography", icon: Type },
  { id: "frame", label: "Window Frame", icon: Square },
  { id: "color", label: "Color Tone", icon: Palette },
];

export const NotePersonaModal: React.FC<NotePersonaModalProps> = ({
  isOpen,
  onClose,
  noteTitle,
  noteColor,
  onChangeColor,
  currentEmoji,
  onChangeEmoji,
  currentPaper,
  onChangePaper,
  currentFont,
  onChangeFont,
  currentFrame,
  onChangeFrame,
}) => {
  const [activeTab, setActiveTab] = useState<PersonaTab>("emoji");
  const [customEmojiInput, setCustomEmojiInput] = useState("");

  const handleCustomEmojiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmojiInput.trim()) {
      onChangeEmoji(customEmojiInput.trim());
      setCustomEmojiInput("");
    }
  };

  const handleResetAll = () => {
    onChangeEmoji(null);
    onChangePaper("plain");
    onChangeFont("sans");
    onChangeFrame("default");
    if (onChangeColor) onChangeColor("Paper");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-lg p-0 overflow-hidden gap-0 border border-border shadow-2xl rounded-2xl bg-background flex flex-col max-h-[calc(100vh-20px)]">
        <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Personalize Note Persona
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Customize icon, tactile paper texture, typography, and borders for this stash
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              title="Reset note persona to default clean style"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors mr-6"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </DialogHeader>

        {/* Live Stash Preview Badge */}
        <div className="px-5 py-2.5 bg-muted/40 border-b border-border/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">Live Note Header:</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background border border-border/60 shadow-xs max-w-[280px]">
            <span className="text-base leading-none shrink-0">
              {currentEmoji || "📝"}
            </span>
            <span className="font-semibold text-xs truncate text-foreground">
              {noteTitle || "Untitled Stash"}
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded font-mono text-muted-foreground bg-muted ml-auto shrink-0">
              {currentPaper} · {currentFont}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/60 px-4 bg-muted/10 gap-1 overflow-x-auto shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-0">
          {/* TAB 1: EMOJI & ICON */}
          {activeTab === "emoji" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Choose Note Icon</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Display an expressive emoji on your note titlebar and library card
                  </p>
                </div>
                {currentEmoji && (
                  <button
                    type="button"
                    onClick={() => onChangeEmoji(null)}
                    className="text-[11px] text-destructive hover:underline font-medium"
                  >
                    Clear Icon
                  </button>
                )}
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_PRESETS.map((emoji) => {
                  const isSelected = currentEmoji === emoji;
                  return (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onChangeEmoji(isSelected ? null : emoji)}
                      className={cn(
                        "h-10 w-10 flex items-center justify-center text-xl rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/15 border-primary shadow-sm ring-2 ring-primary/30"
                          : "border-border/60 hover:bg-muted/60 hover:border-border"
                      )}
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom Emoji / Symbol input */}
              <form onSubmit={handleCustomEmojiSubmit} className="flex items-center gap-2 pt-2 border-t border-border/40">
                <input
                  type="text"
                  placeholder="Paste or type custom emoji / glyph (e.g. 🦊, 🪐, ⚡)..."
                  value={customEmojiInput}
                  onChange={(e) => setCustomEmojiInput(e.target.value)}
                  maxLength={4}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!customEmojiInput.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Set Custom
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PAPER PATTERNS */}
          {activeTab === "paper" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Tactile Paper Pattern</h4>
                <p className="text-[11px] text-muted-foreground">
                  Subtle, distraction-free textured overlays that blend with any note hue
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAPER_PATTERNS.map((pattern) => {
                  const isSelected = currentPaper === pattern.id;
                  const patternStyle = getPaperPatternStyle(pattern.id);
                  return (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => onChangePaper(pattern.id)}
                      className={cn(
                        "relative flex flex-col p-3 rounded-xl border text-left transition-all overflow-hidden cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      {/* Background texture preview swatch */}
                      <div
                        className="absolute inset-0 pointer-events-none text-foreground z-0"
                        style={patternStyle}
                      />
                      <div className="relative z-10 flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {pattern.label}
                        </span>
                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" weight="bold" />
                          </div>
                        )}
                      </div>
                      <p className="relative z-10 text-[10px] text-muted-foreground leading-tight">
                        {pattern.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Real-time paper preview box */}
              <div className="mt-3 relative rounded-xl border border-border/80 p-3.5 overflow-hidden bg-background">
                <div
                  className="absolute inset-0 pointer-events-none text-foreground"
                  style={getPaperPatternStyle(currentPaper)}
                />
                <div className="relative z-10 space-y-1">
                  <div className="text-[11px] font-semibold text-foreground">
                    Texture Preview: {PAPER_PATTERNS.find((p) => p.id === currentPaper)?.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground italic leading-relaxed">
                    "Creativity is intelligence having fun." Bullet notes, architectural sketches, and thoughts float effortlessly on this tactile canvas.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY PERSONA */}
          {activeTab === "font" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Typography Persona</h4>
                <p className="text-[11px] text-muted-foreground">
                  Select how text feels when reading and composing this note
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FONT_PERSONAS.map((font) => {
                  const isSelected = currentFont === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => onChangeFont(font.id)}
                      className={cn(
                        "flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {font.label}
                        </span>
                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" weight="bold" />
                          </div>
                        )}
                      </div>
                      <p className={cn("text-xs text-foreground/80 my-1 truncate", font.fontClass)}>
                        The quick brown fox jumps over the lazy dog.
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {font.preview}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WINDOW RIM & FRAME */}
          {activeTab === "frame" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Window Frame & Glow Style</h4>
                <p className="text-[11px] text-muted-foreground">
                  Adjust the outer border, frosted edge, or ambient neon illumination of the floating stash
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FRAME_STYLES.map((frame) => {
                  const isSelected = currentFrame === frame.id;
                  const frameClass = getFrameStyleClass(frame.id);
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => onChangeFrame(frame.id)}
                      className={cn(
                        "flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {frame.label}
                        </span>
                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" weight="bold" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {frame.desc}
                      </p>
                      <div className={cn("h-4 rounded border bg-muted/40", frameClass)} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: COLOR TONE */}
          {activeTab === "color" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Note Hue & Theme Tone</h4>
                <p className="text-[11px] text-muted-foreground">
                  Carefully calibrated tone palette that renders cleanly in both light and dark desktop themes
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {NOTE_COLORS.map((col) => {
                  const isSelected = noteColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onChangeColor && onChangeColor(col.id)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50 font-semibold"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div
                        className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: col.dotColor }}
                      />
                      <span className="text-xs text-foreground truncate">
                        {col.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Changes save automatically to this note
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
