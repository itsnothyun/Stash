import { useEffect, useRef } from "react";

/**
 * One place where every keyboard shortcut lives.
 *
 * Components declare what they want to happen; nothing registers its own
 * `keydown` listener. That keeps the bindings discoverable, prevents two
 * features from quietly claiming the same chord, and makes it possible to
 * render the correct glyphs next to menu items.
 */

export const IS_MAC =
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

export interface ShortcutBinding {
  /** Chord in the form "mod+shift+n". `mod` is ⌘ on macOS, Ctrl elsewhere. */
  keys: string;
  run: (event: KeyboardEvent) => void;
  /** Fire even while the user is typing in a field. Default: false. */
  allowInInput?: boolean;
  /** Temporarily disable without changing the array shape. */
  enabled?: boolean;
}

interface ParsedChord {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

function parseChord(keys: string): ParsedChord {
  let raw = keys.trim();
  let key = "";
  if (raw.endsWith("++")) {
    key = "+";
    raw = raw.slice(0, -2);
  }
  const parts = raw.toLowerCase().split("+").map((p) => p.trim());
  if (!key) {
    key = parts[parts.length - 1];
  }
  return {
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key,
  };
}

function matches(event: KeyboardEvent, chord: ParsedChord): boolean {
  const modPressed = IS_MAC ? event.metaKey : event.ctrlKey;
  if (chord.mod !== modPressed) return false;
  if (chord.alt !== event.altKey) return false;

  const pressed = event.key.toLowerCase();

  // Zoom in handles '=' (un-shifted), '+' (shifted '=' on US layouts, numpad add, or key 'add')
  if (chord.key === "=" || chord.key === "+") {
    return (
      pressed === "=" ||
      pressed === "+" ||
      pressed === "add" ||
      event.code === "Equal" ||
      event.code === "NumpadAdd" ||
      event.code === "Plus"
    );
  }

  // Zoom out handles '-' (with or without shift), '_' and NumpadSubtract
  if (chord.key === "-") {
    return (
      pressed === "-" ||
      pressed === "_" ||
      pressed === "subtract" ||
      event.code === "Minus" ||
      event.code === "NumpadSubtract"
    );
  }

  // Reset zoom handles '0' and Numpad0
  if (chord.key === "0") {
    return (
      pressed === "0" ||
      event.code === "Digit0" ||
      event.code === "Numpad0"
    );
  }

  if (chord.shift !== event.shiftKey) return false;

  // Shifted keys report their shifted character; compare against `code` too so
  // "mod+shift+n" still matches when the layout yields "N".
  if (pressed === chord.key) return true;
  return event.code.toLowerCase() === `key${chord.key}`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Bind a set of shortcuts for the lifetime of the calling component.
 * The bindings array is read through a ref, so it may be rebuilt every render
 * without re-attaching the listener.
 */
export function useShortcuts(bindings: ShortcutBinding[]): void {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target);

      for (const binding of bindingsRef.current) {
        if (binding.enabled === false) continue;
        if (editable && !binding.allowInInput) continue;
        if (!matches(event, parseChord(binding.keys))) continue;

        event.preventDefault();
        event.stopPropagation();
        binding.run(event);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);
}

const KEY_GLYPHS: Record<string, string> = {
  enter: "⏎",
  escape: "Esc",
  arrowup: "↑",
  arrowdown: "↓",
  ",": ",",
  "=": "+",
  "+": "+",
  "-": "-",
  "0": "0",
};

/** Render a chord with the glyphs the host OS actually uses. */
export function formatShortcut(keys: string): string {
  const chord = parseChord(keys);
  const parts: string[] = [];

  if (chord.mod) parts.push(IS_MAC ? "⌘" : "Ctrl");
  if (chord.alt) parts.push(IS_MAC ? "⌥" : "Alt");
  if (chord.shift) parts.push(IS_MAC ? "⇧" : "Shift");

  const key = KEY_GLYPHS[chord.key] ?? chord.key.toUpperCase();
  parts.push(key);

  return IS_MAC ? parts.join("") : parts.join("+");
}

/** The application's default bindings, named so menus and help stay in sync. */
export const SHORTCUTS = {
  quickCapture: "mod+shift+n",
  commandPalette: "mod+k",
  search: "mod+f",
  settings: "mod+,",
  closeWindow: "mod+w",
  duplicate: "mod+d",
  alwaysOnTop: "mod+shift+p",
  archive: "mod+shift+a",
  zoomIn: "mod+=",
  zoomOut: "mod+-",
  resetZoom: "mod+0",
} as const;

export type ShortcutCategory = "global" | "editor" | "library" | "windows";

export interface ShortcutItem {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  keys: string;
  context: string;
}

export const SHORTCUTS_LIST: ShortcutItem[] = [
  {
    id: "quick-capture",
    name: "Global Quick Capture",
    description: "Instantly create a floating stash from any app in the OS",
    category: "global",
    keys: "mod+shift+n",
    context: "Global Desktop",
  },
  {
    id: "command-palette",
    name: "Command Palette",
    description: "Search actions, filter notes, switch views, or jump to settings",
    category: "global",
    keys: "mod+k",
    context: "Library Hub",
  },
  {
    id: "quick-search",
    name: "Focus Full-Text Search",
    description: "Instantly jump into the search bar and filter your stashes",
    category: "library",
    keys: "mod+f",
    context: "Library Hub",
  },
  {
    id: "settings",
    name: "Open Settings Modal",
    description: "Configure appearance, editor, defaults, and vault privacy",
    category: "global",
    keys: "mod+,",
    context: "Everywhere",
  },
  {
    id: "close-window",
    name: "Close Active Window / Stash",
    description: "Dismiss the current dialog, drawer, or floating stash note",
    category: "windows",
    keys: "escape",
    context: "Floating Stash",
  },
  {
    id: "always-on-top",
    name: "Toggle Always On Top",
    description: "Pin floating stash above IDEs, browsers, and game windows",
    category: "windows",
    keys: "mod+shift+p",
    context: "Floating Stash",
  },
  {
    id: "duplicate-note",
    name: "Duplicate Stash",
    description: "Create an exact clone of the current note with fresh timestamp",
    category: "library",
    keys: "mod+d",
    context: "Library / Stash",
  },
  {
    id: "archive-note",
    name: "Archive / Restore Stash",
    description: "Send note to archive or restore it back to active stash",
    category: "library",
    keys: "mod+shift+a",
    context: "Library / Stash",
  },
  {
    id: "zoom-in",
    name: "Zoom Interface In",
    description: "Scale up library and floating stash views (+10%)",
    category: "windows",
    keys: "mod+=",
    context: "Everywhere",
  },
  {
    id: "zoom-out",
    name: "Zoom Interface Out",
    description: "Scale down library and floating stash views (-10%)",
    category: "windows",
    keys: "mod+-",
    context: "Everywhere",
  },
  {
    id: "reset-zoom",
    name: "Reset Zoom to 100%",
    description: "Restore standard 100% DPI viewport scale",
    category: "windows",
    keys: "mod+0",
    context: "Everywhere",
  },
  {
    id: "slash-menu",
    name: "Slash Commands Menu",
    description: "Type '/' at start of line or space to insert headings, tables, or widgets",
    category: "editor",
    keys: "/",
    context: "Editor",
  },
  {
    id: "inline-math",
    name: "Evaluate Inline Math",
    description: "Type an equation ending with '=' to compute instantly (e.g. 15 * 8 =)",
    category: "editor",
    keys: "=",
    context: "Editor",
  },
  {
    id: "checklist-toggle",
    name: "Insert Checklist Item",
    description: "Insert an interactive checkbox to track todos and tasks",
    category: "editor",
    keys: "mod+shift+9",
    context: "Editor",
  },
  {
    id: "bold-text",
    name: "Bold Formatting",
    description: "Toggle bold style on highlighted text",
    category: "editor",
    keys: "mod+b",
    context: "Editor",
  },
  {
    id: "italic-text",
    name: "Italic Formatting",
    description: "Toggle italic style on highlighted text",
    category: "editor",
    keys: "mod+i",
    context: "Editor",
  },
  {
    id: "underline-text",
    name: "Underline Formatting",
    description: "Toggle underline on highlighted text",
    category: "editor",
    keys: "mod+u",
    context: "Editor",
  },
  {
    id: "highlight-text",
    name: "Color Highlight",
    description: "Apply soft fluorescent highlight to selected phrase",
    category: "editor",
    keys: "mod+shift+h",
    context: "Editor",
  },
  {
    id: "strike-text",
    name: "Strikethrough Formatting",
    description: "Cross out text to indicate deprecation or completion",
    category: "editor",
    keys: "mod+shift+x",
    context: "Editor",
  },
  {
    id: "bulk-select",
    name: "Range / Multi-Select Notes",
    description: "Shift-click notes in the library to bulk-select and batch archive or trash",
    category: "library",
    keys: "shift+click",
    context: "Library Hub",
  },
  {
    id: "roll-up-shade",
    name: "Window Roll-Up / Shade",
    description: "Double click titlebar to roll stash up into a sleek ambient bar",
    category: "windows",
    keys: "double-click",
    context: "Floating Stash Titlebar",
  },
];

export function exportShortcutsMarkdown(): string {
  const lines = [
    "# Stash — Keyboard Shortcuts & Hotkeys Matrix",
    "",
    "| Functionality | Shortcut | Context | Description |",
    "| :--- | :--- | :--- | :--- |",
  ];
  for (const item of SHORTCUTS_LIST) {
    const formatted = formatShortcut(item.keys);
    lines.push(`| **${item.name}** | \`${formatted}\` | ${item.context} | ${item.description} |`);
  }
  return lines.join("\n");
}

