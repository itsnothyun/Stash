import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  TextAlignCenter as AlignCenter,
  TextAlignJustify as AlignJustify,
  TextAlignLeft as AlignLeft,
  TextAlignRight as AlignRight,
  TextAa as Baseline,
  TextB as Bold,
  Check,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  Code,
  CheckSquare,
  CodeBlock as FileCode,
  TextHOne as Heading1,
  TextHTwo as Heading2,
  TextHThree as Heading3,
  Highlighter,
  TextItalic as Italic,
  Link as LinkIcon,
  ListBullets as List,
  ListNumbers as ListOrdered,
  Minus,
  Plus,
  Quotes as Quote,
  ArrowUUpRight as Redo2,
  TextAa as RemoveFormatting,
  TextStrikethrough as Strikethrough,
  TextSubscript as SubscriptIcon,
  TextSuperscript as SuperscriptIcon,
  TextT as Type,
  TextUnderline as UnderlineIcon,
  LinkBreak as Unlink,
  ArrowUUpLeft as Undo2,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  ArrowsDownUp as ArrowUpDown,
  TrendUp as TrendingUp,
  CalendarBlank as CalendarClock,
  Globe,
  Ruler,
  Target,
  Sun,
  Users,
  Kanban,
  Sparkle as Sparkles,
  Bug,
  Lightbulb,
  CodeBlock as Code2,
  BookOpen,
  Palette,
} from "@phosphor-icons/react";
import "@tiptap/extension-underline";
import "@tiptap/extension-subscript";
import "@tiptap/extension-superscript";
import "@tiptap/extension-highlight";
import "@tiptap/extension-text-align";
import "@tiptap/extension-color";
import "@tiptap/extension-font-family";
import "../extensions/font-size";
import { WidgetType } from "@/features/widgets/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
} from "../types/editor-options";
import { cn } from "@/lib/utils/cn";

/** Where the toolbar should sit: the screen rect of the current selection. */
export interface ToolbarAnchor {
  top: number;
  bottom: number;
  left: number;
}

/**
 * The screen rect of an editor's selection, or of the caret when nothing is
 * selected. Returns `null` before the view has mounted.
 */
export function anchorForSelection(editor: Editor | null): ToolbarAnchor | null {
  if (!editor || editor.isDestroyed || !editor.view?.dom.isConnected) return null;

  try {
    const { from, to } = editor.state.selection;
    const start = editor.view.coordsAtPos(from);
    const end = from === to ? start : editor.view.coordsAtPos(to);

    return {
      top: Math.min(start.top, end.top),
      bottom: Math.max(start.bottom, end.bottom),
      left: (start.left + end.left) / 2,
    };
  } catch {
    // coordsAtPos throws while the document is mid-replacement.
    return null;
  }
}

function formatShortcut(shortcut: string): string {
  if (typeof navigator === "undefined") return shortcut;
  const isMac = /mac|iphone|ipad/i.test(
    navigator.platform || navigator.userAgent
  );
  if (!isMac) return shortcut;

  return shortcut
    .replace(/Ctrl\+/gi, "⌘")
    .replace(/Shift\+/gi, "⇧")
    .replace(/Alt\+/gi, "⌥");
}

interface DockTooltipProps {
  label: string;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
  disabled?: boolean;
}

const DockTooltip: React.FC<DockTooltipProps> = ({
  label,
  shortcut,
  side = "top",
  children,
  disabled = false,
}) => {
  if (disabled) return children;

  const formattedShortcut = shortcut ? formatShortcut(shortcut) : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="flex items-center gap-1.5 py-1 px-2.5 text-[11px] shadow-lg pointer-events-none"
      >
        <span>{label}</span>
        {formattedShortcut && (
          <kbd className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-mono tracking-tight text-white/90 dark:bg-white/15 dark:text-neutral-200">
            {formattedShortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

interface FloatingToolbarProps {
  editor: Editor | null;
  /** Kept for backwards compatibility; dock is now in a fixed position */
  anchor?: ToolbarAnchor | null;
  /**
   * Blocks a checklist can't hold — headings, lists, quotes, dividers — are
   * dropped so a to-do row only offers formatting that applies to it.
   */
  blockControls?: boolean;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: (minimized?: boolean) => void;
  onAddWidget?: (type: WidgetType) => void;
}

/**
 * The formatting surface for every editing context in the app.
 *
 * It sits in a fixed dock at the bottom of the window/editor that can be
 * minimized to an unobtrusive pill or maximized to reveal full controls,
 * rather than popping up and moving around every time text is clicked.
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  editor,
  anchor: _anchor,
  blockControls = true,
  className,
  isMinimized,
  onToggleMinimize,
  onAddWidget,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [internalMinimized, setInternalMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("stash:editor-dock-minimized") === "true";
  });

  const isDockMinimized =
    isMinimized !== undefined ? isMinimized : internalMinimized;

  const handleToggleMinimize = (nextState?: boolean) => {
    const nextVal = nextState !== undefined ? nextState : !isDockMinimized;
    if (typeof window !== "undefined") {
      localStorage.setItem("stash:editor-dock-minimized", String(nextVal));
    }
    if (onToggleMinimize) {
      onToggleMinimize(nextVal);
    } else {
      setInternalMinimized(nextVal);
    }
  };

  // Active states live in ProseMirror, not React — re-render on every
  // transaction so the buttons reflect the cursor.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => (t + 1) % 1_000_000);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [blockStyleOpen, setBlockStyleOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);

  if (isDockMinimized) {
    return (
      <TooltipProvider delayDuration={200} skipDelayDuration={150}>
        <div
          role="toolbar"
          aria-label="Text formatting dock (minimized)"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            className
          )}
        >
          <DockTooltip label="Expand formatting dock" side="top">
            <button
              type="button"
              onClick={() => handleToggleMinimize(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-border/80",
                "bg-popover/90 px-3 py-1 shadow-md backdrop-blur-md",
                "text-muted-foreground transition-all duration-150",
                "hover:bg-popover hover:text-foreground hover:border-border hover:shadow-lg active:scale-95"
              )}
              aria-label="Maximize formatting dock"
            >
              <Type className="h-3.5 w-3.5 text-foreground" />
              <span className="text-[11px] font-medium tracking-tight">Format</span>
              <ChevronUp className="h-3.5 w-3.5 opacity-60" />
            </button>
          </DockTooltip>
        </div>
      </TooltipProvider>
    );
  }

  const fontFamily = editor?.getAttributes("textStyle")?.fontFamily || "";
  const fontSize = editor?.getAttributes("textStyle")?.fontSize || "";
  const textColor = editor?.getAttributes("textStyle")?.color || "";
  const highlight =
    editor?.getAttributes("highlight")?.color ||
    (editor?.isActive("highlight") ? "#fef08a" : "");

  const activeFont = FONT_FAMILIES.find((f) => f.value === fontFamily);
  const fontLabel = activeFont ? activeFont.label.split(" ")[0] : "Font";
  const sizeNum = parseInt(fontSize, 10) || 13;
  const sizeLabel = fontSize ? `${sizeNum}px` : "13px";

  const stepFontSize = (delta: number) => {
    if (!editor) return;
    const i = FONT_SIZES.findIndex((s) => s.numeric === sizeNum);
    const next =
      i === -1
        ? delta > 0
          ? 4
          : 2
        : Math.max(0, Math.min(FONT_SIZES.length - 1, i + delta));
    editor.chain().focus().setFontSize(FONT_SIZES[next].value).run();
  };

  const applyLink = () => {
    if (!editor) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!linkUrl.trim()) {
      chain.unsetLink().run();
    } else {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        url = `https://${url}`;
      }
      chain.setLink({ href: url }).run();
    }
    setLinkOpen(false);
  };

  const btn = (active: boolean) =>
    cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs transition-colors",
      active
        ? "bg-accent text-accent-foreground font-semibold shadow-xs"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      !editor && "opacity-40 pointer-events-none"
    );

  const Divider = () => (
    <div className="mx-0.5 h-4 w-px shrink-0 self-center bg-border/70" />
  );

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={150}>
      <div
        ref={panelRef}
        role="toolbar"
        aria-label="Text formatting dock"
        // Keeping the click off the document preserves the selection the user
        // is formatting, unless clicking into a form input (like the link input).
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== "INPUT") {
            e.preventDefault();
          }
        }}
        className={cn(
          "fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none",
          "flex flex-wrap items-center justify-center gap-0.5 rounded-xl border border-border/80",
          "bg-popover/95 px-2 py-1 shadow-2xl backdrop-blur-md",
          "animate-in fade-in-0 slide-in-from-bottom-2 duration-150",
          className
        )}
        style={{
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        {/* History */}
        <DockTooltip label="Undo" shortcut="Ctrl+Z" disabled={!editor || !editor.can().undo()}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor || !editor.can().undo()}
            className={cn(btn(false), "disabled:pointer-events-none disabled:opacity-30")}
            aria-label="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Redo" shortcut="Ctrl+Y" disabled={!editor || !editor.can().redo()}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor || !editor.can().redo()}
            className={cn(btn(false), "disabled:pointer-events-none disabled:opacity-30")}
            aria-label="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>

        <Divider />

        {/* Font family */}
        <DropdownMenu open={fontMenuOpen} onOpenChange={setFontMenuOpen}>
          <DockTooltip label="Font family" disabled={fontMenuOpen || !editor}>
            <DropdownMenuTrigger asChild disabled={!editor}>
              <button
                type="button"
                disabled={!editor}
                className="flex h-7 max-w-[92px] shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Font family"
              >
                <span className="truncate" style={{ fontFamily: fontFamily || "inherit" }}>
                  {fontLabel}
                </span>
                <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" />
              </button>
            </DropdownMenuTrigger>
          </DockTooltip>
          <DropdownMenuContent align="start" className="w-56 p-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Font family
            </div>
            {FONT_FAMILIES.map((font) => (
              <DropdownMenuItem
                key={font.label}
                onClick={() =>
                  font.value
                    ? editor?.chain().focus().setFontFamily(font.value).run()
                    : editor?.chain().focus().unsetFontFamily().run()
                }
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium" style={{ fontFamily: font.previewFamily }}>
                    {font.label}
                  </span>
                  {font.description && (
                    <span className="text-[10px] text-muted-foreground">
                      {font.description}
                    </span>
                  )}
                </div>
                {fontFamily === font.value && (
                  <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-foreground" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor?.chain().focus().unsetFontFamily().run()}
              className="text-[11px] text-muted-foreground"
            >
              Reset to default font
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font size stepper */}
        <div className={cn("flex shrink-0 items-center rounded border border-border/70 bg-background/60 p-0.5", !editor && "opacity-40 pointer-events-none")}>
          <DockTooltip label="Decrease font size" disabled={!editor}>
            <button
              type="button"
              onClick={() => stepFontSize(-1)}
              disabled={!editor}
              className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
              aria-label="Decrease font size"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
          </DockTooltip>
          <DropdownMenu open={fontSizeOpen} onOpenChange={setFontSizeOpen}>
            <DockTooltip label="Select font size" disabled={fontSizeOpen || !editor}>
              <DropdownMenuTrigger asChild disabled={!editor}>
                <button
                  type="button"
                  disabled={!editor}
                  className="flex h-6 min-w-[34px] items-center justify-center rounded px-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none"
                  aria-label="Select font size"
                >
                  {sizeLabel}
                </button>
              </DropdownMenuTrigger>
            </DockTooltip>
            <DropdownMenuContent align="center" className="min-w-[90px] p-1 text-xs">
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => editor?.chain().focus().setFontSize(size.value).run()}
                  className="flex items-center justify-between py-1 text-xs"
                >
                  <span>{size.label}</span>
                  {sizeNum === size.numeric && <Check className="ml-2 h-3 w-3 text-foreground" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().unsetFontSize().run()}
                className="text-[10px] text-muted-foreground"
              >
                Default (13px)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DockTooltip label="Increase font size" disabled={!editor}>
            <button
              type="button"
              onClick={() => stepFontSize(1)}
              disabled={!editor}
              className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
              aria-label="Increase font size"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </DockTooltip>
        </div>

        {blockControls && (
          <>
            <Divider />
            {/* Block style */}
            <DropdownMenu open={blockStyleOpen} onOpenChange={setBlockStyleOpen}>
              <DockTooltip label="Text style" disabled={blockStyleOpen || !editor}>
                <DropdownMenuTrigger asChild disabled={!editor}>
                  <button
                    type="button"
                    disabled={!editor}
                    className="flex h-7 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Text style"
                  >
                    <span>
                      {editor?.isActive("heading", { level: 1 })
                        ? "H1"
                        : editor?.isActive("heading", { level: 2 })
                        ? "H2"
                        : editor?.isActive("heading", { level: 3 })
                        ? "H3"
                        : editor?.isActive("blockquote")
                        ? "Quote"
                        : editor?.isActive("codeBlock")
                        ? "Code"
                        : "Normal"}
                    </span>
                    <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
              </DockTooltip>
              <DropdownMenuContent align="start" className="w-44 p-1 text-xs">
                <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()}>
                  <Baseline className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Normal text
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  <Heading1 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-bold">Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Heading 3</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
                  <Quote className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Blockquote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
                  <FileCode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Code block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <Divider />

        {/* Marks */}
        <DockTooltip label="Bold" shortcut="Ctrl+B" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("bold")))}
            aria-label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Italic" shortcut="Ctrl+I" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("italic")))}
            aria-label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Underline" shortcut="Ctrl+U" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("underline")))}
            aria-label="Underline"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Strikethrough" shortcut="Ctrl+Shift+X" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("strike")))}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="To-do list" shortcut="Ctrl+Shift+9" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("taskList") || editor?.isActive("taskItem")))}
            aria-label="To-do list"
            aria-pressed={Boolean(editor?.isActive("taskList") || editor?.isActive("taskItem"))}
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Inline code" shortcut="Ctrl+`" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("code")))}
            aria-label="Inline code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Subscript" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("subscript")))}
            aria-label="Subscript"
          >
            <SubscriptIcon className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
        <DockTooltip label="Superscript" disabled={!editor}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            disabled={!editor}
            className={btn(Boolean(editor?.isActive("superscript")))}
            aria-label="Superscript"
          >
            <SuperscriptIcon className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>

        <Divider />

        {/* Text colour */}
        <Popover open={textColorOpen} onOpenChange={setTextColorOpen}>
          <DockTooltip label="Text colour" disabled={textColorOpen || !editor}>
            <PopoverTrigger asChild disabled={!editor}>
              <button
                type="button"
                disabled={!editor}
                className={cn(
                  "flex h-7 shrink-0 flex-col items-center justify-center rounded px-1.5 transition-colors",
                  textColor
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !editor && "opacity-40 pointer-events-none"
                )}
                aria-label="Text colour"
              >
                <span className="text-[11px] font-bold leading-none">A</span>
                <div
                  className="mt-0.5 h-1 w-4 rounded-full border border-border/40"
                  style={{ backgroundColor: textColor || "currentColor" }}
                />
              </button>
            </PopoverTrigger>
          </DockTooltip>
          <PopoverContent align="start" className="w-52 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Text colour</span>
              {textColor && (
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run();
                    setTextColorOpen(false);
                  }}
                  className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.label}
                  type="button"
                  onClick={() => {
                    color.value
                      ? editor?.chain().focus().setColor(color.value).run()
                      : editor?.chain().focus().unsetColor().run();
                    setTextColorOpen(false);
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md border border-border/60 transition-transform hover:scale-110",
                    textColor === color.value && "ring-2 ring-brand ring-offset-1"
                  )}
                  style={{ backgroundColor: color.value || "var(--foreground)" }}
                  title={color.label}
                >
                  {textColor === color.value && (
                    <Check
                      className={cn(
                        "h-3 w-3",
                        color.value === "#18181b" || !color.value
                          ? "text-white"
                          : "text-foreground"
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
          <DockTooltip label="Highlight colour" disabled={highlightOpen || !editor}>
            <PopoverTrigger asChild disabled={!editor}>
              <button
                type="button"
                disabled={!editor}
                className={cn(
                  "flex h-7 shrink-0 flex-col items-center justify-center rounded px-1.5 transition-colors",
                  highlight
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !editor && "opacity-40 pointer-events-none"
                )}
                aria-label="Highlight colour"
              >
                <Highlighter className="h-3 w-3" />
                <div
                  className="mt-0.5 h-1 w-4 rounded-full border border-border/40"
                  style={{ backgroundColor: highlight || "transparent" }}
                />
              </button>
            </PopoverTrigger>
          </DockTooltip>
          <PopoverContent align="start" className="w-52 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Highlight</span>
              {highlight && (
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                  className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {HIGHLIGHT_COLORS.map((hl) => (
                <button
                  key={hl.label}
                  type="button"
                  onClick={() => {
                    hl.value
                      ? editor?.chain().focus().setHighlight({ color: hl.value }).run()
                      : editor?.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md border border-border/60 transition-transform hover:scale-110",
                    highlight === hl.value && hl.value && "ring-2 ring-brand ring-offset-1"
                  )}
                  style={{ backgroundColor: hl.value || "transparent" }}
                  title={hl.label}
                >
                  {!hl.value && <RemoveFormatting className="h-3 w-3 text-muted-foreground" />}
                  {highlight === hl.value && hl.value && (
                    <Check className="h-3 w-3 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {blockControls && (
          <>
            <Divider />

            {/* Alignment */}
            <DropdownMenu open={alignOpen} onOpenChange={setAlignOpen}>
              <DockTooltip label="Text alignment" disabled={alignOpen || !editor}>
                <DropdownMenuTrigger asChild disabled={!editor}>
                  <button
                    type="button"
                    disabled={!editor}
                    className="flex h-7 shrink-0 items-center gap-0.5 rounded px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Text alignment"
                  >
                    {editor?.isActive({ textAlign: "center" }) ? (
                      <AlignCenter className="h-3.5 w-3.5" />
                    ) : editor?.isActive({ textAlign: "right" }) ? (
                      <AlignRight className="h-3.5 w-3.5" />
                    ) : editor?.isActive({ textAlign: "justify" }) ? (
                      <AlignJustify className="h-3.5 w-3.5" />
                    ) : (
                      <AlignLeft className="h-3.5 w-3.5" />
                    )}
                    <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
              </DockTooltip>
              <DropdownMenuContent align="start" className="w-36 p-1 text-xs">
                {(
                  [
                    ["left", AlignLeft, "Align left"],
                    ["center", AlignCenter, "Align centre"],
                    ["right", AlignRight, "Align right"],
                    ["justify", AlignJustify, "Justify"],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => editor?.chain().focus().setTextAlign(value).run()}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                    {editor?.isActive({ textAlign: value }) && (
                      <Check className="ml-auto h-3 w-3" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* Lists */}
            <DockTooltip label="Bulleted list" shortcut="Ctrl+Shift+8" disabled={!editor}>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor}
                className={btn(Boolean(editor?.isActive("bulletList")))}
                aria-label="Bulleted list"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </DockTooltip>
            <DockTooltip label="Numbered list" shortcut="Ctrl+Shift+7" disabled={!editor}>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                disabled={!editor}
                className={btn(Boolean(editor?.isActive("orderedList")))}
                aria-label="Numbered list"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
            </DockTooltip>
            <DockTooltip label="Divider line" disabled={!editor}>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                disabled={!editor}
                className={btn(false)}
                aria-label="Divider line"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </DockTooltip>
          </>
        )}

        <Divider />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <DockTooltip label="Insert link" shortcut="Ctrl+K" disabled={linkOpen || !editor}>
            <PopoverTrigger asChild disabled={!editor}>
              <button
                type="button"
                disabled={!editor}
                onClick={() => {
                  if (!editor) return;
                  setLinkUrl(editor.getAttributes("link").href || "");
                  setLinkOpen(true);
                  setTimeout(() => linkInputRef.current?.focus(), 50);
                }}
                className={btn(Boolean(editor?.isActive("link")))}
                aria-label="Insert link"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
          </DockTooltip>
          <PopoverContent align="start" className="w-72 p-3 text-xs">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground">Insert or edit link</div>
              <input
                ref={linkInputRef}
                type="text"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <div className="flex items-center justify-between pt-1">
                {editor?.isActive("link") ? (
                  <button
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                      setLinkOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
                  >
                    <Unlink className="h-3 w-3" />
                    Remove
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLinkOpen(false)}
                    className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyLink}
                    className="rounded bg-brand px-2.5 py-1 text-[11px] font-medium text-brand-foreground hover:bg-brand/90"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear formatting */}
        <DockTooltip label="Clear all formatting" disabled={!editor}>
          <button
            type="button"
            disabled={!editor}
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus().unsetAllMarks();
              if (blockControls) chain.clearNodes();
              chain
                .unsetFontFamily()
                .unsetFontSize()
                .unsetColor()
                .unsetHighlight()
                .run();
            }}
            className={cn(btn(false), "hover:text-destructive")}
            aria-label="Clear all formatting"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>

        {/* Table controls - shown when cursor is inside a table */}
        {editor?.isActive("table") && (
          <>
            <Divider />
            <DockTooltip label="Add row above">
              <button
                type="button"
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                className={btn(false)}
                aria-label="Add row above"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">↑R</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Add row below">
              <button
                type="button"
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                className={btn(false)}
                aria-label="Add row below"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">↓R</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Delete row">
              <button
                type="button"
                onClick={() => editor?.chain().focus().deleteRow().run()}
                className={cn(btn(false), "hover:text-destructive")}
                aria-label="Delete row"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">×R</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Add column before">
              <button
                type="button"
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                className={btn(false)}
                aria-label="Add column before"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">←C</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Add column after">
              <button
                type="button"
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                className={btn(false)}
                aria-label="Add column after"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">→C</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Delete column">
              <button
                type="button"
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                className={cn(btn(false), "hover:text-destructive")}
                aria-label="Delete column"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">×C</span>
              </button>
            </DockTooltip>
            <DockTooltip label="Delete table">
              <button
                type="button"
                onClick={() => editor?.chain().focus().deleteTable().run()}
                className={cn(btn(false), "text-destructive hover:bg-destructive/10")}
                aria-label="Delete table"
              >
                <span className="font-mono text-[10px] font-semibold leading-none">×T</span>
              </button>
            </DockTooltip>
          </>
        )}

        {onAddWidget && (
          <>
            <Divider />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 shrink-0 items-center gap-1 rounded px-2 text-[11px] font-semibold text-foreground bg-surface hover:bg-surface-hover border border-border/60 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  aria-label="Attach Interactive Widget"
                  title="Attach Interactive Widget"
                >
                  <Plus className="h-3 w-3" weight="bold" />
                  <span>Widget</span>
                  <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 max-h-[70vh] overflow-y-auto text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  Interactive Tools
                </div>
                <DropdownMenuItem onClick={() => onAddWidget("calculator")} className="cursor-pointer">
                  <CalcIcon className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Quick Calculator</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("timer")} className="cursor-pointer">
                  <TimerIcon className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Focus & Pomodoro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("swap")} className="cursor-pointer">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Currency Converter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("ticker")} className="cursor-pointer">
                  <TrendingUp className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Market Tickers</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("countdown")} className="cursor-pointer">
                  <CalendarClock className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Countdown Timer</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("worldclock")} className="cursor-pointer">
                  <Globe className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>World Clock</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("unitconverter")} className="cursor-pointer">
                  <Ruler className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Unit Converter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("counter")} className="cursor-pointer">
                  <Target className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Tally Counter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("browser")} className="cursor-pointer">
                  <Globe className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Mini Web Browser</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  Component Blocks
                </div>
                <DropdownMenuItem onClick={() => onAddWidget("scratchpad")} className="cursor-pointer">
                  <Sun className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Daily Scratchpad</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("meeting")} className="cursor-pointer">
                  <Users className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Meeting Minutes</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("kanban")} className="cursor-pointer">
                  <Kanban className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Kanban Board</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("habits")} className="cursor-pointer">
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>7-Day Habit Tracker</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("bug")} className="cursor-pointer">
                  <Bug className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Bug Blitz & Triage</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("idea")} className="cursor-pointer">
                  <Lightbulb className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Idea Incubator</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("api")} className="cursor-pointer">
                  <Code2 className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>API & Tech Blueprint</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("reading")} className="cursor-pointer">
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Book & Article Digest</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddWidget("palette")} className="cursor-pointer">
                  <Palette className="mr-2 h-3.5 w-3.5 text-foreground" />
                  <span>Color Palette</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <Divider />

        {/* Minimize dock */}
        <DockTooltip label="Minimize dock">
          <button
            type="button"
            onClick={() => handleToggleMinimize(true)}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
            )}
            aria-label="Minimize formatting dock"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DockTooltip>
      </div>
    </TooltipProvider>
  );
};
