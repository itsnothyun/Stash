import React, { useState } from "react";
import { Note, Tag } from "../types/note";
import { NOTE_COLORS, NoteColor, getColorDot } from "../types/color";
import { deriveNoteTitle } from "@/lib/utils/text";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/components/ui/toast";
import {
  Archive,
  Check,
  Code,
  Copy,
  CopyPlus,
  ExternalLink,
  FileDown,
  FileText,
  FileUp,
  Hash,
  Palette,
  Pin,
  PinOff,
  RotateCcw,
  Star,
  Tag as TagIcon,
  Trash2,
  Ghost,
  Sparkles,
  Smile,
  Type,
  Square,
  Camera,
  ListChecks,
  CalendarClock,
  Calendar,
  Lock,
  History,
  Plus,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  Kanban,
  Sun,
  Users,
  Bug,
  Lightbulb,
  BookOpen,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import {
  getNoteOpacity,
  setNoteOpacity,
  getNoteEmoji,
  setNoteEmoji,
  PAPER_PATTERNS,
  getNotePaper,
  setNotePaper,
  FONT_PERSONAS,
  getNoteFont,
  setNoteFont,
  FRAME_STYLES,
  getNoteFrame,
  setNoteFrame,
  hasNotePin,
  setNotePin,
  lockNoteInSession,
  getNoteDueDate,
  setNoteDueDate,
} from "@/features/stash/note-meta";
import { NoteExportImageModal } from "./note-export-image-modal";
import { NotePersonaModal } from "./note-persona-modal";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import {
  extractDoc,
  extractWidgets,
  serializeStashContent,
  docToPlainText,
  appendPlainTextToContent,
  stashContentFromPlainText,
} from "@/features/editor/stash-content";
import { organizeDocTasks, organizeChecklist } from "@/features/stash/task-organizer";
import { playChimeSound, playClickSound } from "@/lib/utils/sound-effects";
import { WidgetType, NoteWidgetData } from "@/features/widgets/types";
import { Revision } from "@/features/stash/types/note";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNoteDate } from "@/lib/utils/dates";

export interface NoteActionProps {
  note: Note;
  onOpenFloating: (noteId: string) => void;
  onToggleFavorite: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onChangeColor: (note: Note, color: NoteColor) => void;
  onDuplicate: (note: Note) => void;
  onArchive: (note: Note) => void;
  onTrash: (note: Note) => void;
  onRestore?: (note: Note) => void;
  onPermanentDelete?: (note: Note) => void;
  availableTags?: Tag[];
  onToggleTag?: (note: Note, tagId: string) => void;
}

function downloadFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Rich right-click card and dropdown menu items with custom iconography and personalizations.
 */
export const NoteMenuItems: React.FC<
  NoteActionProps & {
    isContextMenu?: boolean;
  }
> = ({
  note,
  onOpenFloating,
  onToggleFavorite,
  onTogglePinned,
  onChangeColor,
  onDuplicate,
  onArchive,
  onTrash,
  onRestore,
  onPermanentDelete,
  availableTags,
  onToggleTag,
  isContextMenu = true,
}) => {
  const Item = isContextMenu ? ContextMenuItem : DropdownMenuItem;
  const Separator = isContextMenu ? ContextMenuSeparator : DropdownMenuSeparator;
  const Sub = isContextMenu ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger = isContextMenu ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent = isContextMenu ? ContextMenuSubContent : DropdownMenuSubContent;
  const Shortcut = isContextMenu ? ContextMenuShortcut : DropdownMenuShortcut;
  const noteOpacity = getNoteOpacity(note.id);
  const noteEmoji = getNoteEmoji(note.id);
  const notePaper = getNotePaper(note.id);
  const noteFont = getNoteFont(note.id);
  const noteFrame = getNoteFrame(note.id);
  const [exportImageOpen, setExportImageOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [customDueDateInput, setCustomDueDateInput] = useState("");
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const hasPin = hasNotePin(note.id);
  const dueDate = getNoteDueDate(note.id);

  const handleCopyText = () => {
    const text = note.plainText || note.title || "";
    navigator.clipboard.writeText(text);
    toast.show({ message: "Note text copied to clipboard" });
  };

  const handleCopyMarkdown = () => {
    let md = "";
    if (note.title) {
      md += `# ${note.title}\n\n`;
    }
    md += note.plainText || "";
    navigator.clipboard.writeText(md.trim());
    toast.show({ message: "Markdown copied to clipboard" });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(note.id);
    toast.show({ message: `Note ID (${note.id.slice(0, 8)}…) copied` });
  };

  const handleExportMarkdown = () => {
    const doc = extractDoc(note.contentJson);
    const text = docToPlainText(doc) || note.plainText || "";
    const header = note.title?.trim() ? `# ${note.title.trim()}\n\n` : "";
    const fullMd = `${header}${text}`.trim();
    const safeTitle = (note.title || "stash-note")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 40) || "stash";
    downloadFile(`${safeTitle}.md`, fullMd, "text/markdown");
    try {
      navigator.clipboard.writeText(fullMd);
    } catch {}
    playChimeSound();
    toast.show({ message: `Exported ${safeTitle}.md` });
  };

  const handleExportText = () => {
    const safeTitle = (note.title || "stash-note")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 40);
    const content = `${note.title ? note.title + "\n\n" : ""}${note.plainText || ""}`;
    downloadFile(`${safeTitle}.txt`, content, "text/plain");
    toast.show({ message: `Exported ${safeTitle}.txt` });
  };

  const handleExportJson = () => {
    const safeTitle = (note.title || "stash-note")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 40);
    const content = JSON.stringify(note, null, 2);
    downloadFile(`${safeTitle}.json`, content, "application/json");
    toast.show({ message: `Exported ${safeTitle}.json` });
  };

  const handleAddWidget = async (type: WidgetType) => {
    try {
      const currentWidgets = extractWidgets<NoteWidgetData>(note.contentJson);
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
        scratchpad: "Daily Scratchpad",
        meeting: "Meeting Minutes",
        bug: "Bug Blitz & Triage",
        idea: "Idea Incubator",
        api: "API & Tech Blueprint",
        reading: "Book & Article Digest",
      };
      const newWidget: NoteWidgetData = {
        id: `${type}-${Date.now()}`,
        type,
        title: defaultTitles[type],
        x: 0,
        y: 0,
      };
      const nextWidgets = [...currentWidgets, newWidget];
      const doc = extractDoc(note.contentJson);
      const nextContentJson = serializeStashContent(doc, nextWidgets);
      await stashIpc.updateNote({
        id: note.id,
        version: note.version,
        contentJson: nextContentJson,
      });
      playChimeSound();
      toast.show({ message: `Attached ${defaultTitles[type]} to note` });
      await stashIpc.openFloatingStash(note.id);
    } catch {
      toast.error("Could not attach widget");
    }
  };

  const handleOrganizeChecklist = async () => {
    try {
      const doc = extractDoc(note.contentJson);
      const docResult = organizeDocTasks(doc);
      const currentWidgets = extractWidgets<NoteWidgetData>(note.contentJson);

      if (docResult.hasTasks) {
        if (docResult.completedCount === 0) {
          toast.show({ message: "All checklist tasks are already active" });
          return;
        }
        const updatedDoc = docResult.updatedDoc;
        const nextContentJson = serializeStashContent(updatedDoc, currentWidgets);
        const nextPlainText = docToPlainText(updatedDoc);
        await stashIpc.updateNote({
          id: note.id,
          version: note.version,
          contentJson: nextContentJson,
          plainText: nextPlainText,
        });
        playClickSound();
        toast.show({
          message: `Organized checklist: moved ${docResult.completedCount} completed task${docResult.completedCount > 1 ? "s" : ""} to bottom`,
        });
        await stashIpc.openFloatingStash(note.id);
        return;
      }

      const text = note.plainText || "";
      const textResult = organizeChecklist(text);
      if (!textResult.hasTasks) {
        toast.show({ message: "No checklist tasks found in this note" });
        return;
      }
      if (textResult.completedCount === 0) {
        toast.show({ message: "All checklist tasks are already active" });
        return;
      }
      const nextContentJson = stashContentFromPlainText(textResult.updatedText, currentWidgets);
      await stashIpc.updateNote({
        id: note.id,
        version: note.version,
        plainText: textResult.updatedText,
        contentJson: nextContentJson,
      });
      playClickSound();
      toast.show({
        message: `Organized checklist: moved ${textResult.completedCount} completed task${textResult.completedCount > 1 ? "s" : ""} to bottom`,
      });
      await stashIpc.openFloatingStash(note.id);
    } catch {
      toast.error("Could not organize checklist");
    }
  };

  const handleImportMarkdown = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const currentWidgets = extractWidgets<NoteWidgetData>(note.contentJson);
        const patch = appendPlainTextToContent(note.contentJson, currentWidgets, text);
        await stashIpc.updateNote({
          id: note.id,
          version: note.version,
          ...patch,
        });
        playChimeSound();
        toast.show({ message: `Imported ${file.name}` });
        await stashIpc.openFloatingStash(note.id);
      }
      try {
        document.body.removeChild(input);
      } catch {}
    };
    document.body.appendChild(input);
    input.click();
  };

  const handleSavePin = (pin: string) => {
    const trimmed = pin.trim();
    setNotePin(note.id, trimmed);
    if (trimmed) {
      lockNoteInSession(note.id);
      playChimeSound();
      toast.show({ message: "Note protected with PIN & locked" });
    } else {
      toast.show({ message: "PIN removed" });
    }
    setPinDialogOpen(false);
    setNewPinInput("");
  };

  const handleSaveDueDate = (dateIso: string | null) => {
    setNoteDueDate(note.id, dateIso);
    setDueDateDialogOpen(false);
    playClickSound();
    toast.show({ message: dateIso ? "Due date updated" : "Due date cleared" });
  };

  const handleOpenRevisions = async () => {
    const revs = await stashIpc.listRevisions(note.id);
    setRevisions(revs);
    setRevisionsOpen(true);
  };

  const handleCreateCheckpoint = async () => {
    await stashIpc.createRevisionCheckpoint(note.id);
    const revs = await stashIpc.listRevisions(note.id);
    setRevisions(revs);
    playClickSound();
    toast.show({ message: "Created revision checkpoint" });
  };

  const handleRestoreRevision = async (revId: string) => {
    await stashIpc.restoreRevision(note.id, revId);
    setRevisionsOpen(false);
    playChimeSound();
    toast.show({ message: "Restored checkpoint" });
  };

  return (
    <>
      {/* Primary Action: Open floating stash */}
      <Item onClick={() => onOpenFloating(note.id)}>
        <ExternalLink className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>Open as floating stash</span>
        <Shortcut>Enter</Shortcut>
      </Item>

      <Item onClick={() => onTogglePinned(note)}>
        {note.isPinned ? (
          <>
            <PinOff className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Unpin from top</span>
          </>
        ) : (
          <>
            <Pin className="mr-2 h-3.5 w-3.5" />
            <span>Pin to top</span>
          </>
        )}
      </Item>

      <Item onClick={() => onToggleFavorite(note)}>
        <Star
          className={cn(
            "mr-2 h-3.5 w-3.5",
            note.isFavorite ? "fill-amber-400 text-amber-400" : ""
          )}
        />
        <span>{note.isFavorite ? "Remove favorite" : "Add to favorites"}</span>
      </Item>

      <Separator />

      {/* Personalization: Color Palette */}
      <Sub>
        <SubTrigger>
          <Palette className="mr-2 h-3.5 w-3.5 text-indigo-500" />
          <span className="flex-1">Note Color</span>
          <span
            className="mr-1.5 h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10"
            style={{ backgroundColor: getColorDot(note.color) }}
            title={note.color}
          />
        </SubTrigger>
        <SubContent className="w-40">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Palette Theme
          </div>
          {NOTE_COLORS.map((c) => {
            const isCurrent = note.color === c.id;
            return (
              <Item
                key={c.id}
                onClick={() => onChangeColor(note, c.id)}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                    style={{ backgroundColor: c.dotColor }}
                  />
                  <span>{c.label}</span>
                </div>
                {isCurrent && <Check className="h-3 w-3 stroke-[2.5] text-primary" />}
              </Item>
            );
          })}
        </SubContent>
      </Sub>

      {/* Ghost Mode Translucency */}
      <Sub>
        <SubTrigger>
          <Ghost className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>Ghost Mode ({noteOpacity}%)</span>
        </SubTrigger>
        <SubContent className="w-44">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Translucency
          </div>
          {[
            { val: 100, label: "Solid", hint: "100%" },
            { val: 85, label: "Glass", hint: "85%" },
            { val: 70, label: "Phantom", hint: "70%" },
            { val: 45, label: "Ghost", hint: "45%" },
          ].map((item) => (
            <Item
              key={item.val}
              onClick={() => {
                setNoteOpacity(note.id, item.val);
                toast.show({ message: `Ghost mode set to ${item.val}%` });
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span>{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">({item.hint})</span>
              </div>
              {noteOpacity === item.val && (
                <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
              )}
            </Item>
          ))}
        </SubContent>
      </Sub>

      {/* Persona & Style */}
      <Sub>
        <SubTrigger>
          <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>Persona & Style</span>
        </SubTrigger>
        <SubContent className="w-52">
          {/* Emoji Icon Submenu */}
          <Sub>
            <SubTrigger>
              <Smile className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>Icon {noteEmoji ? `(${noteEmoji})` : ""}</span>
            </SubTrigger>
            <SubContent className="w-48">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Icon
              </div>
              <div className="grid grid-cols-4 gap-1 p-1.5 border-b border-border/40">
                {["🚀", "💡", "🎯", "⚡", "💻", "📝", "☕", "🎨", "🌿", "🔥", "📌", "🧠"].map(
                  (em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setNoteEmoji(note.id, noteEmoji === em ? null : em);
                        toast.show({
                          message: noteEmoji === em ? "Removed icon" : `Icon set to ${em}`,
                        });
                      }}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center text-base rounded-md border transition-colors cursor-pointer",
                        noteEmoji === em
                          ? "bg-primary/20 border-primary shadow-xs"
                          : "border-border/50 hover:bg-muted"
                      )}
                    >
                      {em}
                    </button>
                  )
                )}
              </div>
              {noteEmoji && (
                <Item
                  onClick={() => {
                    setNoteEmoji(note.id, null);
                    toast.show({ message: "Cleared note icon" });
                  }}
                  className="text-destructive focus:text-destructive text-xs"
                >
                  Clear icon
                </Item>
              )}
            </SubContent>
          </Sub>

          {/* Paper Pattern Submenu */}
          <Sub>
            <SubTrigger>
              <FileText className="mr-2 h-3.5 w-3.5 text-blue-500" />
              <span>Paper Texture</span>
            </SubTrigger>
            <SubContent className="w-44">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paper Patterns
              </div>
              {PAPER_PATTERNS.map((p) => (
                <Item
                  key={p.id}
                  onClick={() => {
                    setNotePaper(note.id, p.id);
                    toast.show({ message: `Paper pattern set to ${p.label}` });
                  }}
                  className="flex items-center justify-between"
                >
                  <span>{p.label}</span>
                  {notePaper === p.id && (
                    <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
                  )}
                </Item>
              ))}
            </SubContent>
          </Sub>

          {/* Typography Submenu */}
          <Sub>
            <SubTrigger>
              <Type className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Typography</span>
            </SubTrigger>
            <SubContent className="w-44">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reading Font
              </div>
              {FONT_PERSONAS.map((f) => (
                <Item
                  key={f.id}
                  onClick={() => {
                    setNoteFont(note.id, f.id);
                    toast.show({ message: `Typography set to ${f.label}` });
                  }}
                  className="flex items-center justify-between"
                >
                  <span className={f.fontClass}>{f.label}</span>
                  {noteFont === f.id && (
                    <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
                  )}
                </Item>
              ))}
            </SubContent>
          </Sub>

          {/* Window Frame Submenu */}
          <Sub>
            <SubTrigger>
              <Square className="mr-2 h-3.5 w-3.5 text-purple-500" />
              <span>Window Frame</span>
            </SubTrigger>
            <SubContent className="w-44">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Frame & Glow
              </div>
              {FRAME_STYLES.map((fr) => (
                <Item
                  key={fr.id}
                  onClick={() => {
                    setNoteFrame(note.id, fr.id);
                    toast.show({ message: `Window frame set to ${fr.label}` });
                  }}
                  className="flex items-center justify-between"
                >
                  <span>{fr.label}</span>
                  {noteFrame === fr.id && (
                    <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
                  )}
                </Item>
              ))}
            </SubContent>
          </Sub>
        </SubContent>
      </Sub>

      {/* Tags assignment if available */}
      {availableTags && availableTags.length > 0 && onToggleTag && (
        <Sub>
          <SubTrigger>
            <TagIcon className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>Tags</span>
          </SubTrigger>
          <SubContent className="w-44">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assign Tags
            </div>
            {availableTags.map((tag) => {
              const hasTag = note.tags?.some((t) => t.id === tag.id) ?? false;
              return (
                <Item
                  key={tag.id}
                  onClick={() => onToggleTag(note, tag.id)}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="truncate">#{tag.name}</span>
                  {hasTag && <Check className="h-3 w-3 stroke-[2.5] text-primary" />}
                </Item>
              );
            })}
          </SubContent>
        </Sub>
      )}

      {/* Copy & Clipboard */}
      <Sub>
        <SubTrigger>
          <Copy className="mr-2 h-3.5 w-3.5 text-sky-500" />
          <span>Copy & Share</span>
        </SubTrigger>
        <SubContent className="w-48">
          <Item onClick={() => setExportImageOpen(true)}>
            <Camera className="mr-2 h-3.5 w-3.5 text-primary" />
            <span>Share as Beautiful Image</span>
          </Item>
          <Item onClick={handleCopyText}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            <span>Copy Plain Text</span>
          </Item>
          <Item onClick={handleCopyMarkdown}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            <span>Copy as Markdown</span>
          </Item>
          <Item onClick={handleCopyId}>
            <Hash className="mr-2 h-3.5 w-3.5" />
            <span>Copy Note ID</span>
          </Item>
        </SubContent>
      </Sub>

      {/* Attach Widget Submenu */}
      <Sub>
        <SubTrigger>
          <Plus className="mr-2 h-3.5 w-3.5 text-emerald-500" />
          <span>Attach Widget</span>
        </SubTrigger>
        <SubContent className="w-56 max-h-[80vh] overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Interactive Tools
          </div>
          <Item onClick={() => handleAddWidget("calculator")}>
            <CalcIcon className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Quick Calculator</span>
          </Item>
          <Item onClick={() => handleAddWidget("timer")}>
            <TimerIcon className="mr-2 h-3.5 w-3.5 text-rose-500" />
            <span>Focus & Pomodoro</span>
          </Item>
          <Item onClick={() => handleAddWidget("swap")}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>Currency Converter</span>
          </Item>
          <Item onClick={() => handleAddWidget("ticker")}>
            <TrendingUp className="mr-2 h-3.5 w-3.5 text-blue-500" />
            <span>Market Tickers</span>
          </Item>
          <Item onClick={() => handleAddWidget("countdown")}>
            <CalendarClock className="mr-2 h-3.5 w-3.5 text-orange-500" />
            <span>Countdown Timer</span>
          </Item>
          <Item onClick={() => handleAddWidget("worldclock")}>
            <Globe className="mr-2 h-3.5 w-3.5 text-cyan-500" />
            <span>World Clock</span>
          </Item>
          <Item onClick={() => handleAddWidget("unitconverter")}>
            <Ruler className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            <span>Unit Converter</span>
          </Item>
          <Item onClick={() => handleAddWidget("counter")}>
            <Target className="mr-2 h-3.5 w-3.5 text-purple-500" />
            <span>Tally Counter</span>
          </Item>
          <Item onClick={() => handleAddWidget("browser")}>
            <Globe className="mr-2 h-3.5 w-3.5 text-cyan-500" />
            <span>Mini Web Browser</span>
          </Item>

          <Separator />
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Component Blocks
          </div>
          <Item onClick={() => handleAddWidget("scratchpad")}>
            <Sun className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Daily Scratchpad</span>
          </Item>
          <Item onClick={() => handleAddWidget("meeting")}>
            <Users className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>Meeting Minutes</span>
          </Item>
          <Item onClick={() => handleAddWidget("kanban")}>
            <Kanban className="mr-2 h-3.5 w-3.5 text-blue-500" />
            <span>Kanban Board</span>
          </Item>
          <Item onClick={() => handleAddWidget("habits")}>
            <Sparkles className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>7-Day Habit Tracker</span>
          </Item>
          <Item onClick={() => handleAddWidget("bug")}>
            <Bug className="mr-2 h-3.5 w-3.5 text-rose-500" />
            <span>Bug Blitz & Triage</span>
          </Item>
          <Item onClick={() => handleAddWidget("idea")}>
            <Lightbulb className="mr-2 h-3.5 w-3.5 text-yellow-500" />
            <span>Idea Incubator</span>
          </Item>
          <Item onClick={() => handleAddWidget("reading")}>
            <BookOpen className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            <span>Book & Article Digest</span>
          </Item>
          <Item onClick={() => handleAddWidget("palette")}>
            <Palette className="mr-2 h-3.5 w-3.5 text-pink-500" />
            <span>Color Palette</span>
          </Item>
        </SubContent>
      </Sub>

      {/* Personalize Note Persona Modal Trigger */}
      <Item onClick={() => setPersonaModalOpen(true)}>
        <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>Personalize Note Persona</span>
      </Item>

      {/* Organize Checklist */}
      <Item onClick={handleOrganizeChecklist}>
        <ListChecks className="mr-2 h-3.5 w-3.5 text-emerald-500" />
        <span>Organize Checklist (Done to bottom)</span>
      </Item>

      {/* Due Date & Reminder */}
      <Item onClick={() => setDueDateDialogOpen(true)}>
        <CalendarClock className="mr-2 h-3.5 w-3.5 text-amber-500" />
        <span>Due Date & Reminder</span>
      </Item>

      {/* PIN Protection */}
      <Item onClick={() => setPinDialogOpen(true)}>
        <Lock className="mr-2 h-3.5 w-3.5 text-primary" />
        <span>{hasPin ? "Change or Remove PIN" : "Protect Note with PIN"}</span>
      </Item>

      {/* Revision History */}
      <Item onClick={handleOpenRevisions}>
        <History className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <span>Revision History</span>
      </Item>

      {/* Import Markdown */}
      <Item onClick={handleImportMarkdown}>
        <FileUp className="mr-2 h-3.5 w-3.5 text-sky-500" />
        <span>Import Markdown</span>
      </Item>

      <Separator />

      {/* Duplicate */}
      <Item onClick={() => onDuplicate(note)}>
        <CopyPlus className="mr-2 h-3.5 w-3.5 text-blue-500" />
        <span>Duplicate note</span>
        <Shortcut>Ctrl+D</Shortcut>
      </Item>

      {/* Export Submenu */}
      <Sub>
        <SubTrigger>
          <FileDown className="mr-2 h-3.5 w-3.5 text-purple-500" />
          <span>Export Stash</span>
        </SubTrigger>
        <SubContent className="w-48">
          <Item onClick={() => setExportImageOpen(true)}>
            <Camera className="mr-2 h-3.5 w-3.5 text-primary" />
            <span>Image Card (.png)</span>
          </Item>
          <Item onClick={handleExportMarkdown}>
            <FileDown className="mr-2 h-3.5 w-3.5" />
            <span>Markdown (.md)</span>
          </Item>
          <Item onClick={handleExportText}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            <span>Plain Text (.txt)</span>
          </Item>
          <Item onClick={handleExportJson}>
            <Code className="mr-2 h-3.5 w-3.5" />
            <span>Raw JSON (.json)</span>
          </Item>
        </SubContent>
      </Sub>

      <Separator />

      {/* Destructive / Trash lifecycle */}
      {note.deletedAt ? (
        <>
          {onRestore && (
            <Item onClick={() => onRestore(note)}>
              <RotateCcw className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Restore note</span>
            </Item>
          )}
          {onPermanentDelete && (
            <Item
              onClick={() => onPermanentDelete(note)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span>Delete permanently</span>
            </Item>
          )}
        </>
      ) : (
        <>
          <Item onClick={() => onArchive(note)}>
            <Archive className="mr-2 h-3.5 w-3.5" />
            <span>{note.isArchived ? "Restore from Archive" : "Archive note"}</span>
          </Item>
          <Item
            onClick={() => onTrash(note)}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            <span>Move to Trash</span>
          </Item>
        </>
      )}

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

      {/* Note Persona Customization Modal */}
      <NotePersonaModal
        isOpen={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
        noteId={note.id}
        noteTitle={note.title || "Untitled Stash"}
        noteColor={note.color}
        onChangeColor={(col) => onChangeColor(note, col)}
        currentEmoji={noteEmoji}
        onChangeEmoji={(em) => setNoteEmoji(note.id, em)}
        currentPaper={notePaper}
        onChangePaper={(pp) => setNotePaper(note.id, pp)}
        currentFont={noteFont}
        onChangeFont={(ft) => setNoteFont(note.id, ft)}
        currentFrame={noteFrame}
        onChangeFrame={(fm) => setNoteFrame(note.id, fm)}
      />

      {/* PIN Configuration Dialog */}
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
                className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {hasPin && (
                <button
                  type="button"
                  onClick={() => handleSavePin("")}
                  className="px-3 py-1.5 text-xs rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  Remove PIN
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSavePin(newPinInput)}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium cursor-pointer"
              >
                Save PIN
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Due Date & Reminder Dialog */}
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
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 rounded border border-border/80 hover:bg-muted text-left font-medium transition-colors cursor-pointer"
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
                  className="px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
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
                  className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium cursor-pointer"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision History Dialog */}
      <Dialog open={revisionsOpen} onOpenChange={setRevisionsOpen}>
        <DialogContent className="max-w-md gap-3 p-5">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-sm">Revision history</DialogTitle>
                <DialogDescription>
                  Checkpoints preserve milestones. Restoring one keeps previous versions recoverable.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateCheckpoint()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save Checkpoint</span>
              </button>
            </div>
          </DialogHeader>

          <div className="max-h-72 divide-y divide-border overflow-y-auto">
            {revisions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No checkpoints yet. Click Save Checkpoint to create one.
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
                    <div className="mt-0.5 truncate text-2xs text-muted-foreground/80">
                      {rev.plainText}
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRestoreRevision(rev.id)}
                    className="flex shrink-0 items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-2xs font-medium transition-colors hover:bg-muted cursor-pointer"
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
    </>
  );
};

export interface NoteContextMenuProps extends NoteActionProps {
  children: React.ReactNode;
}

export const NoteContextMenu: React.FC<NoteContextMenuProps> = ({
  children,
  ...props
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getColorDot(props.note.color) }}
          />
          <span className="truncate">{deriveNoteTitle(props.note.title, props.note.plainText)}</span>
        </div>
        <NoteMenuItems {...props} isContextMenu={true} />
      </ContextMenuContent>
    </ContextMenu>
  );
};
