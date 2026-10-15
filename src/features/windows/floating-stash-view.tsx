import React, { useCallback, useEffect, useRef, useState } from "react";
import { Note, Revision } from "@/features/stash/types/note";
import { getColorClass, NoteColor, NOTE_COLORS, getColorDot } from "@/features/stash/types/color";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { useUIStore } from "@/stores/ui-store";
import { getWidgetColorClass, colorClass } from "@/lib/icons/icon-theme";
import { TiptapEditor, TiptapEditorRef } from "@/features/editor/components/tiptap-editor";
import {
  appendPlainTextToContent,
  docForEditor,
  docToPlainText,
  emptyDoc,
  extractDoc,
  extractWidgets,
  findWidgetNodes,
  plainTextToDoc,
  serializeStashContent,
  stashContentFromPlainText,
  widgetToNodeJSON,
  StashWidgetAttrs,
  TiptapDoc,
} from "@/features/editor/stash-content";
import { updateWidgetNodeInEditor } from "@/features/editor/widget-ops";
import { DEFAULT_WIDGET_TITLES } from "@/features/widgets/widget-meta";
import { ColorPicker } from "@/components/shared/color-picker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Archive,
  ArrowsDownUp as ArrowUpDown,
  Check,
  CopySimple as Copy,
  ClockCounterClockwise as History,
  Minus,
  DotsThree as MoreHorizontal,
  PushPin as Pin,
  PushPinSlash as PinOff,
  ArrowClockwise as RefreshCw,
  Trash as Trash2,
  X,
  Plus,
  TrendUp as TrendingUp,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  TextT as Type,
  CalendarBlank as CalendarClock,
  DownloadSimple as FileDown,
  UploadSimple as FileUp,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  LockSimple as Lock,
  Key as KeyRound,
  Kanban,
  Sparkle as Sparkles,
  Palette,
  CalendarBlank as Calendar,
  Smiley as Smile,
  Camera,
  CheckSquare as ListTodo,
  ArrowRight,
  CheckSquareOffset as ListChecks,
  Sun,
  Users,
  Bug,
  Lightbulb,
  BookOpen,
  SidebarSimple,
  CodeBlock as Code2,
} from "@phosphor-icons/react";
import { NoteAIAssistantModal } from "@/features/ai/components/note-ai-assistant-modal";
import { NoteStatsHud } from "@/features/stash/components/note-stats-hud";
import { VoiceDictationButton } from "@/features/stash/components/voice-dictation-button";
import { organizeChecklist, organizeDocTasks } from "@/features/stash/task-organizer";
import { playChimeSound, playClickSound } from "@/lib/utils/sound-effects";
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
import { WidgetType } from "@/features/widgets/types";
import { RevisionDiffViewer } from "@/features/stash/components/revision-diff-viewer";
import { BacklinksPanel } from "@/features/stash/components/backlinks-panel";
import {
  SimpleDropdown,
  SimpleDropdownItem,
  SimpleDropdownSeparator,
  SimpleDropdownSub,
} from "@/components/ui/simple-dropdown";
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
  const [widgets, setWidgets] = useState<StashWidgetAttrs[]>([]);
  const [isDockMinimized, setIsDockMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("stash:editor-dock-minimized") === "true";
  });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [edgeDock, setEdgeDock] = useState<"none" | "left" | "right">(() => {
    if (typeof window === "undefined") return "none";
    return ((localStorage.getItem(`stash:dock:${noteId}`) as any) || "none");
  });

  const handleSetEdgeDock = useCallback((mode: "none" | "left" | "right") => {
    setEdgeDock(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(`stash:dock:${noteId}`, mode);
    }
  }, [noteId]);

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
  const editorRef = useRef<TiptapEditorRef | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const noteRef = useRef<Note | null>(note);
  /** Last contentJson this window sent, so its own save echo is not mistaken for an outside edit. */
  const lastSentContentRef = useRef<string | null>(null);
  noteRef.current = note;
  const titleRef = useRef<string>(title);
  titleRef.current = title;
  const { theme, autoTitleFromFirstLine, iconSet } = useUIStore();
  const isColorful = iconSet === "colorful";
  const isTerminal =
    theme === "terminal" ||
    theme === "amber-crt" ||
    theme === "cyberpunk" ||
    theme === "e-ink";
  const versionRef = useRef<number>(note?.version ?? 1);
  const persistQueueRef = useRef<Promise<any>>(Promise.resolve());
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Window Shade mode
  const [isShaded, setIsShaded] = useState(false);
  const preShadeHeightRef = useRef<number>(640);

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
  const isToday = Boolean(note && isTodayTitle(note.title));

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
              const targetH = Math.max(preShadeHeightRef.current || 640, 240);
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

  const activeSwapWidget = widgets.find((w) => w.widgetType === "swap");

  const isPairActive = (from: string, to: string) => {
    if (!activeSwapWidget) return false;
    const curFrom = activeSwapWidget.config?.fromCurrency || "ETH";
    const curTo = activeSwapWidget.config?.toCurrency || "USDC";
    return (curFrom === from && curTo === to) || (curFrom === to && curTo === from);
  };

  const handleSelectSwapPair = (fromCurrency: string, toCurrency: string, label: string) => {
    const editor = editorRef.current?.getEditor();
    if (activeSwapWidget && editor) {
      updateWidgetNodeInEditor(editor, activeSwapWidget.widgetId, {
        isCollapsed: false,
        config: { ...activeSwapWidget.config, fromCurrency, toCurrency },
      });
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
      playChimeSound();
      toast.show({ message: "Note unlocked" });
    } else {
      setPinError(true);
    }
  };

  const handleSavePin = (pin: string) => {
    const trimmed = pin.trim();
    setNotePin(noteId, trimmed);
    setHasPin(Boolean(trimmed));
    if (trimmed) {
      lockNoteInSession(noteId);
      setIsSessionUnlocked(false);
      setEnteredPin("");
      setPinError(false);
      playChimeSound();
      toast.show({
        message: "Note protected with PIN & locked",
      });
    } else {
      setIsSessionUnlocked(true);
      toast.show({
        message: "PIN removed",
      });
    }
    setPinDialogOpen(false);
    setNewPinInput("");
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
    playClickSound();
    toast.show({
      message: dateIso ? "Due date updated" : "Due date cleared",
    });
  };

  /* ------------------------------- loading ------------------------------ */

  useEffect(() => {
    stashIpc.getNote(noteId).then((n) => {
      if (!n) return;
      noteRef.current = n;
      versionRef.current = n.version;
      setNote(n);
      setTitle(n.title);

      setWidgets(findWidgetNodes(docForEditor(n.contentJson, n.plainText)));
    });

    stashIpc.getWindowState(noteId).then((ws) => {
      if (!ws) return;
      setAlwaysOnTopState(ws.alwaysOnTop);
      setAlwaysOnTop(ws.alwaysOnTop);
    });

    const unlistenNote = stashIpc.listenToEvent<string>(
      "stash://note-updated",
      async (updatedId) => {
        if (updatedId === noteId) {
          try {
            const fresh = await stashIpc.getNote(noteId);
            if (!fresh) return;
            // Only adopt external state if it is strictly newer than our local state,
            // preventing this window's own broadcast from reverting optimistic widget additions.
            if (fresh.version > versionRef.current) {
              // Content changed elsewhere (e.g. a task ticked on the To-dos page):
              // reload the editor, or its next autosave would write the stale doc back.
              const contentChanged =
                fresh.contentJson !== noteRef.current?.contentJson &&
                fresh.contentJson !== lastSentContentRef.current;
              noteRef.current = fresh;
              versionRef.current = fresh.version;
              setNote(fresh);
              setTitle(fresh.title);
              setWidgets(findWidgetNodes(docForEditor(fresh.contentJson, fresh.plainText)));
              if (contentChanged) setContentToken((t) => t + 1);
            }
          } catch {}
        }
      }
    );

    const unlistenMeta = stashIpc.listenToEvent<{ noteId: string }>(
      "stash://note-meta-changed",
      (detail) => {
        if (detail?.noteId === noteId) {
          setHasPin(hasNotePin(noteId));
          setIsSessionUnlocked(isNoteSessionUnlocked(noteId));
          setDueDate(getNoteDueDate(noteId));
          setNoteEmojiState(getNoteEmoji(noteId));
          setNotePaperState(getNotePaper(noteId));
          setNoteFontState(getNoteFont(noteId));
          setNoteFrameState(getNoteFrame(noteId));
        }
      }
    );

    return () => {
      unlistenNote.then((fn) => fn());
      unlistenMeta.then((fn) => fn());
    };
  }, [noteId]);

  const handleRefreshNote = useCallback(async () => {
    try {
      const n = await stashIpc.getNote(noteId);
      if (!n) return;
      noteRef.current = n;
      versionRef.current = n.version;
      setNote(n);
      setTitle(n.title);
      setWidgets(findWidgetNodes(docForEditor(n.contentJson, n.plainText)));
      setContentToken((t) => t + 1);
      toast.show({ message: "Note refreshed" });
    } catch {
      toast.show({ message: "Refreshed" });
    }
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

    // Auto-expand legacy or cramped windows on mount to comfortable modern dimensions (580x640)
    void (async () => {
      try {
        const factor = await win.scaleFactor();
        const outer = await win.outerSize();
        const curWidth = Math.round(outer.width / factor);
        const curHeight = Math.round(outer.height / factor);
        if (curWidth < 520 || curHeight < 540) {
          const nextW = Math.max(curWidth, 580);
          const nextH = Math.max(curHeight, 640);
          await win.setSize(new LogicalSize(nextW, nextH));
        }
      } catch {
        // Silent fallback
      }
    })();

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
    (patch: Partial<Note>): Promise<Note | null> => {
      const currentNote = noteRef.current;
      if (!currentNote) return Promise.resolve(null);
      setSaveStatus("saving");

      if (typeof patch.contentJson === "string") lastSentContentRef.current = patch.contentJson;
      const task = persistQueueRef.current.then(async () => {
        try {
          const updated = await stashIpc.updateNote({
            id: currentNote.id,
            version: versionRef.current,
            ...patch,
          });
          versionRef.current = updated.version;
          noteRef.current = updated;
          setNote(updated);
          setSaveStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1400);
          return updated;
        } catch {
          setSaveStatus("idle");
          toast.error("Could not save", "Your text is still on screen.");
          return null;
        }
      });
      persistQueueRef.current = task;
      return task;
    },
    []
  );

  const handleContentUpdate = useCallback(
    (contentJson: string, plainText: string) => {
      if (autoTitleFromFirstLine && !titleRef.current) {
        const firstLine = plainText.trim().split("\n")[0]?.trim();
        if (firstLine && firstLine.length > 0) {
          const autoTitle = firstLine.slice(0, 48);
          setTitle(autoTitle);
          titleRef.current = autoTitle;
          void persist({
            title: autoTitle,
            contentJson: serializeStashContent(extractDoc(contentJson)),
            plainText,
          });
          return;
        }
      }
      void persist({
        contentJson: serializeStashContent(extractDoc(contentJson)),
        plainText,
      });
    },
    [persist, autoTitleFromFirstLine]
  );

  const handleAddWidget = (
    type: WidgetType,
    initialConfig?: Record<string, any>
  ) => {
    if (isShaded) {
      void handleToggleShade();
    }
    if (isTauri()) {
      const win = getCurrentWebviewWindow();
      void (async () => {
        try {
          const factor = await win.scaleFactor();
          const outer = await win.outerSize();
          const curH = Math.round(outer.height / factor);
          const curW = Math.round(outer.width / factor);
          if (curH < 520) {
            await win.setSize(new LogicalSize(Math.max(curW, 580), 580));
          }
        } catch {}
      })();
    }
    const title = DEFAULT_WIDGET_TITLES[type] || "Interactive Widget";
    const widgetId = `${type}-${Date.now()}`;

    if (editorRef.current) {
      editorRef.current.insertWidget({
        widgetId,
        widgetType: type,
        title,
        config: initialConfig ?? null,
      });
      editorRef.current.flush();
    } else if (noteRef.current) {
      // Editor not mounted yet — append the widget node straight into the doc.
      const currentDoc = extractDoc(noteRef.current.contentJson) ?? emptyDoc();
      const nextDoc: TiptapDoc = {
        type: "doc",
        content: [widgetToNodeJSON({ id: widgetId, type, title, config: initialConfig }), ...currentDoc.content],
      };
      void persist({ contentJson: serializeStashContent(nextDoc) });
    }

    playChimeSound();
    toast.show({ message: `Attached ${title}` });

    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /**
   * Widget output goes into the document, not just the preview text. Writing
   * `plainText` alone is what made a note read full in the library and open
   * empty.
   */
  const handleInsertTextToNote = useCallback(
    (text: string) => {
      if (editorRef.current) {
        editorRef.current.insertContent(text);
        editorRef.current.flush();
      } else if (noteRef.current) {
        void persist(
          appendPlainTextToContent(
            noteRef.current.contentJson,
            extractWidgets(noteRef.current.contentJson),
            text
          )
        );
      }
    },
    [persist]
  );

  const handleExportMarkdown = useCallback(() => {
    const liveDoc = editorRef.current?.getJSON() || extractDoc(noteRef.current?.contentJson);
    const text = docToPlainText(liveDoc) || editorRef.current?.getPlainText() || noteRef.current?.plainText || "";
    const title = noteRef.current?.title || "";
    const header = title.trim() ? `# ${title.trim()}\n\n` : "";
    const fullMd = `${header}${text}`.trim();

    const blob = new Blob([fullMd], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename =
      (title || "stash")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "stash";
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
      URL.revokeObjectURL(url);
    }, 150);

    try {
      navigator.clipboard.writeText(fullMd);
    } catch {}

    playChimeSound();
    toast.show({ message: "Exported note as Markdown" });
  }, [note]);

  const handleImportMarkdown = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        handleInsertTextToNote(text);
        playChimeSound();
        toast.show({ message: `Imported ${file.name}` });
      }
      try {
        document.body.removeChild(input);
      } catch {}
    };
    document.body.appendChild(input);
    input.click();
  }, [handleInsertTextToNote]);

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
    const liveDoc = editorRef.current?.getJSON() || extractDoc(noteRef.current?.contentJson);
    const docResult = organizeDocTasks(liveDoc);
    if (docResult.hasTasks) {
      if (docResult.completedCount === 0) {
        toast.show({ message: "All checklist tasks are already active" });
        return;
      }
      if (editorRef.current) {
        editorRef.current.setContent(docResult.updatedDoc);
        editorRef.current.flush();
      } else {
        const nextContentJson = serializeStashContent(
          docResult.updatedDoc,
          extractWidgets(noteRef.current?.contentJson)
        );
        const nextPlainText = docToPlainText(docResult.updatedDoc);
        void persist({
          contentJson: nextContentJson,
          plainText: nextPlainText,
        });
      }
      playClickSound();
      toast.show({
        message: `Organized checklist: moved ${docResult.completedCount} completed task${docResult.completedCount > 1 ? "s" : ""} to bottom`,
      });
      return;
    }

    // 2. Fallback to plain text checklist regex
    const text = editorRef.current?.getPlainText() || noteRef.current?.plainText || "";
    const textResult = organizeChecklist(text);
    if (!textResult.hasTasks) {
      toast.show({ message: "No checklist tasks found in this note" });
      return;
    }
    if (textResult.completedCount === 0) {
      toast.show({ message: "All checklist tasks are already active" });
      return;
    }
    if (editorRef.current) {
      editorRef.current.setContent(plainTextToDoc(textResult.updatedText));
      editorRef.current.flush();
    } else {
      const nextContentJson = stashContentFromPlainText(
        textResult.updatedText,
        extractWidgets(noteRef.current?.contentJson)
      );
      void persist({
        plainText: textResult.updatedText,
        contentJson: nextContentJson,
      });
    }
    playClickSound();
    toast.show({
      message: `Organized checklist: moved ${textResult.completedCount} completed task${textResult.completedCount > 1 ? "s" : ""} to bottom`,
    });
  }, [persist]);

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

  const handleCreateCheckpoint = async () => {
    flushRef.current?.();
    await stashIpc.createRevisionCheckpoint(noteId);
    setRevisions(await stashIpc.listRevisions(noteId));
    playClickSound();
    toast.show({ message: "Created revision checkpoint" });
  };

  const handleRestoreRevision = async (revId: string) => {
    const restored = await stashIpc.restoreRevision(noteId, revId);
    setNote(restored);
    setTitle(restored.title);
    setWidgets(findWidgetNodes(docForEditor(restored.contentJson, restored.plainText)));
    setContentToken((t) => t + 1);
    setRevisionsOpen(false);
    playChimeSound();
    toast.show({ message: "Restored revision checkpoint" });
  };

  useShortcuts([
    { keys: "f5", allowInInput: true, run: () => void handleRefreshNote() },
    { keys: "mod+r", allowInInput: true, run: () => void handleRefreshNote() },
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
                className="drag-region flex items-center gap-1.5 flex-1 min-w-0 mr-2 overflow-hidden cursor-grab active:cursor-grabbing"
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
                    placeholder={isTerminal ? "BUFFER: untitled.md" : "Untitled note"}
                    aria-label="Note title"
                    className={cn(
                      "no-drag-region bg-transparent font-semibold text-xs tracking-tight text-foreground placeholder:text-current/30 focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1.5 py-0.5 min-w-[50px] max-w-[220px] truncate select-text transition-all cursor-text",
                      isTerminal && "font-mono"
                    )}
                  />
                </HeaderTooltip>

                <span
                  data-tauri-drag-region
                  aria-live="polite"
                  className={cn(
                    "drag-region text-[10px] font-medium transition-opacity duration-200 shrink-0 pointer-events-none max-[439px]:hidden",
                    isTerminal && "font-mono",
                    saveStatus === "idle" ? "opacity-0" : "opacity-60"
                  )}
                >
                  {isTerminal
                    ? saveStatus === "saving"
                      ? "[WRITING...]"
                      : "[SYNC: OK]"
                    : saveStatus === "saving"
                    ? "Saving…"
                    : "Saved"}
                </span>

                {isToday && (
                  <div
                    className="liquid-glass-shell rounded-full p-[1px] shrink-0 no-drag-region select-none"
                    title="Today's Live Daily Scratchpad"
                  >
                    <div className="liquid-glass-track rounded-full px-2 py-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                      <span className="glass-active-beacon h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                      <span className="max-[519px]:hidden">Daily Stash</span>
                    </div>
                  </div>
                )}

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
          <SimpleDropdown
            align="end"
            contentClassName="w-56 text-xs max-h-[85vh] overflow-y-auto"
            trigger={({ toggle }) => (
              <HeaderTooltip label="Attach Interactive Widget">
                <button
                  onClick={toggle}
                  className={cn(
                    iconButton,
                    "w-auto px-1.5 gap-1 text-[11px] font-medium text-current/80 hover:text-current hover:bg-current/10"
                  )}
                  aria-label="Add interactive widget"
                >
                  <Plus className="h-3 w-3" />
                  <span className="max-[519px]:hidden">Widget</span>
                </button>
              </HeaderTooltip>
            )}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Interactive Tools
            </div>
            <SimpleDropdownItem onSelect={() => handleAddWidget("calculator")}>
              <CalcIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("calculator", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Quick Calculator</span>
                <span className="text-[10px] text-muted-foreground">Desktop math scratchpad</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("timer")}>
              <TimerIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("timer", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Focus & Pomodoro Timer</span>
                <span className="text-[10px] text-muted-foreground">Pomodoro & count-up stopwatch</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("swap")}>
              <ArrowUpDown className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("swap", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Currency Converter</span>
                <span className="text-[10px] text-muted-foreground">Instant fiat & crypto rates</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("ticker")}>
              <TrendingUp className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("ticker", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Market Tickers</span>
                <span className="text-[10px] text-muted-foreground">Live asset prices & 24h trend</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("countdown")}>
              <CalendarClock className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("countdown", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Countdown Timer</span>
                <span className="text-[10px] text-muted-foreground">Count down to any date or event</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("worldclock")}>
              <Globe className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("worldclock", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">World Clocks</span>
                <span className="text-[10px] text-muted-foreground">Global timezones & offsets</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("unitconverter")}>
              <Ruler className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("unitconverter", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Unit Converter</span>
                <span className="text-[10px] text-muted-foreground">Length, weight, temp & data</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("counter")}>
              <Target className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("counter", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Tally & Goal Counter</span>
                <span className="text-[10px] text-muted-foreground">Habit, task & quantity tracker</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("browser")}>
              <Globe className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("browser", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Web Browser (PiP)</span>
                <span className="text-[10px] text-muted-foreground">Embedded web & detachable PiP</span>
              </div>
            </SimpleDropdownItem>

            <SimpleDropdownSeparator />
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Component Blocks
            </div>
            <SimpleDropdownItem onSelect={() => handleAddWidget("scratchpad")}>
              <Sun className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("scratchpad", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Daily Scratchpad</span>
                <span className="text-[10px] text-muted-foreground">Focus timer, streak & notes</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("meeting")}>
              <Users className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("meeting", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Meeting Minutes</span>
                <span className="text-[10px] text-muted-foreground">Agenda, presence & actions</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("kanban")}>
              <Kanban className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("kanban", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Kanban Board</span>
                <span className="text-[10px] text-muted-foreground">To Do, Doing, Done card flow</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("habits")}>
              <Sparkles className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("habits", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">7-Day Habit Tracker</span>
                <span className="text-[10px] text-muted-foreground">Weekly streaks & daily checks</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("bug")}>
              <Bug className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("bug", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Bug Blitz & Triage</span>
                <span className="text-[10px] text-muted-foreground">Severity, status & repro steps</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("idea")}>
              <Lightbulb className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("idea", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Idea Incubator</span>
                <span className="text-[10px] text-muted-foreground">Confidence slider & notes</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("reading")}>
              <BookOpen className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("reading", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Book & Article Digest</span>
                <span className="text-[10px] text-muted-foreground">Rating, takeaways & quotes</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("palette")}>
              <Palette className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("palette", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Color Palette</span>
                <span className="text-[10px] text-muted-foreground">Hex swatches & 1-click copy</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("coderunner")}>
              <Code2 className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("coderunner", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Code Runner & Sandbox</span>
                <span className="text-[10px] text-muted-foreground">JS/Math sandbox with console</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("devtools")}>
              <Code2 className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("devtools", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Developer Utilities</span>
                <span className="text-[10px] text-muted-foreground">JSON, regex & text diff</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("spreadsheet")}>
              <Kanban className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("spreadsheet", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Mini Spreadsheet</span>
                <span className="text-[10px] text-muted-foreground">Reactive SUM & AVG formulas</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("expenses")}>
              <CalcIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("expenses", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Expense Log</span>
                <span className="text-[10px] text-muted-foreground">Receipts & running totals</span>
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleAddWidget("whiteboard")}>
              <Palette className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("whiteboard", isColorful))} />
              <div className="flex flex-col">
                <span className="font-medium">Freehand Sketch Canvas</span>
                <span className="text-[10px] text-muted-foreground">Drawing & visual diagrams</span>
              </div>
            </SimpleDropdownItem>
          </SimpleDropdown>

          {/* Stash AI Copilot & Intelligence */}
<span className="contents max-[359px]:hidden">
          <HeaderTooltip label="Stash AI Copilot (Summarize & Action Items)">
            <button
              onClick={() => {
                playClickSound();
                setAiModalOpen(true);
              }}
              aria-label="Stash AI Copilot"
              className={cn(
                iconButton,
                "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" weight="bold" />
            </button>
          </HeaderTooltip>
          </span>

          {/* Edge Docking Mode */}
<span className="contents max-[519px]:hidden">
          <SimpleDropdown
            align="end"
            contentClassName="w-48 text-xs"
            trigger={({ toggle }) => (
              <HeaderTooltip label={edgeDock === "none" ? "Edge Docking" : `Docked ${edgeDock}`}>
                <button
                  onClick={toggle}
                  aria-label="Edge docking"
                  className={cn(
                    iconButton,
                    edgeDock !== "none" && "bg-current/15 text-current opacity-100 ring-1 ring-current/20"
                  )}
                >
                  <SidebarSimple className="h-3.5 w-3.5" />
                </button>
              </HeaderTooltip>
            )}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Desktop Edge Snapping
            </div>
            <SimpleDropdownItem onSelect={() => handleSetEdgeDock("none")}>
              <div className="flex items-center justify-between w-full">
                <span>Free Float (Undocked)</span>
                {edgeDock === "none" && <Check className="h-3 w-3 text-primary" weight="bold" />}
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleSetEdgeDock("left")}>
              <div className="flex items-center justify-between w-full">
                <span>Snap to Left Edge</span>
                {edgeDock === "left" && <Check className="h-3 w-3 text-primary" weight="bold" />}
              </div>
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => handleSetEdgeDock("right")}>
              <div className="flex items-center justify-between w-full">
                <span>Snap to Right Edge</span>
                {edgeDock === "right" && <Check className="h-3 w-3 text-primary" weight="bold" />}
              </div>
            </SimpleDropdownItem>
          </SimpleDropdown>
          </span>

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
<span className="contents max-[399px]:hidden">
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
          </span>

          {/* Share as Image Button */}
<span className="contents max-[639px]:hidden">
          <HeaderTooltip label="Share as Beautiful Image">
            <button
              onClick={() => setExportImageOpen(true)}
              aria-label="Share as Image"
              className={iconButton}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </HeaderTooltip>
          </span>

          {/* Voice to Stash Dictation */}
<span className="contents max-[439px]:hidden">
          <HeaderTooltip label="Voice Dictation (Speech-to-Text · Right-click for Settings)">
            <div className="no-drag-region">
              <VoiceDictationButton
                onInsertText={handleInsertTextToNote}
                iconButtonClass={iconButton}
              />
            </div>
          </HeaderTooltip>
          </span>

          <SimpleDropdown
            align="end"
            contentClassName="w-56 text-xs"
            trigger={({ toggle }: { open: boolean; toggle: () => void }) => (
              <HeaderTooltip label="More Actions & Options">
                <button onClick={toggle} className={iconButton} aria-label="More actions">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </HeaderTooltip>
            )}
          >
            <SimpleDropdownItem className="min-[360px]:hidden" onSelect={() => setAiModalOpen(true)}>
              <Sparkles className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-primary"))} />
              Stash AI Copilot
            </SimpleDropdownItem>
            <SimpleDropdownItem className="min-[400px]:hidden" onSelect={handleTogglePin}>
              {alwaysOnTopState ? (
                <PinOff className="mr-2 h-3.5 w-3.5 text-primary" />
              ) : (
                <Pin className="mr-2 h-3.5 w-3.5 text-primary" />
              )}
              {alwaysOnTopState ? "Stop Keeping on Top" : "Keep on Top"}
            </SimpleDropdownItem>
            <SimpleDropdownItem className="min-[440px]:hidden" onSelect={() => void handleToggleShade()}>
              {isShaded ? (
                <ChevronDown className="mr-2 h-3.5 w-3.5 text-primary" />
              ) : (
                <ChevronUp className="mr-2 h-3.5 w-3.5 text-primary" />
              )}
              {isShaded ? "Unshade Note" : "Roll Up to Titlebar"}
            </SimpleDropdownItem>
            <SimpleDropdownItem
              className="min-[520px]:hidden"
              onSelect={() => handleSetEdgeDock(edgeDock === "none" ? "right" : "none")}
            >
              <SidebarSimple className="mr-2 h-3.5 w-3.5 text-primary" />
              {edgeDock === "none" ? "Snap to Right Edge" : "Undock (Free Float)"}
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => setExportImageOpen(true)}>
              <Camera className={cn("mr-2 h-3.5 w-3.5", colorClass("text-cyan-500", isColorful, "text-primary"))} />
              Share as Beautiful Image
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => setPersonaModalOpen(true)}>
              <Sparkles className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-primary"))} />
              Personalize note persona
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={handleOrganizeChecklist}>
              <ListChecks className={cn("mr-2 h-3.5 w-3.5", colorClass("text-emerald-500", isColorful, "text-foreground"))} />
              Organize checklist (done to bottom)
            </SimpleDropdownItem>
            <SimpleDropdownSeparator />
            <SimpleDropdownItem
              onSelect={async () => {
                const dup = await stashIpc.duplicateNote(note.id);
                await stashIpc.openFloatingStash(dup.id);
              }}
            >
              <Copy className={cn("mr-2 h-3.5 w-3.5", colorClass("text-blue-500", isColorful))} />
              Duplicate
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={handleOpenRevisions}>
              <History className={cn("mr-2 h-3.5 w-3.5", colorClass("text-purple-500", isColorful))} />
              Revision history
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={handleExportMarkdown}>
              <FileDown className={cn("mr-2 h-3.5 w-3.5", colorClass("text-indigo-500", isColorful))} />
              Export as Markdown
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={handleImportMarkdown}>
              <FileUp className={cn("mr-2 h-3.5 w-3.5", colorClass("text-teal-500", isColorful))} />
              Import Markdown
            </SimpleDropdownItem>
            <SimpleDropdownSub
              label="Currency Swap"
              icon={<ArrowUpDown className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("swap", isColorful, "text-foreground"))} />}
            >
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Popular Pairs
              </div>
              {POPULAR_SWAP_PAIRS.map((pair) => {
                const active = isPairActive(pair.from, pair.to);
                return (
                  <SimpleDropdownItem
                    key={pair.label}
                    onSelect={() => handleSelectSwapPair(pair.from, pair.to, pair.label)}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{pair.label}</span>
                      <span className="text-[10px] text-muted-foreground">{pair.name}</span>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 text-foreground" weight="bold" />}
                  </SimpleDropdownItem>
                );
              })}
              <SimpleDropdownSeparator />
              <SimpleDropdownItem
                onSelect={() => {
                  const editor = editorRef.current?.getEditor();
                  if (activeSwapWidget && editor) {
                    updateWidgetNodeInEditor(editor, activeSwapWidget.widgetId, { isCollapsed: false });
                    toast.show({ message: "Currency Swap opened" });
                  } else {
                    handleAddWidget("swap");
                    toast.show({ message: "Attached Currency Swap widget" });
                  }
                }}
                className="font-medium"
              >
                <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                {activeSwapWidget ? "Open Swap Widget" : "Add Default Swap Widget"}
              </SimpleDropdownItem>
            </SimpleDropdownSub>
            <SimpleDropdownSeparator />
            <SimpleDropdownItem onSelect={() => setDueDateDialogOpen(true)}>
              <CalendarClock className={cn("mr-2 h-3.5 w-3.5", colorClass("text-orange-500", isColorful, "text-foreground"))} />
              {dueDate ? "Manage due date & reminder" : "Set due date & reminder"}
            </SimpleDropdownItem>
            <SimpleDropdownItem onSelect={() => setPinDialogOpen(true)}>
              <Lock className={cn("mr-2 h-3.5 w-3.5", colorClass("text-rose-500", isColorful, "text-primary"))} />
              {hasPin ? "Change or remove PIN" : "Protect note with PIN"}
            </SimpleDropdownItem>
            {hasPin && isSessionUnlocked && (
              <SimpleDropdownItem onSelect={handleLockNow}>
                <KeyRound className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Lock note now
              </SimpleDropdownItem>
            )}
            <SimpleDropdownSeparator />
            <SimpleDropdownItem
              onSelect={async () => {
                await stashIpc.setNoteArchived(note.id, !note.isArchived);
                handleClose();
              }}
            >
              <Archive className="mr-2 h-3.5 w-3.5" />
              {note.isArchived ? "Unarchive" : "Archive"}
            </SimpleDropdownItem>
            <SimpleDropdownItem
              onSelect={async () => {
                await stashIpc.trashNote(note.id);
                handleClose();
              }}
              className="text-destructive hover:text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Move to Trash
            </SimpleDropdownItem>
          </SimpleDropdown>

          {/* Window Shade / Roll-Up Button */}
<span className="contents max-[439px]:hidden">
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
          </span>

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

      <ContextMenuItem onClick={() => void handleRefreshNote()}>
        <RefreshCw className={cn("mr-2 h-3.5 w-3.5", colorClass("text-blue-500", isColorful, "text-primary"))} />
        <span>Refresh Note</span>
        <ContextMenuShortcut>F5</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleTogglePin}>
        {alwaysOnTopState ? (
          <>
            <PinOff className="mr-2 h-3.5 w-3.5 text-foreground" />
            <span>Stop keeping on top</span>
          </>
        ) : (
          <>
            <Pin className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-foreground"))} />
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
          <Palette className={cn("mr-2 h-3.5 w-3.5", colorClass("text-pink-500", isColorful, "text-foreground"))} />
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
                <Check className="h-3 w-3 text-primary" weight="bold" />
              )}
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Currency Swap Submenu */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ArrowUpDown className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("swap", isColorful, "text-foreground"))} />
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
                {active && <Check className="h-3.5 w-3.5 text-foreground" weight="bold" />}
              </ContextMenuItem>
            );
          })}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              const editor = editorRef.current?.getEditor();
              if (activeSwapWidget && editor) {
                updateWidgetNodeInEditor(editor, activeSwapWidget.widgetId, { isCollapsed: false });
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
          <Plus className={cn("mr-2 h-3.5 w-3.5", colorClass("text-primary", isColorful, "text-foreground"))} />
          <span>Attach Widget</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-56 max-h-[80vh] overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Interactive Tools
          </div>
          <ContextMenuItem onClick={() => handleAddWidget("calculator")}>
            <CalcIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("calculator", isColorful))} />
            <span>Quick Calculator</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("timer")}>
            <TimerIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("timer", isColorful))} />
            <span>Focus & Pomodoro</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("countdown")}>
            <CalendarClock className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("countdown", isColorful))} />
            <span>Countdown Timer</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("worldclock")}>
            <Globe className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("worldclock", isColorful))} />
            <span>World Clock</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("unitconverter")}>
            <Ruler className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("unitconverter", isColorful))} />
            <span>Unit Converter</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("counter")}>
            <Target className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("counter", isColorful))} />
            <span>Tally Counter</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("browser")}>
            <Globe className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("browser", isColorful))} />
            <span>Mini Web Browser</span>
          </ContextMenuItem>

          <ContextMenuSeparator />
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Component Blocks
          </div>
          <ContextMenuItem onClick={() => handleAddWidget("scratchpad")}>
            <Sun className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("scratchpad", isColorful))} />
            <span>Daily Scratchpad</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("meeting")}>
            <Users className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("meeting", isColorful))} />
            <span>Meeting Minutes</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("kanban")}>
            <Kanban className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("kanban", isColorful))} />
            <span>Kanban Board</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("habits")}>
            <Sparkles className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("habits", isColorful))} />
            <span>7-Day Habit Tracker</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("bug")}>
            <Bug className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("bug", isColorful))} />
            <span>Bug Blitz & Triage</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("idea")}>
            <Lightbulb className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("idea", isColorful))} />
            <span>Idea Incubator</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("reading")}>
            <BookOpen className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("reading", isColorful))} />
            <span>Book & Article Digest</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("palette")}>
            <Palette className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("palette", isColorful))} />
            <span>Color Palette</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("coderunner")}>
            <Code2 className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("coderunner", isColorful))} />
            <span>Code Runner & Sandbox</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("devtools")}>
            <Code2 className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("devtools", isColorful))} />
            <span>Developer Utilities</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("spreadsheet")}>
            <Kanban className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("spreadsheet", isColorful))} />
            <span>Mini Spreadsheet</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("expenses")}>
            <CalcIcon className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("expenses", isColorful))} />
            <span>Expense Log</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleAddWidget("whiteboard")}>
            <Palette className={cn("mr-2 h-3.5 w-3.5", getWidgetColorClass("whiteboard", isColorful))} />
            <span>Freehand Sketch Canvas</span>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem onClick={() => setPersonaModalOpen(true)}>
        <Sparkles className={cn("mr-2 h-3.5 w-3.5", colorClass("text-amber-500", isColorful, "text-primary"))} />
        <span>Personalize Note Persona</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleOrganizeChecklist}>
        <ListChecks className={cn("mr-2 h-3.5 w-3.5", colorClass("text-emerald-500", isColorful, "text-foreground"))} />
        <span>Organize Checklist (Done to bottom)</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => setDueDateDialogOpen(true)}>
        <CalendarClock className={cn("mr-2 h-3.5 w-3.5", colorClass("text-orange-500", isColorful, "text-foreground"))} />
        <span>Due Date & Reminder</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => setPinDialogOpen(true)}>
        <Lock className={cn("mr-2 h-3.5 w-3.5", colorClass("text-rose-500", isColorful, "text-primary"))} />
        <span>{hasPin ? "Change or Remove PIN" : "Protect Note with PIN"}</span>
      </ContextMenuItem>

      {hasPin && isSessionUnlocked && (
        <ContextMenuItem onClick={handleLockNow}>
          <KeyRound className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Lock Note Now</span>
        </ContextMenuItem>
      )}

      <ContextMenuItem onClick={handleOpenRevisions}>
        <History className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>Revision History</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleExportMarkdown}>
        <FileDown className="mr-2 h-3.5 w-3.5 text-foreground" />
        <span>Export as Markdown</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={handleImportMarkdown}>
        <FileUp className="mr-2 h-3.5 w-3.5 text-foreground" />
        <span>Import Markdown</span>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => setExportImageOpen(true)}>
        <Camera className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>Share as Beautiful Image</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={async () => {
          const dup = await stashIpc.duplicateNote(note.id);
          await stashIpc.openFloatingStash(dup.id);
        }}
      >
        <Copy className="mr-2 h-3.5 w-3.5 text-foreground" />
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
          <div className="relative z-20 px-3 py-2 flex justify-center shrink-0 select-none">
            <div className="liquid-glass-shell w-full rounded-2xl p-[1.5px] shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="liquid-glass-track liquid-glass-sheen rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                    <ListTodo className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      {carryoverTasks.length} Unfinished Task{carryoverTasks.length > 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      From previous daily scratchpad
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleAcceptCarryover}
                    className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Carry Over</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissCarryover}
                    aria-label="Dismiss task carryover"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {hasPin && !isSessionUnlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
            <div className="p-3 bg-primary/10 text-primary rounded-full mb-3 shadow-inner">
              <Lock className="h-6 w-6" weight="bold" />
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
          <div ref={scrollContainerRef} className="relative flex flex-1 cursor-text flex-col overflow-y-auto px-4 pb-20 pt-3">
            {/* Tactile Paper Pattern Texture Backdrop */}
            {notePaper !== "plain" && (
              <div
                className="pointer-events-none absolute inset-0 select-none text-foreground z-0"
                style={getPaperPatternStyle(notePaper)}
                aria-hidden="true"
              />
            )}

            <div className={cn("relative z-10 flex-1 select-text", currentFontPersona?.fontClass)}>
              <TiptapEditor
                key={`${note.id}-${contentToken}`}
                initialContent={note.contentJson}
                initialPlainText={note.plainText}
                autoFocus={widgets.length === 0}
                onUpdate={handleContentUpdate}
                flushRef={flushRef}
                editorRef={editorRef}
                isDockMinimized={isDockMinimized}
                onToggleDock={handleToggleDock}
                className={currentFontPersona?.fontClass}
                onAddWidget={handleAddWidget}
                noteId={noteId}
                onInsertToNote={handleInsertTextToNote}
                onPersonalizePersona={() => setPersonaModalOpen(true)}
                onOrganizeChecklist={handleOrganizeChecklist}
                onDueDate={() => setDueDateDialogOpen(true)}
                onPin={() => setPinDialogOpen(true)}
                onExportMarkdown={handleExportMarkdown}
                onImportMarkdown={handleImportMarkdown}
                onRevisions={handleOpenRevisions}
                onRefreshNote={handleRefreshNote}
              />
            </div>

            {/* Bi-directional [[Wiki]] Backlinks Panel */}
            <div className="relative z-10 px-4 pb-10 pt-1">
              <BacklinksPanel
                noteId={note.id}
                noteTitle={note.title || title}
              />
            </div>

            {/* Interactive Note Statistics HUD */}
            <div className={cn("fixed bottom-2.5 right-3 z-30 pointer-events-auto", !isDockMinimized && "max-[767px]:bottom-14")}>
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

      {/* Time Machine Revision History Diff Viewer */}
      <RevisionDiffViewer
        open={revisionsOpen}
        onOpenChange={setRevisionsOpen}
        currentTitle={title}
        currentPlainText={note?.plainText || ""}
        revisions={revisions}
        onRestore={handleRestoreRevision}
        onCreateCheckpoint={handleCreateCheckpoint}
      />

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
              <CalendarClock className="h-4 w-4 text-foreground" />
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
      {/* Stash AI Copilot & Intelligence Modal */}
      <NoteAIAssistantModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        noteTitle={note.title || "Untitled Stash"}
        noteText={(aiModalOpen && editorRef.current?.getPlainText()) || note.plainText || ""}
        onInsertToNote={(text) => handleInsertTextToNote(text)}
      />
    </div>
  </TooltipProvider>
);
};
