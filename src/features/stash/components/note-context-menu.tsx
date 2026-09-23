import React from "react";
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
} from "@/features/stash/note-meta";

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
    const safeTitle = (note.title || "stash-note")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 40);
    const content = `# ${note.title || "Untitled Stash"}\n\n${note.plainText || ""}\n`;
    downloadFile(`${safeTitle}.md`, content, "text/markdown");
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
