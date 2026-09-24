import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { focusOutsideChecklist, StashTaskItem } from "../extensions/stash-task-item";
import { StashTaskList } from "./stash-task-list";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { FontSize } from "../extensions/font-size";
import { docForEditor, docToPlainText } from "../stash-content";
import { evaluateInlineMath } from "../inline-math";
import { SlashMenu } from "./slash-menu";
import { FloatingToolbar } from "./floating-toolbar";
import { EditorContextMenu } from "./editor-context-menu";
import { WidgetType } from "@/features/widgets/types";
import { cn } from "@/lib/utils/cn";

interface TiptapEditorProps {
  initialContent?: string;
  /**
   * The note's `plainText`. Used only as a repair path: a note whose
   * `contentJson` holds no doc but whose text does gets its text back on open.
   */
  initialPlainText?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onUpdate?: (contentJson: string, plainText: string) => void;
  /**
   * Receives a function that writes any pending edit straight away, so the
   * owner can force a durable save before the window closes.
   */
  flushRef?: React.MutableRefObject<(() => void) | null>;
  className?: string;
  /**
   * Keeps the floating toolbar open at the caret even without a selection.
   * With it off, the toolbar only appears when text is selected.
   */
  showToolbar?: boolean;
  isDockMinimized?: boolean;
  onToggleDock?: (minimized?: boolean) => void;
  onAddWidget?: (type: WidgetType) => void;
  onPersonalizePersona?: () => void;
  onOrganizeChecklist?: () => void;
  onDueDate?: () => void;
  onPin?: () => void;
  onExportMarkdown?: () => void;
  onImportMarkdown?: () => void;
  onRevisions?: () => void;
  onRefreshNote?: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent,
  initialPlainText,
  placeholder = "Stash a thought… (press / for blocks)",
  autoFocus = true,
  onUpdate,
  flushRef,
  className,
  isDockMinimized,
  onToggleDock,
  onAddWidget,
  onPersonalizePersona,
  onOrganizeChecklist,
  onDueDate,
  onPin,
  onExportMarkdown,
  onImportMarkdown,
  onRevisions,
  onRefreshNote,
}) => {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWriteRef = useRef<(() => void) | null>(null);

  const handleUpdate = useCallback(
    (contentJson: string, plainText: string) => {
      if (!onUpdate) return;
      const write = () => {
        pendingWriteRef.current = null;
        onUpdate(contentJson, plainText);
      };

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      pendingWriteRef.current = write;
      debounceTimerRef.current = setTimeout(write, 300);
    },
    [onUpdate]
  );

  const flush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    pendingWriteRef.current?.();
  }, []);

  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = flush;
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, flush]);

  // `docForEditor` also repairs notes whose text only ever reached
  // `plainText`, so they stop opening blank.
  const parsedInitial = docForEditor(initialContent, initialPlainText);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      StashTaskList,
      StashTaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-sky-500 underline underline-offset-2 hover:text-sky-600 cursor-pointer",
        },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "border-collapse table-fixed w-full my-2",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-border bg-muted/40 px-3 py-1.5 text-left text-xs font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border px-3 py-1.5 text-xs align-top",
        },
      }),
    ],
    content: parsedInitial as any,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-full text-editor-foreground leading-relaxed text-sm",
      },
      handleClick: (view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return false;
        if (target.closest(".stash-checklist")) return false;
        if (target.closest("p, h1, h2, h3, pre, blockquote, li")) return false;
        return focusOutsideChecklist(view, event.clientX, event.clientY);
      },
      handleKeyDown: (view, event) => {
        // Detect '/' at start of block or after whitespace
        if (event.key === "/") {
          const { selection } = view.state;
          const coords = view.coordsAtPos(selection.from);
          setSlashMenuPos({ top: coords.bottom + 6, left: coords.left });
          setSlashMenuOpen(true);
        } else if (event.key === "Escape") {
          setSlashMenuOpen(false);
        } else if (event.key === "=") {
          const { state } = view;
          const { from } = state.selection;
          const textBefore = state.doc.textBetween(Math.max(0, from - 80), from, "\n");
          const calc = evaluateInlineMath(textBefore + "=");
          if (calc) {
            setTimeout(() => {
              view.dispatch(view.state.tr.insertText(" " + calc.result));
            }, 10);
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const jsonObj = currentEditor.getJSON();
      const json = JSON.stringify(jsonObj);
      const text = docToPlainText(jsonObj);
      handleUpdate(json, text);
    },
    onBlur: () => {
      flush();
    },
  });

  // A pending write must survive unmount — closing a note is exactly when
  // losing the last keystroke would hurt most.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      pendingWriteRef.current?.();
    };
  }, []);

  return (
    <div
      className={cn("relative flex h-full min-h-full w-full flex-col", className)}
      onMouseDown={(event) => {
        if (!editor) return;
        const target = event.target as HTMLElement;
        if (target.closest(".ProseMirror")) return;
        if (focusOutsideChecklist(editor.view, event.clientX, event.clientY)) {
          event.preventDefault();
        }
      }}
    >
      <EditorContextMenu
        editor={editor}
        onAddWidget={onAddWidget}
        onPersonalizePersona={onPersonalizePersona}
        onOrganizeChecklist={onOrganizeChecklist}
        onDueDate={onDueDate}
        onPin={onPin}
        onExportMarkdown={onExportMarkdown}
        onImportMarkdown={onImportMarkdown}
        onRevisions={onRevisions}
        onRefreshNote={onRefreshNote}
      >
        <div className="h-full min-h-full w-full flex-1">
          <EditorContent editor={editor} className={cn("h-full min-h-full w-full flex-1 [&_.ProseMirror]:min-h-full", className)} />
        </div>
      </EditorContextMenu>

      <FloatingToolbar
        editor={editor}
        isMinimized={isDockMinimized}
        onToggleMinimize={onToggleDock}
      />
      {editor && (
        <SlashMenu
          editor={editor}
          isOpen={slashMenuOpen}
          onClose={() => setSlashMenuOpen(false)}
          position={slashMenuPos}
        />
      )}
    </div>
  );
};
