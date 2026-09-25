/**
 * Note Metadata Helper
 *
 * Manages per-note extended metadata:
 * 1. PIN Lock & session unlock state
 * 2. Due dates & reminder status calculation
 * 3. Opacity / Translucency (Ghost Mode)
 */

import { stashIpc } from "@/lib/ipc/stash-ipc";

const PIN_PREFIX = "stash:pin:";
const DUE_PREFIX = "stash:due:";
const OPACITY_PREFIX = "stash:opacity:";
const EMOJI_PREFIX = "stash:emoji:";
const PAPER_PREFIX = "stash:paper:";
const FONT_PREFIX = "stash:font:";
const FRAME_PREFIX = "stash:frame:";

// In-memory set of note IDs currently unlocked in this app session
const unlockedInSession = new Set<string>();

/** Notify listeners when note metadata changes across all windows */
function dispatchMetaChangeEvent(noteId: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("stash:note-meta-changed", { detail: { noteId } })
    );
    void stashIpc.emitEvent("stash://note-meta-changed", { noteId });
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    const prefixes = [
      PIN_PREFIX,
      DUE_PREFIX,
      OPACITY_PREFIX,
      EMOJI_PREFIX,
      PAPER_PREFIX,
      FONT_PREFIX,
      FRAME_PREFIX,
    ];
    for (const prefix of prefixes) {
      if (e.key.startsWith(prefix)) {
        const noteId = e.key.slice(prefix.length);
        window.dispatchEvent(
          new CustomEvent("stash:note-meta-changed", { detail: { noteId } })
        );
        break;
      }
    }
  });
}

/* ------------------------------- PIN LOCK ------------------------------- */

export function getNotePin(noteId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${PIN_PREFIX}${noteId}`);
}

export function hasNotePin(noteId: string): boolean {
  return Boolean(getNotePin(noteId));
}

export function setNotePin(noteId: string, pin: string | null): void {
  if (typeof window === "undefined") return;
  if (!pin || !pin.trim()) {
    localStorage.removeItem(`${PIN_PREFIX}${noteId}`);
    unlockedInSession.delete(noteId);
  } else {
    localStorage.setItem(`${PIN_PREFIX}${noteId}`, pin.trim());
    unlockedInSession.add(noteId);
  }
  dispatchMetaChangeEvent(noteId);
}

export function isNoteSessionUnlocked(noteId: string): boolean {
  if (!hasNotePin(noteId)) return true;
  return unlockedInSession.has(noteId);
}

export function unlockNoteInSession(noteId: string, enteredPin: string): boolean {
  const actualPin = getNotePin(noteId);
  if (!actualPin) {
    unlockedInSession.add(noteId);
    return true;
  }
  if (actualPin === enteredPin.trim()) {
    unlockedInSession.add(noteId);
    dispatchMetaChangeEvent(noteId);
    return true;
  }
  return false;
}

export function lockNoteInSession(noteId: string): void {
  unlockedInSession.delete(noteId);
  dispatchMetaChangeEvent(noteId);
}

export function lockAllProtectedNotes(): void {
  unlockedInSession.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("stash:note-meta-changed", { detail: { noteId: "all" } })
    );
    void stashIpc.emitEvent("stash://note-meta-changed", { noteId: "all" });
  }
}

export function getProtectedNotesCount(): number {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PIN_PREFIX) && localStorage.getItem(key)) {
      count++;
    }
  }
  return count;
}

export function getUnlockedInSessionCount(): number {
  return unlockedInSession.size;
}

export function clearAllNotePins(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PIN_PREFIX)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  unlockedInSession.clear();
  window.dispatchEvent(
    new CustomEvent("stash:note-meta-changed", { detail: { noteId: "all" } })
  );
  void stashIpc.emitEvent("stash://note-meta-changed", { noteId: "all" });
}

/* ------------------------------ DUE DATES ------------------------------- */

export function getNoteDueDate(noteId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${DUE_PREFIX}${noteId}`);
}

export function setNoteDueDate(noteId: string, dateIso: string | null): void {
  if (typeof window === "undefined") return;
  if (!dateIso) {
    localStorage.removeItem(`${DUE_PREFIX}${noteId}`);
  } else {
    localStorage.setItem(`${DUE_PREFIX}${noteId}`, dateIso);
  }
  dispatchMetaChangeEvent(noteId);
}

export interface DueDateStatus {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isUpcoming: boolean;
}

export function getDueDateStatus(dateIso: string | null): DueDateStatus | null {
  if (!dateIso) return null;
  const target = new Date(dateIso);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfDayAfter = new Date(startOfToday.getTime() + 86400000 * 2);

  const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const isOverdue = target.getTime() < now.getTime() && targetDateOnly.getTime() < startOfToday.getTime();
  const isToday = targetDateOnly.getTime() === startOfToday.getTime();
  const isTomorrow = targetDateOnly.getTime() === startOfTomorrow.getTime();

  let label = "";
  const timeStr = target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isOverdue) {
    const diffDays = Math.ceil((startOfToday.getTime() - targetDateOnly.getTime()) / 86400000);
    label = diffDays === 1 ? `Overdue yesterday` : `Overdue by ${diffDays}d`;
  } else if (isToday) {
    label = `Due today ${timeStr}`;
  } else if (isTomorrow) {
    label = `Due tomorrow ${timeStr}`;
  } else if (targetDateOnly.getTime() < startOfDayAfter.getTime() + 86400000 * 5) {
    const dayName = target.toLocaleDateString("en-US", { weekday: "short" });
    label = `Due ${dayName} ${timeStr}`;
  } else {
    label = `Due ${target.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  return {
    label,
    isOverdue,
    isToday,
    isTomorrow,
    isUpcoming: !isOverdue && !isToday,
  };
}

/* ------------------------------- OPACITY -------------------------------- */

export const DEFAULT_OPACITY_KEY = "stash_default_opacity";

export function getNoteOpacity(noteId: string): number {
  if (typeof window === "undefined") return 100;
  const saved = localStorage.getItem(`${OPACITY_PREFIX}${noteId}`);
  if (saved) {
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? 100 : Math.max(30, Math.min(100, parsed));
  }
  const defaultOpacity = localStorage.getItem(DEFAULT_OPACITY_KEY);
  if (defaultOpacity) {
    const parsed = parseInt(defaultOpacity, 10);
    return isNaN(parsed) ? 100 : Math.max(30, Math.min(100, parsed));
  }
  return 100;
}

export function setNoteOpacity(noteId: string, opacity: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(30, Math.min(100, opacity));
  localStorage.setItem(`${OPACITY_PREFIX}${noteId}`, String(clamped));
  dispatchMetaChangeEvent(noteId);
}

/* ------------------------------- EMOJI ICON ------------------------------ */

export const EMOJI_PRESETS = [
  "🚀", "💡", "🎯", "⚡", "💻", "📝", "☕", "🎨",
  "🌿", "🔑", "📚", "🛠️", "💰", "🔥", "🌟", "📌",
  "🧠", "💬", "🏆", "🦄", "🏖️", "🍕", "🎮", "🧪",
] as const;

export function getNoteEmoji(noteId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${EMOJI_PREFIX}${noteId}`);
}

export function setNoteEmoji(noteId: string, emoji: string | null): void {
  if (typeof window === "undefined") return;
  if (!emoji || !emoji.trim()) {
    localStorage.removeItem(`${EMOJI_PREFIX}${noteId}`);
  } else {
    localStorage.setItem(`${EMOJI_PREFIX}${noteId}`, emoji.trim());
  }
  dispatchMetaChangeEvent(noteId);
}

/* --------------------------- PAPER TEXTURE / PATTERN --------------------- */

export const DEFAULT_PAPER_KEY = "stash_default_paper";

export type PaperPattern = "plain" | "dots" | "lines" | "grid" | "blueprint";

export const PAPER_PATTERNS: { id: PaperPattern; label: string; description: string }[] = [
  { id: "plain", label: "Clean Plain", description: "Smooth, distraction-free solid paper" },
  { id: "dots", label: "Dot Grid", description: "Bullet journal subtle dot matrix" },
  { id: "lines", label: "Ruled Notebook", description: "Classic horizontal notebook lines" },
  { id: "grid", label: "Engineering Graph", description: "Technical square grid paper" },
  { id: "blueprint", label: "Blueprint Mesh", description: "Architectural dual-grid layout" },
];

export function getNotePaper(noteId: string): PaperPattern {
  if (typeof window === "undefined") return "plain";
  const saved = localStorage.getItem(`${PAPER_PREFIX}${noteId}`);
  if (saved && ["plain", "dots", "lines", "grid", "blueprint"].includes(saved)) {
    return saved as PaperPattern;
  }
  const defaultPaper = localStorage.getItem(DEFAULT_PAPER_KEY);
  if (defaultPaper && ["plain", "dots", "lines", "grid", "blueprint"].includes(defaultPaper)) {
    return defaultPaper as PaperPattern;
  }
  return "plain";
}

export function setNotePaper(noteId: string, paper: PaperPattern): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PAPER_PREFIX}${noteId}`, paper);
  dispatchMetaChangeEvent(noteId);
}

export function getPaperPatternStyle(pattern: PaperPattern): React.CSSProperties {
  switch (pattern) {
    case "dots":
      return {
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        opacity: 0.08,
      };
    case "lines":
      return {
        backgroundImage: "linear-gradient(to bottom, transparent 27px, currentColor 28px)",
        backgroundSize: "100% 28px",
        opacity: 0.09,
      };
    case "grid":
      return {
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        opacity: 0.06,
      };
    case "blueprint":
      return {
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 0.5px, transparent 0.5px), linear-gradient(to bottom, currentColor 0.5px, transparent 0.5px)",
        backgroundSize: "32px 32px, 32px 32px, 8px 8px, 8px 8px",
        opacity: 0.07,
      };
    case "plain":
    default:
      return {};
  }
}

/* --------------------------- TYPOGRAPHY PERSONA -------------------------- */

export const DEFAULT_FONT_PERSONA_KEY = "stash_default_font_persona";

export type NoteFontPersona = "sans" | "serif" | "mono" | "casual";

export const FONT_PERSONAS: { id: NoteFontPersona; label: string; preview: string; fontClass: string }[] = [
  { id: "sans", label: "Modern Sans", preview: "Clean & contemporary Inter typography", fontClass: "font-sans" },
  { id: "serif", label: "Classic Serif", preview: "Editorial, literary & timeless serif", fontClass: "font-serif" },
  { id: "mono", label: "Dev Monospace", preview: "Code-centric technical monospace", fontClass: "font-mono text-[12.5px]" },
  { id: "casual", label: "Handwritten", preview: "Relaxed casual creative thought flow", fontClass: "italic tracking-wide font-sans" },
];

export function getNoteFont(noteId: string): NoteFontPersona {
  if (typeof window === "undefined") return "sans";
  const saved = localStorage.getItem(`${FONT_PREFIX}${noteId}`);
  if (saved && ["sans", "serif", "mono", "casual"].includes(saved)) {
    return saved as NoteFontPersona;
  }
  const defaultFont = localStorage.getItem(DEFAULT_FONT_PERSONA_KEY);
  if (defaultFont && ["sans", "serif", "mono", "casual"].includes(defaultFont)) {
    return defaultFont as NoteFontPersona;
  }
  return "sans";
}

export function setNoteFont(noteId: string, font: NoteFontPersona): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${FONT_PREFIX}${noteId}`, font);
  dispatchMetaChangeEvent(noteId);
}

/* -------------------------- FRAME & ACCENT STYLE ------------------------- */

export const DEFAULT_FRAME_KEY = "stash_default_frame";

export type NoteFrameStyle = "default" | "acrylic" | "neon" | "minimal";

export const FRAME_STYLES: { id: NoteFrameStyle; label: string; desc: string }[] = [
  { id: "default", label: "Classic Rim", desc: "Clean subtle border" },
  { id: "acrylic", label: "Glass Acrylic", desc: "Soft frosted border with inner shine" },
  { id: "neon", label: "Neon Ambient", desc: "Glow edge with color intensity" },
  { id: "minimal", label: "Borderless", desc: "Ultra-thin hairline edge" },
];

export function getNoteFrame(noteId: string): NoteFrameStyle {
  if (typeof window === "undefined") return "default";
  const saved = localStorage.getItem(`${FRAME_PREFIX}${noteId}`);
  if (saved && ["default", "acrylic", "neon", "minimal"].includes(saved)) {
    return saved as NoteFrameStyle;
  }
  const defaultFrame = localStorage.getItem(DEFAULT_FRAME_KEY);
  if (defaultFrame && ["default", "acrylic", "neon", "minimal"].includes(defaultFrame)) {
    return defaultFrame as NoteFrameStyle;
  }
  return "default";
}

export function setNoteFrame(noteId: string, frame: NoteFrameStyle): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${FRAME_PREFIX}${noteId}`, frame);
  dispatchMetaChangeEvent(noteId);
}

export function getFrameStyleClass(frame: NoteFrameStyle): string {
  switch (frame) {
    case "acrylic":
      return "border-white/40 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] ring-1 ring-white/20";
    case "neon":
      return "border-primary/80 shadow-[0_0_18px_rgba(var(--primary-rgb),0.25)] ring-1 ring-primary/50";
    case "minimal":
      return "border-border/30 shadow-none";
    case "default":
    default:
      return "border-border/60 shadow-xs";
  }
}

/* --------------------------- EMBEDDED WIDGETS --------------------------- */

const WIDGETS_PREFIX = "stash:widgets:";

export function getNoteWidgets<T = any>(noteId: string): T[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(`${WIDGETS_PREFIX}${noteId}`);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setNoteWidgets(noteId: string, widgets: any[]): void {
  if (typeof window === "undefined") return;
  if (!widgets || widgets.length === 0) {
    localStorage.removeItem(`${WIDGETS_PREFIX}${noteId}`);
  } else {
    localStorage.setItem(`${WIDGETS_PREFIX}${noteId}`, JSON.stringify(widgets));
  }
  dispatchMetaChangeEvent(noteId);
}

export function hasNoteWidgets(noteId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(`${WIDGETS_PREFIX}${noteId}`);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}


