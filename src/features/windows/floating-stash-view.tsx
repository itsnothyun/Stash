import React, { useCallback, useEffect, useRef, useState } from "react";
import { Note, Revision } from "@/features/stash/types/note";
import { getColorClass, NoteColor, NOTE_COLORS, getColorDot } from "@/features/stash/types/color";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { TiptapEditor } from "@/features/editor/components/tiptap-editor";
import {
  appendPlainTextToContent,
  extractDoc,
  extractWidgets,
  serializeStashContent,
  stashContentFromPlainText,
} from "@/features/editor/stash-content";
import { ColorPicker } from "@/components/shared/color-picker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Archive,
  ArrowUpDown,
  Check,
  Copy,
  History,
  Minus,
  MoreHorizontal,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
  X,
  Plus,
  TrendingUp,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  Type,
  CalendarClock,
  FileDown,
  FileUp,
  ChevronDown,
  ChevronUp,
  Lock,
  KeyRound,
  Kanban,
  Sparkles,
  Palette,
  Calendar,
  Smile,
  Camera,
  ListTodo,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { NoteStatsHud } from "@/features/stash/components/note-stats-hud";
import { VoiceDictationButton } from "@/features/stash/components/voice-dictation-button";
import { organizeChecklist } from "@/features/stash/task-organizer";
import {
  isTodayTitle,
  findPreviousDailyNote,
  extractUnfinishedTasks,
} from "@/features/stash/daily-stash";
import { LogicalSize } from "@tauri-apps/api/dpi";
import {
  getDueDateStatus,
  getNoteDueDate,
  hasNotePin,
  isNoteSessionUnlocked,
  lockNoteInSession,
  setNoteDueDate,
  setNotePin,
  unlockNoteInSession,
  getNoteEmoji,
  setNoteEmoji,
  getNotePaper,
  setNotePaper,
  getPaperPatternStyle,
  getNoteFont,
  setNoteFont,
  getNoteFrame,
  setNoteFrame,
  getFrameStyleClass,
  NoteFontPersona,
  NoteFrameStyle,
  PaperPattern,
  FONT_PERSONAS,
} from "@/features/stash/note-meta";
import { NotePersonaModal } from "@/features/stash/components/note-persona-modal";
import { NoteExportImageModal } from "@/features/stash/components/note-export-image-modal";
import { NoteWidgetsCanvas } from "@/features/widgets/components/note-widgets-canvas";
import { NoteWidgetData, WidgetType } from "@/features/widgets/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { formatShortcut, SHORTCUTS, useShortcuts } from "@/lib/keyboard/shortcuts";
import {
  closeCurrentWindow,
  isTauri,
  minimizeCurrentWindow,
  setAlwaysOnTop,
} from "@/lib/tauri/window-manager";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { cn } from "@/lib/utils/cn";
import { formatNoteDate } from "@/lib/utils/dates";

export const POPULAR_SWAP_PAIRS = [
  { from: "USD", to: "EUR", label: "USD / EUR", name: "US Dollar / Euro" },
  { from: "ETH", to: "USDC", label: "ETH / USDC", name: "Ethereum / USD Coin" },
  { from: "BTC", to: "USD", label: "BTC / USD", name: "Bitcoin / US Dollar" },
  { from: "GBP", to: "USD", label: "GBP / USD", name: "British Pound / USD" },
  { from: "USD", to: "JPY", label: "USD / JPY", name: "US Dollar / Japanese Yen" },
  { from: "USD", to: "PHP", label: "USD / PHP", name: "USD / Philippine Peso" },
  { from: "VND", to: "PHP", label: "VND / PHP", name: "Vietnamese Dong / Philippine Peso" },
  { from: "AUD", to: "USD", label: "AUD / USD", name: "Australian Dollar / USD" },
  { from: "CAD", to: "USD", label: "CAD / USD", name: "Canadian Dollar / USD" },
  { from: "SGD", to: "USD", label: "SGD / USD", name: "Singapore Dollar / USD" },
] as const;

interface FloatingStashViewProps {
  noteId: string;
}

const HeaderTooltip: React.FC<{
  label: React.ReactNode;
  shortcut?: string;
  side?: "bottom" | "top";
  children: React.ReactNode;
}> = ({ label, shortcut, side = "bottom", children }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent
      side={side}
      sideOffset={6}
      className="flex items-center gap-1.5 py-1 px-2 text-[11px] font-medium shadow-xl select-none z-50 pointer-events-none"
    >
      <span>{label}</span>
      {shortcut && (
        <kbd className="rounded bg-white/20 dark:bg-white/15 px-1 py-0.2 text-[9px] font-mono tracking-tighter opacity-90">
          {shortcut}
        </kbd>
      )}
    </TooltipContent>
  </Tooltip>
);

/**
 * A detached stash.
 *
 * The native window *is* the surface — no nested cards, no panels. Chrome
 * recedes while you write and comes back on hover or focus.
 */
export const FloatingStashView: React.FC<FloatingStashViewProps> = ({
  noteId,
}) => {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [alwaysOnTopState, setAlwaysOnTopState] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [widgets, setWidgets] = useState<NoteWidgetData[]>([]);
  const [isDockMinimized, setIsDockMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("stash:editor-dock-minimized") === "true";
  });

  const handleToggleDock = useCallback((next?: boolean | unknown) => {
    setIsDockMinimized((prev) => {
      const target = typeof next === "boolean" ? next : !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("stash:editor-dock-minimized", String(target));
      }
      return target;
    });
  }, []);
  /**
   * Bumped when something outside the editor rewrites the document (widget
   * output, a restored revision). The editor keys off it so it reloads instead
   * of sitting on a stale doc.
   */
  const [contentToken, setContentToken] = useState(0);

  const flushRef = useRef<(() => void) | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Window Shade mode
  const [isShaded, setIsShaded] = useState(false);
  const preShadeHeightRef = useRef<number>(360);

  // PIN lock & session unlock
  const [hasPin, setHasPin] = useState<boolean>(() => hasNotePin(noteId));
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(() =>
    isNoteSessionUnlocked(noteId)
  );
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");

  // Due Date & Reminders
  const [dueDate, setDueDate] = useState<string | null>(() =>
    getNoteDueDate(noteId)
  );
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [customDueDateInput, setCustomDueDateInput] = useState("");

  const dueDateStatus = getDueDateStatus(dueDate);

  // Personalization: Emoji, Tactile Paper, Typography, Window Frame
  const [noteEmoji, setNoteEmojiState] = useState<string | null>(() =>
    getNoteEmoji(noteId)
  );
  const [notePaper, setNotePaperState] = useState<PaperPattern>(() =>
    getNotePaper(noteId)
  );
  const [noteFont, setNoteFontState] = useState<NoteFontPersona>(() =>
    getNoteFont(noteId)
  );
  const [noteFrame, setNoteFrameState] = useState<NoteFrameStyle>(() =>
    getNoteFrame(noteId)
  );
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [exportImageOpen, setExportImageOpen] = useState(false);
  const [carryoverTasks, setCarryoverTasks] = useState<string[]>([]);
  const [carryoverDismissed, setCarryoverDismissed] = useState(false);

  useEffect(() => {
    const handleMetaUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ noteId: string }>;
      if (custom.detail?.noteId === noteId) {
        setHasPin(hasNotePin(noteId));
        setIsSessionUnlocked(isNoteSessionUnlocked(noteId));
        setDueDate(getNoteDueDate(noteId));
        setNoteEmojiState(getNoteEmoji(noteId));
        setNotePaperState(getNotePaper(noteId));
        setNoteFontState(getNoteFont(noteId));
        setNoteFrameState(getNoteFrame(noteId));
      }
    };
    window.addEventListener("stash:note-meta-changed", handleMetaUpdate);
    return () => {
      window.removeEventListener("stash:note-meta-changed", handleMetaUpdate);
    };
  }, [noteId]);

  const handleSetEmoji = useCallback(
    (emoji: string | null) => {
      setNoteEmojiState(emoji);
      setNoteEmoji(noteId, emoji);
      if (isTauri()) {
        const win = getCurrentWebviewWindow();
        const display = emoji ? `${emoji} ${title || "Stash"}` : title || "Stash";
        win.setTitle(display).catch(() => {});
      }
    },
    [noteId, title]
  );

  const handleSetPaper = useCallback(
    (paper: PaperPattern) => {
      setNotePaperState(paper);
      setNotePaper(noteId, paper);
    },
    [noteId]
  );

  const handleSetFont = useCallback(
    (font: NoteFontPersona) => {
      setNoteFontState(font);
      setNoteFont(noteId, font);
    },
    [noteId]
  );

  const handleSetFrame = useCallback(
    (frame: NoteFrameStyle) => {
      setNoteFrameState(frame);
      setNoteFrame(noteId, frame);
    },
    [noteId]
  );

  const handleToggleShade = useCallback(async () => {
    setIsShaded((prev) => {
      const next = !prev;
      if (isTauri()) {
        const win = getCurrentWebviewWindow();
        void (async () => {
          try {
            const factor = await win.scaleFactor();
            const outer = await win.outerSize();
            const curWidth = Math.round(outer.width / factor);
            if (next) {
              preShadeHeightRef.current = Math.max(Math.round(outer.height / factor), 220);
              // Wait 130ms so the aesthetic blur and roll-up transition begins smoothly
              setTimeout(async () => {
                await win.setSize(new LogicalSize(curWidth, 38));
              }, 130);
            } else {
              const targetH = Math.max(preShadeHeightRef.current || 360, 220);
              await win.setSize(new LogicalSize(curWidth, targetH));
            }
          } catch {
            // Ignore native size failures
          }
        })();
      }
      return next;
    });
  }, []);

  const activeSwapWidget = widgets.find((w) => w.type === "swap");

  const isPairActive = (from: string, to: string) => {
    if (!activeSwapWidget) return false;
    const curFrom = activeSwapWidget.config?.fromCurrency || "ETH";
    const curTo = activeSwapWidget.config?.toCurrency || "USDC";
    return (curFrom === from && curTo === to) || (curFrom === to && curTo === from);
  };

  const handleSelectSwapPair = (fromCurrency: string, toCurrency: string, label: string) => {
    if (activeSwapWidget) {
      const nextWidgets = widgets.map((w) =>
        w.id === activeSwapWidget.id
          ? {
              ...w,
              isCollapsed: false,
              config: {
                ...w.config,
                fromCurrency,
                toCurrency,
              },
            }
          : w
      );
      handleUpdateWidgets(nextWidgets);
      toast.show({ message: `Currency Swap set to ${label}` });
    } else {
      handleAddWidget("swap", {
        fromCurrency,
        toCurrency,
        amount: "100",
      });
      toast.show({ message: `Attached Currency Swap (${label})` });
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockNoteInSession(noteId, enteredPin)) {
      setIsSessionUnlocked(true);
      setPinError(false);
      setEnteredPin("");
      toast.show({ message: "Note unlocked" });
    } else {
      setPinError(true);
    }
  };

  const handleSavePin = (pin: string) => {
    setNotePin(noteId, pin);
    setHasPin(Boolean(pin.trim()));
    setIsSessionUnlocked(true);
    setPinDialogOpen(false);
    toast.show({
      message: pin.trim() ? "PIN protection enabled" : "PIN removed",
    });
  };

  const handleLockNow = () => {
    lockNoteInSession(noteId);
    setIsSessionUnlocked(false);
    toast.show({ message: "Note locked" });
  };

  const handleSaveDueDate = (dateIso: string | null) => {
    setNoteDueDate(noteId, dateIso);
    setDueDate(dateIso);
    setDueDateDialogOpen(false);
    toast.show({
      message: dateIso ? "Due date updated" : "Due date cleared",
    });
  };

  /* ------------------------------- loading ------------------------------ */

  useEffect(() => {
    stashIpc.getNote(noteId).then((n) => {
      if (!n) return;
      setNote(n);
      setTitle(n.title);

      const stored = extractWidgets<NoteWidgetData>(n.contentJson);
      if (stored.length > 0) {
        setWidgets(stored);
      } else if (
        n.plainText.includes("[swap-widget]") ||
        n.tags?.some((t) => t.name.toLowerCase() === "swap")
      ) {
        setWidgets([
          {
            id: `swap-${n.id}`,
            type: "swap",
            title: "Currency & Token Swap",
            x: 0,
            y: 0,
          },
        ]);
      }
    });

    stashIpc.getWindowState(noteId).then((ws) => {
      if (!ws) return;
      setAlwaysOnTopState(ws.alwaysOnTop);
      setAlwaysOnTop(ws.alwaysOnTop);
    });
  }, [noteId]);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    []
  );

  // Check for unfinished tasks to carry over if this is today's daily scratchpad
  useEffect(() => {
    if (!note || carryoverDismissed) return;
    if (!isTodayTitle(note.title)) {
      setCarryoverTasks([]);
      return;
    }

    void stashIpc.listNotes().then((allNotes) => {
      const prevNote = findPreviousDailyNote(allNotes);
      if (!prevNote) {
        setCarryoverTasks([]);
        return;
      }
      const prevTasks = extractUnfinishedTasks(prevNote.plainText);
      if (prevTasks.length === 0) {
        setCarryoverTasks([]);
        return;
      }

      // Filter out tasks already present in today's note plain text
      const currentText = note.plainText || "";
      const remaining = prevTasks.filter((t) => !currentText.includes(t));
      setCarryoverTasks(remaining);
    });
  }, [note?.id, note?.title, note?.plainText, carryoverDismissed]);

  /* -------------------------- window geometry --------------------------- */

  useEffect(() => {
    if (!isTauri()) return;

    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const win = getCurrentWebviewWindow();

    // Geometry is written once movement settles, not on every frame.
    const saveGeometry = async () => {
      try {
        const factor = await win.scaleFactor();
        const pos = await win.outerPosition();
        const size = await win.outerSize();

        await stashIpc.persistWindowState({
          noteId,
          x: Math.round(pos.x / factor),
          y: Math.round(pos.y / factor),
          width: Math.max(Math.round(size.width / factor), 280),
          height: Math.max(Math.round(size.height / factor), 220),
          alwaysOnTop: alwaysOnTopState,
          isOpen: true,
          monitorId: null,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Geometry is a convenience; failing to store it must stay silent.
      }
    };

    const schedule = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(saveGeometry, 600);
    };

    const unlistenMove = win.onMoved(schedule);
    const unlistenResize = win.onResized(schedule);

    return () => {
      if (settleTimer) clearTimeout(settleTimer);
      unlistenMove.then((f) => f());
      unlistenResize.then((f) => f());
    };
  }, [noteId, alwaysOnTopState]);

  /* ------------------------------ mutations ----------------------------- */

  const persist = useCallback(
    async (patch: Partial<Note>) => {
      if (!note) return;
      setSaveStatus("saving");
      try {
        const updated = await stashIpc.updateNote({
          id: note.id,
          version: note.version,
          ...patch,
        });
        setNote(updated);
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1400);
      } catch {
        setSaveStatus("idle");
        toast.error("Could not save", "Your text is still on screen.");
      }
    },
    [note]
  );

  const handleContentUpdate = useCallback(
    (contentJson: string, plainText: string) => {
      void persist({
        contentJson: serializeStashContent(extractDoc(contentJson), widgets),
        plainText,
      });
    },
    [persist, widgets]
  );

  const handleUpdateWidgets = (nextWidgets: NoteWidgetData[]) => {
    setWidgets(nextWidgets);
    if (!note) return;
    void persist({
      contentJson: serializeStashContent(
        extractDoc(note.contentJson),
        nextWidgets
      ),
    });
  };

  const handleAddWidget = (
    type: WidgetType,
    initialConfig?: Record<string, any>
  ) => {
    const defaultTitles: Record<WidgetType, string> = {
      swap: "Currency Converter",
      ticker: "Market Tickers",
      calculator: "Quick Calculator",
      timer: "Timer & Stopwatch",
      worldclock: "World Clock",
      unitconverter: "Unit Converter",
      counter: "Tally Counter",
      countdown: "Countdown Timer",
      kanban: "Kanban Board",
      habits: "Habit Tracker",
      palette: "Color Palette",
      browser: "Mini Browser",
    };
    const newWidget: NoteWidgetData = {
      id: `${type}-${Date.now()}`,
      type,
      title: defaultTitles[type],
      x: 0,
      y: 0,
      config: initialConfig,
    };
    handleUpdateWidgets([...widgets, newWidget]);
  };

  /**
   * Widget output goes into the document, not just the preview text. Writing
   * `plainText` alone is what made a note read full in the library and open
   * empty.
   */
  const handleInsertTextToNote = (text: string) => {
    if (!note) return;
    flushRef.current?.();
    void persist(appendPlainTextToContent(note.contentJson, widgets, text));
    setContentToken((t) => t + 1);
  };

  const handleAcceptCarryover = useCallback(() => {
    if (carryoverTasks.length === 0) return;
    const carryoverBlock =
      `\n\n### ↩ Carried Over Tasks\n` +
      carryoverTasks.map((t) => `- [ ] ${t}`).join("\n");
    handleInsertTextToNote(carryoverBlock);
    toast.show({
      message: `Carried over ${carryoverTasks.length} task${carryoverTasks.length > 1 ? "s" : ""}`,
    });
    setCarryoverTasks([]);
    setCarryoverDismissed(true);
  }, [carryoverTasks, handleInsertTextToNote]);

  const handleDismissCarryover = useCallback(() => {
    setCarryoverTasks([]);
    setCarryoverDismissed(true);
  }, []);

  const handleOrganizeChecklist = useCallback(() => {
    if (!note?.plainText) return;
    const result = organizeChecklist(note.plainText);
    if (!result.hasTasks) {
      toast.show({ message: "No checklist tasks found in this note" });
      return;
    }
    if (result.completedCount === 0) {
      toast.show({ message: "All tasks are already active" });
      return;
    }
    flushRef.current?.();
    const nextContentJson = stashContentFromPlainText(result.updatedText, widgets);
    void persist({
      plainText: result.updatedText,
      contentJson: nextContentJson,
    });
    setContentToken((t) => t + 1);
    toast.show({
      message: `Organized tasks: moved ${result.completedCount} completed task${result.completedCount > 1 ? "s" : ""} to bottom`,
    });
  }, [note, widgets, persist]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isTauri()) {
      getCurrentWebviewWindow()
        .setTitle(newTitle.trim() ? newTitle : "Stash")
        .catch(() => {});
    }
    void persist({ title: newTitle });
  };

  const handleColorChange = (color: NoteColor) => {
    if (note) setNote({ ...note, color });
    void persist({ color });
  };

  const handleTogglePin = async () => {
    const next = !alwaysOnTopState;
    setAlwaysOnTopState(next);
    try {
      await setAlwaysOnTop(next);
      await stashIpc.setNoteAlwaysOnTop(noteId, next);
    } catch {
      // The native call is the source of truth — roll the visual back.
      setAlwaysOnTopState(!next);
      toast.error("Could not change always-on-top");
    }
  };

  const handleClose = async () => {
    // Force any debounced edit out before the window goes away.
    flushRef.current?.();
    await stashIpc.createRevisionCheckpoint(noteId);
    await stashIpc.closeFloatingStash(noteId);
    closeCurrentWindow();
  };

  const handleOpenRevisions = async () => {
    setRevisions(await stashIpc.listRevisions(noteId));
    setRevisionsOpen(true);
  };

  const handleRestoreRevision = async (revId: string) => {
    const restored = await stashIpc.restoreRevision(noteId, revId);
    setNote(restored);
    setTitle(restored.title);
    setContentToken((t) => t + 1);
    setRevisionsOpen(false);
  };

  useShortcuts([
    { keys: SHORTCUTS.alwaysOnTop, allowInInput: true, run: handleTogglePin },
    {
      keys: SHORTCUTS.duplicate,
      allowInInput: true,
      enabled: note !== null,
      run: async () => {
        if (!note) return;
        const dup = await stashIpc.duplicateNote(note.id);
        await stashIpc.openFloatingStash(dup.id);
      },
    },
    {
      keys: SHORTCUTS.archive,
      allowInInput: true,
      enabled: note !== null,
      run: async () => {
        if (!note) return;
        await stashIpc.setNoteArchived(note.id, !note.isArchived);
        handleClose();
      },
    },
  ]);

  if (!note) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-xs text-muted-foreground">
        Opening…
      </div>
    );
  }

  const chromeIsUp = chromeVisible || alwaysOnTopState || widgets.length > 0;
  const iconButton =
    "flex h-7 w-7 items-center justify-center rounded-sm text-current/60 transition-colors hover:bg-current/10 hover:text-current";
  const currentFontPersona = FONT_PERSONAS.find((f) => f.id === noteFont);

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={100}>
      <div
        onMouseEnter={() => setChromeVisible(true)}
        onMouseLeave={() => setChromeVisible(false)}
        onFocus={() => setChromeVisible(true)}
        className={cn(
          "relative flex select-none flex-col overflow-hidden border transition-all duration-300 ease-out",
          isShaded
            ? "h-9 min-h-[36px] max-h-[36px] shadow-2xl backdrop-blur-2xl ring-1 ring-current/15"
            : "h-screen w-screen",
          getColorClass(note.color),
          getFrameStyleClass(noteFrame)
        )}
      >
        {/* Compact titlebar (36px) with custom right-click card */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              data-tauri-drag-region
              onDoubleClick={(e) => {
                if (
                  (e.target as HTMLElement).closest(
                    "button, input, textarea, select, [data-no-drag], .no-drag-region"
                  )
                ) {
                  return;
                }
                void handleToggleShade();
              }}
              onMouseDown={(e) => {
                if (
                  (e.target as HTMLElement).closest(
                    "button, input, textarea, select, [data-no-drag], .no-drag-region"
                  )
                ) {
                  return;
                }
                if (e.button === 0 && isTauri()) {
                  getCurrentWebviewWindow().startDragging().catch(() => {});
                }
              }}
              className={cn(
                "drag-region flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-current/10 pl-2.5 pr-1 active:cursor-grabbing select-none transition-colors duration-200",
                isShaded && "border-b-0 backdrop-blur-xl bg-background/60 shadow-xs"
              )}
            >
              {/* Left: Color Picker + Title Input + Save indicator + Drag spacer */}
              <div
                data-tauri-drag-region
                className="drag-region flex items-center gap-1.5 flex-1 min-w-0 mr-2 cursor-grab active:cursor-grabbing"
              >
                <div className="no-drag-region shrink-0">
                  <HeaderTooltip label="Note Color">
                    <div>
                      <ColorPicker
                        currentColor={note.color}
                        onSelectColor={handleColorChange}
                      />
                    </div>
                  </HeaderTooltip>
                </div>

                {/* Note Emoji Persona button / trigger */}
                <HeaderTooltip
                  label={
                    noteEmoji
                      ? `Icon: ${noteEmoji} (Click to customize)`
                      : "Customize Note Persona & Icon"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setPersonaModalOpen(true)}
                    aria-label="Customize note persona"
                    className={cn(
                      "no-drag-region shrink-0 flex items-center justify-center h-6 w-6 rounded-md hover:bg-current/10 transition-transform active:scale-95 text-xs cursor-pointer",
                      noteEmoji
                        ? "text-base leading-none"
                        : "text-current/45 hover:text-current"
                    )}
                  >
                    {noteEmoji ? (
                      <span>{noteEmoji}</span>
                    ) : (
                      <Smile className="h-3.5 w-3.5" />
                    )}
                  </button>
                </HeaderTooltip>

                <HeaderTooltip label="Rename Note">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled note"
                    aria-label="Note title"
                    className="no-drag-region bg-transparent font-semibold text-xs tracking-tight text-foreground placeholder:text-current/30 focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1.5 py-0.5 min-w-[70px] max-w-[200px] truncate select-text transition-all cursor-text"
                  />
                </HeaderTooltip>

                <span
                  data-tauri-drag-region
                  aria-live="polite"
                  className={cn(
                    "drag-region text-[10px] font-medium transition-opacity duration-200 shrink-0 pointer-events-none",
                    saveStatus === "idle" ? "opacity-0" : "opacity-50"
                  )}
                >
                  {saveStatus === "saving" ? "Saving…" : "Saved"}
                </span>

                {/* Due Date Indicator Badge */}
                {dueDateStatus && (
                  <HeaderTooltip label={`Due: ${dueDateStatus.label} (Click to manage)`}>
                    <button
                      type="button"
                      onClick={() => setDueDateDialogOpen(true)}
                      className={cn(
                        "no-drag-region flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0",
                        dueDateStatus.isOverdue
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : dueDateStatus.isToday
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          : "bg-primary/10 text-primary border border-primary/20"
                      )}
                    >
                      <CalendarClock className="h-3 w-3" />
                      <span>{dueDateStatus.label}</span>
                    </button>
                  </HeaderTooltip>
                )}

                {/* PIN Lock indicator */}
                {hasPin && (
                  <HeaderTooltip
                    label={
                      isSessionUnlocked
                        ? "PIN Protected (Unlocked)"
                        : "PIN Protected (Locked)"
                    }
                  >
                    <span className="no-drag-region p-0.5 text-current/70">
                      <Lock className="h-3 w-3" />
                    </span>
                  </HeaderTooltip>
                )}

                {/* Draggable stretch area between title and action buttons */}
                <div
                  data-tauri-drag-region
                  className="drag-region flex-1 h-full min-w-[20px] cursor-grab active:cursor-grabbing flex items-center justify-center px-1"
                >
                  {isShaded && (
                    <HeaderTooltip label="Double-click header or click to unshade note">
                      <button
                        type="button"
                        onClick={() => void handleToggleShade()}
                        className="no-drag-region flex items-center gap-1 px-2 py-0.5 rounded-full bg-current/10 hover:bg-current/15 text-current text-[10px] font-medium border border-current/20 shadow-2xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
                      >
                        <ChevronDown className="h-3 w-3 animate-pulse text-primary" />
                        <span className="font-semibold text-primary">Shaded</span>
                        <span className="opacity-60 hidden sm:inline">— click to expand</span>
                      </button>
                    </HeaderTooltip>
                  )}
                </div>
              </div>

        <div
          className={cn(
            "no-drag-region flex items-center gap-0.5 transition-opacity duration-200 shrink-0",
            chromeIsUp || widgets.length > 0 ? "opacity-100" : "opacity-35"
          )}
        >
          {/* Add Widget Dropdown */}
          <DropdownMenu>
            <HeaderTooltip label="Attach Interactive Widget">
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    iconButton,
                    "w-auto px-1.5 gap-1 text-[11px] font-medium text-current/80 hover:text-current hover:bg-current/10"
                  )}
                  aria-label="Add interactive widget"
                >
                  <Plus className="h-3 w-3" />
                  <span>Widget</span>
                </button>
              </DropdownMenuTrigger>
            </HeaderTooltip>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuItem onClick={() => handleAddWidget("swap")}>
                <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Currency Converter</span>
                  <span className="text-[10px] text-muted-foreground">Instant fiat & crypto rates</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("ticker")}>
                <TrendingUp className="mr-2 h-3.5 w-3.5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Market Tickers</span>
                  <span className="text-[10px] text-muted-foreground">Live asset prices & 24h trend</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("calculator")}>
                <CalcIcon className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Quick Calculator</span>
                  <span className="text-[10px] text-muted-foreground">Desktop math scratchpad</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("timer")}>
                <TimerIcon className="mr-2 h-3.5 w-3.5 text-rose-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Focus & Pomodoro Timer</span>
                  <span className="text-[10px] text-muted-foreground">Pomodoro & count-up stopwatch</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("worldclock")}>
                <Globe className="mr-2 h-3.5 w-3.5 text-cyan-500" />
                <div className="flex flex-col">
                  <span className="font-medium">World Clocks</span>
                  <span className="text-[10px] text-muted-foreground">Global timezones & offsets</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("unitconverter")}>
                <Ruler className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Unit Converter</span>
                  <span className="text-[10px] text-muted-foreground">Length, weight, temp & data</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("counter")}>
                <Target className="mr-2 h-3.5 w-3.5 text-purple-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Tally & Goal Counter</span>
                  <span className="text-[10px] text-muted-foreground">Habit, task & quantity tracker</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("countdown")}>
                <CalendarClock className="mr-2 h-3.5 w-3.5 text-orange-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Countdown Timer</span>
                  <span className="text-[10px] text-muted-foreground">Count down to any date or event</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("kanban")}>
                <Kanban className="mr-2 h-3.5 w-3.5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Kanban Board</span>
                  <span className="text-[10px] text-muted-foreground">To Do, Doing, Done card flow</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("habits")}>
                <Sparkles className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-medium">7-Day Habit Tracker</span>
                  <span className="text-[10px] text-muted-foreground">Weekly streaks & daily check-ins</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("palette")}>
                <Palette className="mr-2 h-3.5 w-3.5 text-pink-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Color Palette</span>
                  <span className="text-[10px] text-muted-foreground">Hex swatches & 1-click copy</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget("browser")}>
                <Globe className="mr-2 h-3.5 w-3.5 text-cyan-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Web Browser (PiP)</span>
                  <span className="text-[10px] text-muted-foreground">Embedded web view & detachable PiP window</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Formatting dock toggle: minimize or maximize the dock */}
          <HeaderTooltip
            label={
              isDockMinimized
                ? "Maximize Formatting Dock"
                : "Minimize Formatting Dock"
            }
          >
            <button
              onClick={() => handleToggleDock()}
              aria-pressed={!isDockMinimized}
              aria-label={
                isDockMinimized
                  ? "Maximize formatting dock"
                  : "Minimize formatting dock"
              }
              className={cn(
                iconButton,
                !isDockMinimized &&
                  "bg-current/15 text-current opacity-100 hover:bg-current/20"
              )}
            >
              <Type className="h-3.5 w-3.5" />
            </button>
          </HeaderTooltip>

          {/* Always-on-top toggle */}
          <HeaderTooltip
            label={alwaysOnTopState ? "Stop Keeping on Top" : "Keep on Top"}
            shortcut={formatShortcut(SHORTCUTS.alwaysOnTop)}
          >
            <button
              onClick={handleTogglePin}
              aria-pressed={alwaysOnTopState}
              aria-label={alwaysOnTopState ? "Stop keeping on top" : "Keep on top"}
              className={cn(
                iconButton,
                alwaysOnTopState &&
                  "bg-current/15 text-current opacity-100 hover:bg-current/20"
              )}
            >
              {alwaysOnTopState ? (
                <Pin className="h-3.5 w-3.5 fill-current" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
          </HeaderTooltip>

          {/* Share as Image Button */}
          <HeaderTooltip label="Share as Beautiful Image">
            <button
              onClick={() => setExportImageOpen(true)}
              aria-label="Share as Image"
              className={iconButton}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </HeaderTooltip>

          {/* Voice to Stash Dictation */}
          <HeaderTooltip label="Voice Dictation (Speech-to-Text)">
            <div className="no-drag-region">
              <VoiceDictationButton
                onInsertText={handleInsertTextToNote}
                iconButtonClass={iconButton}
              />
            </div>
          </HeaderTooltip>

          <DropdownMenu>
            <HeaderTooltip label="More Actions & Options">
              <DropdownMenuTrigger asChild>
                <button className={iconButton} aria-label="More actions">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
            </HeaderTooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setExportImageOpen(true)}>
                <Camera className="mr-2 h-3.5 w-3.5 text-primary" />
                Share as Beautiful Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPersonaModalOpen(true)}>
                <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                Personalize note persona
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOrganizeChecklist}>
                <ListChecks className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                Organize checklist (done to bottom)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const dup = await stashIpc.duplicateNote(note.id);
                  await stashIpc.openFloatingStash(dup.id);
                }}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenRevisions}>
                <History className="mr-2 h-3.5 w-3.5" />
                Revision history
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const md = note.title
                    ? `# ${note.title}\n\n${note.plainText || ""}`.trim()
                    : (note.plainText || "").trim();
                  const blob = new Blob([md], {
                    type: "text/markdown;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  const filename =
                    (note.title || "untitled")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "") || "stash";
                  a.download = `${filename}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.show({ message: "Exported note as Markdown" });
                }}
              >
                <FileDown className="mr-2 h-3.5 w-3.5" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    handleInsertTextToNote(text);
                    toast.show({ message: "Imported Markdown into note" });
                  };
                  input.click();
                }}
              >
                <FileUp className="mr-2 h-3.5 w-3.5" />
                Import Markdown
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  <span>Currency Swap</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                    Popular Pairs
                  </div>
                  {POPULAR_SWAP_PAIRS.map((pair) => {
                    const active = isPairActive(pair.from, pair.to);
                    return (
                      <DropdownMenuItem
                        key={pair.label}
                        onClick={() => handleSelectSwapPair(pair.from, pair.to, pair.label)}
                        className="flex items-center justify-between py-1.5 text-xs cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{pair.label}</span>
                          <span className="text-[10px] text-muted-foreground">{pair.name}</span>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (activeSwapWidget) {
                        const nextWidgets = widgets.map((w) =>
                          w.id === activeSwapWidget.id ? { ...w, isCollapsed: false } : w
                        );
                        handleUpdateWidgets(nextWidgets);
                        toast.show({ message: "Currency Swap opened" });
                      } else {
                        handleAddWidget("swap");
                        toast.show({ message: "Attached Currency Swap widget" });
                      }
                    }}
                    className="text-xs font-medium cursor-pointer"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                    {activeSwapWidget ? "Open Swap Widget" : "Add Default Swap Widget"}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDueDateDialogOpen(true)}>
                <CalendarClock className="mr-2 h-3.5 w-3.5 text-amber-500" />
                {dueDate ? "Manage due date & reminder" : "Set due date & reminder"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPinDialogOpen(true)}>
                <Lock className="mr-2 h-3.5 w-3.5 text-primary" />
                {hasPin ? "Change or remove PIN" : "Protect note with PIN"}
              </DropdownMenuItem>
              {hasPin && isSessionUnlocked && (
                <DropdownMenuItem onClick={handleLockNow}>
                  <KeyRound className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Lock note now
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await stashIpc.setNoteArchived(note.id, !note.isArchived);
                  handleClose();
                }}
              >
                <Archive className="mr-2 h-3.5 w-3.5" />
                {note.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await stashIpc.trashNote(note.id);
                  handleClose();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Window Shade / Roll-Up Button */}
          <HeaderTooltip
            label={
              isShaded
                ? "Unshade Note (Expand)"
                : "Roll Up to Titlebar (Shade Mode)"
            }
          >
            <button
              type="button"
              onClick={handleToggleShade}
              aria-label={isShaded ? "Unshade note" : "Roll up note to titlebar"}
              className={cn(
                iconButton,
                isShaded && "bg-current/15 text-current opacity-100 ring-1 ring-current/20"
              )}
            >
              {isShaded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
          </HeaderTooltip>

          {/* Minimize Button */}
          <HeaderTooltip label="Minimize Window">
            <button
              onClick={() => minimizeCurrentWindow()}
              aria-label="Minimize"
              className={iconButton}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </HeaderTooltip>

          {/* Close Button */}
          <HeaderTooltip label="Close Stash" shortcut="Esc">
            <button
              onClick={handleClose}
              aria-label="Close"
              className={cn(
                iconButton,
                "hover:bg-destructive hover:text-destructive-foreground"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </HeaderTooltip>
        </div>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent className="w-56">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: getColorDot(note.color) }}
        />
        <span className="truncate">{title || "Untitled Stash"}</span>
      </div>

      <ContextMenuItem onClick={handleTogglePin}>
        {alwaysOnTopState ? (
          <>
            <PinOff className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Stop keeping on top</span>
          </>
        ) : (
          <>
            <Pin className="mr-2 h-3.5 w-3.5" />
            <span>Keep on top</span>
          </>
        )}
      </ContextMenuItem>

      <ContextMenuItem onClick={() => void handleToggleShade()}>
        {isShaded ? (
          <>
            <ChevronDown className="mr-2 h-3.5 w-3.5" />
            <span>Unshade note (expand)</span>
          </>
        ) : (
          <>
            <ChevronUp className="mr-2 h-3.5 w-3.5" />
            <span>Roll up (Shade mode)</span>
          </>
        )}
      </ContextMenuItem>

      {/* Color Submenu */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Palette className="mr-2 h-3.5 w-3.5 text-indigo-500" />
          <span>Note Color</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-40">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Palette
          </div>
          {NOTE_COLORS.map((c) => (
            <ContextMenuItem
              key={c.id}
              onClick={() => handleColorChange(c.id)}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: c.dotColor }}
                />
                <span>{c.label}</span>
              </div>
              {note.color === c.id && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Currency Swap Submenu */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-emerald-500" />
          <span>Currency Swap</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-56">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Popular Pairs
          </div>
          {POPULAR_SWAP_PAIRS.map((pair) => {
            const active = isPairActive(pair.from, pair.to);
            return (
              <ContextMenuItem
                key={pair.label}
                onClick={() => handleSelectSwapPair(pair.from, pair.to, pair.label)}
                className="flex items-center justify-between py-1.5 text-xs cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{pair.label}</span>
                  <span className="text-[10px] text-muted-foreground">{pair.name}</span>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />}
              </ContextMenuItem>
            );
          })}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              if (activeSwapWidget) {
                const nextWidgets = widgets.map((w) =>
                  w.id === activeSwapWidget.id ? { ...w, isCollapsed: false } : w
                );
                handleUpdateWidgets(nextWidgets);
                toast.show({ message: "Currency Swap opened" });
              } else {
                handleAddWidget("swap");
                toast.show({ message: "Attached Currency Swap widget" });
              }
            }}
            className="text-xs font-medium cursor-pointer"
          >
            <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
            {activeSwapWidget ? "Open Swap Widget" : "Add Default Swap Widget"}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      {/* Widgets Submenu */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Plus className="mr-2 h-3.5 w-3.5 text-emerald-500" />
          <span>Attach Widget</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem onClick={() => handleAddWidget("countdown")}>
            <CalendarClock className="mr-2 h-3.5 w-3.5 text-orange-500" />
            <span>Countdown Timer</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("worldclock")}>
            <Globe className="mr-2 h-3.5 w-3.5 text-cyan-500" />
            <span>World Clock</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("calculator")}>
            <CalcIcon className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Calculator</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("unitconverter")}>
            <Ruler className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            <span>Unit Converter</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("counter")}>
            <Target className="mr-2 h-3.5 w-3.5 text-purple-500" />
            <span>Tally Counter</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("habits")}>
            <Sparkles className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>Habit Tracker</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("kanban")}>
            <Kanban className="mr-2 h-3.5 w-3.5 text-blue-500" />
            <span>Kanban Board</span>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem onClick={() => setPersonaModalOpen(true)}>
        <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>Personalize Note Persona</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => setExportImageOpen(true)}>
        <Camera className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>Share as Beautiful Image</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleOrganizeChecklist}>
        <ListChecks className="mr-2 h-3.5 w-3.5 text-emerald-500" />
        <span>Organize Checklist (Done to bottom)</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => setDueDateDialogOpen(true)}>
        <CalendarClock className="mr-2 h-3.5 w-3.5 text-amber-500" />
        <span>Due Date & Reminder</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={async () => {
          const dup = await stashIpc.duplicateNote(note.id);
          await stashIpc.openFloatingStash(dup.id);
        }}
      >
        <Copy className="mr-2 h-3.5 w-3.5 text-sky-500" />
        <span>Duplicate Stash</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={async () => {
          await stashIpc.setNoteArchived(note.id, !note.isArchived);
          handleClose();
        }}
      >
        <Archive className="mr-2 h-3.5 w-3.5" />
        <span>{note.isArchived ? "Unarchive" : "Archive note"}</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={async () => {
          await stashIpc.trashNote(note.id);
          handleClose();
        }}
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        <span>Move to Trash</span>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>

      {/* Surface with premium aesthetic blur & roll-up transition */}
      <div
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-out",
          isShaded
            ? "opacity-0 blur-xl scale-[0.98] -translate-y-4 pointer-events-none invisible max-h-0"
            : "opacity-100 blur-0 scale-100 translate-y-0 visible max-h-full"
        )}
      >
        {/* Task Carryover Banner for Today's Note */}
        {carryoverTasks.length > 0 && (!hasPin || isSessionUnlocked) && (
          <div className="relative z-20 flex items-center justify-between gap-2 border-b border-border/40 bg-primary/10 px-3 py-1.5 text-xs text-foreground backdrop-blur-xs select-none shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <ListTodo className="h-3 w-3" />
              </div>
              <span className="truncate text-[11px] font-medium">
                <strong>{carryoverTasks.length}</strong> unfinished task{carryoverTasks.length > 1 ? "s" : ""} from last daily note
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAcceptCarryover}
                className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors"
              >
                <span>Carry Over</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                onClick={handleDismissCarryover}
                aria-label="Dismiss task carryover"
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-current/10 hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {hasPin && !isSessionUnlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
            <div className="p-3 bg-primary/10 text-primary rounded-full mb-3 shadow-inner">
              <Lock className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Protected Stash</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
              This note is PIN locked. Enter your PIN to view and edit.
            </p>
            <form
              onSubmit={handleUnlockSubmit}
              className="flex flex-col items-center gap-2 w-full max-w-[220px]"
            >
              <input
                type="password"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter PIN"
                autoFocus
                maxLength={16}
                className={cn(
                  "w-full px-3 py-1.5 text-center text-sm rounded-md border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs tracking-widest",
                  pinError
                    ? "border-destructive ring-1 ring-destructive"
                    : "border-border"
                )}
              />
              {pinError && (
                <span className="text-[11px] text-destructive font-medium">
                  Incorrect PIN
                </span>
              )}
              <button
                type="submit"
                className="w-full mt-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs"
              >
                Unlock Stash
              </button>
            </form>
          </div>
        ) : (
          <div className="relative flex flex-1 cursor-text flex-col overflow-y-auto px-4 pb-20 pt-3">
            {/* Tactile Paper Pattern Texture Backdrop */}
            {notePaper !== "plain" && (
              <div
                className="pointer-events-none absolute inset-0 select-none text-foreground z-0"
                style={getPaperPatternStyle(notePaper)}
                aria-hidden="true"
              />
            )}

            {/* Draggable Note Widgets Canvas */}
            {widgets.length > 0 && (
              <div className="relative z-10">
                <NoteWidgetsCanvas
                  widgets={widgets}
                  noteId={noteId}
                  onUpdateWidgets={handleUpdateWidgets}
                  onInsertToNote={handleInsertTextToNote}
                />
              </div>
            )}

            <div className={cn("relative z-10 flex-1 select-text", currentFontPersona?.fontClass)}>
              <TiptapEditor
                key={`${note.id}-${contentToken}`}
                initialContent={note.contentJson}
                initialPlainText={note.plainText}
                autoFocus={widgets.length === 0}
                onUpdate={handleContentUpdate}
                flushRef={flushRef}
                isDockMinimized={isDockMinimized}
                onToggleDock={handleToggleDock}
                className={currentFontPersona?.fontClass}
              />
            </div>

            {/* Interactive Note Statistics HUD */}
            <div className="fixed bottom-2.5 right-3 z-30 pointer-events-auto">
              <NoteStatsHud plainText={note.plainText || ""} />
            </div>
          </div>
        )}
      </div>

      {/* Aesthetic frosted blur transition layer during shade mode */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 top-9 z-40 transition-all duration-300 ease-out",
          isShaded
            ? "opacity-100 backdrop-blur-2xl bg-background/40"
            : "opacity-0 backdrop-blur-none bg-transparent pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Revision history */}
      <Dialog open={revisionsOpen} onOpenChange={setRevisionsOpen}>
        <DialogContent className="max-w-md gap-3 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm">Revision history</DialogTitle>
            <DialogDescription>
              Checkpoints are kept when you close a stash or make a substantial
              edit. Restoring one keeps the current version recoverable.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 divide-y divide-border overflow-y-auto">
            {revisions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No checkpoints yet.
              </p>
            ) : (
              revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-foreground">
                      {rev.title || "Untitled stash"}
                    </div>
                    <div className="text-2xs text-muted-foreground">
                      v{rev.version} · {formatNoteDate(rev.createdAt)}
                    </div>
                    <div className="mt-0.5 truncate text-2xs text-subtle">
                      {rev.plainText}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreRevision(rev.id)}
                    className="flex shrink-0 items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-2xs font-medium transition-colors hover:bg-surface-hover"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN configuration dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-sm gap-3 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              {hasPin ? "Change or Remove PIN" : "Protect Note with PIN"}
            </DialogTitle>
            <DialogDescription>
              {hasPin
                ? "Enter a new PIN to change it, or clear to remove protection."
                : "Enter a 4–8 digit PIN to protect this note from prying eyes."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <input
              type="password"
              placeholder="Enter PIN (or leave blank to remove)"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="w-full px-3 py-1.5 text-center text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary tracking-widest"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinDialogOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              {hasPin && (
                <button
                  type="button"
                  onClick={() => handleSavePin("")}
                  className="px-3 py-1.5 text-xs rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Remove PIN
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSavePin(newPinInput)}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Save PIN
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Due Date & Reminder dialog */}
      <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
        <DialogContent className="max-w-sm gap-3 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-amber-500" />
              Due Date & Reminder
            </DialogTitle>
            <DialogDescription>
              Set a target due date to stay on top of deadlines and milestones.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(17, 0, 0, 0);
                  handleSaveDueDate(d.toISOString());
                }}
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors"
              >
                Today 5:00 PM
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  handleSaveDueDate(d.toISOString());
                }}
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors"
              >
                Tomorrow 9:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  d.setHours(12, 0, 0, 0);
                  handleSaveDueDate(d.toISOString());
                }}
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const day = d.getDay();
                  const diff = (8 - day) % 7 || 7;
                  d.setDate(d.getDate() + diff);
                  d.setHours(9, 0, 0, 0);
                  handleSaveDueDate(d.toISOString());
                }}
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors"
              >
                Next Monday
              </button>
            </div>

            <div className="border-t border-border/40 pt-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Custom Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={customDueDateInput}
                onChange={(e) => setCustomDueDateInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              {dueDate ? (
                <button
                  type="button"
                  onClick={() => handleSaveDueDate(null)}
                  className="px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  Clear Due Date
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDueDateDialogOpen(false)}
                  className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
                {customDueDateInput && (
                  <button
                    type="button"
                    onClick={() => {
                      const iso = new Date(customDueDateInput).toISOString();
                      handleSaveDueDate(iso);
                    }}
                    className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Persona Customization Modal */}
      <NotePersonaModal
        isOpen={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
        noteId={note.id}
        noteTitle={note.title || "Untitled Stash"}
        noteColor={note.color}
        onChangeColor={handleColorChange}
        currentEmoji={noteEmoji}
        onChangeEmoji={handleSetEmoji}
        currentPaper={notePaper}
        onChangePaper={handleSetPaper}
        currentFont={noteFont}
        onChangeFont={handleSetFont}
        currentFrame={noteFrame}
        onChangeFrame={handleSetFrame}
      />
      {/* Export Note as Image Modal */}
      <NoteExportImageModal
        isOpen={exportImageOpen}
        onClose={() => setExportImageOpen(false)}
        note={note}
        noteEmoji={noteEmoji}
        notePaper={notePaper}
        noteFont={noteFont}
        noteFrame={noteFrame}
      />
    </div>
  </TooltipProvider>
);
};
