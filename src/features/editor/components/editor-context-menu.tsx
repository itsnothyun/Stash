import React from "react";
import { Editor } from "@tiptap/react";
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
import { toast } from "@/components/ui/toast";
import {
  Bold,
  Check,
  ClipboardPaste,
  Code,
  Code2,
  Copy,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  PlusCircle,
  Quote,
  Redo2,
  Scissors,
  Strikethrough,
  Table as TableIcon,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

interface EditorContextMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
}

export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({
  editor,
  children,
}) => {
  if (!editor) {
    return <>{children}</>;
  }

  const handleCopy = () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    if (selected) {
      navigator.clipboard.writeText(selected);
      toast.show({ message: "Copied selection" });
    } else {
      navigator.clipboard.writeText(editor.getText());
      toast.show({ message: "Copied note text" });
    }
  };

  const handleCut = () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    if (selected) {
      navigator.clipboard.writeText(selected);
      editor.commands.deleteSelection();
      toast.show({ message: "Cut to clipboard" });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.commands.insertContent(text);
      }
    } catch {
      // Fallback
      document.execCommand("paste");
    }
  };

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();
  const hasSelection = !editor.state.selection.empty;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Undo / Redo */}
        <ContextMenuItem
          disabled={!canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Undo</span>
          <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          disabled={!canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Redo</span>
          <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Cut / Copy / Paste */}
        <ContextMenuItem disabled={!hasSelection} onClick={handleCut}>
          <Scissors className="mr-2 h-3.5 w-3.5 text-amber-500" />
          <span>Cut</span>
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-3.5 w-3.5 text-sky-500" />
          <span>Copy</span>
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={handlePaste}>
          <ClipboardPaste className="mr-2 h-3.5 w-3.5 text-emerald-500" />
          <span>Paste</span>
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Text Formatting Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Type className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            <span>Format Text</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Bold className="mr-2 h-3.5 w-3.5" />
                <span className="font-semibold">Bold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ContextMenuShortcut>Ctrl+B</ContextMenuShortcut>
                {editor.isActive("bold") && (
                  <Check className="h-3 w-3 stroke-[2.5] text-primary" />
                )}
              </div>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Italic className="mr-2 h-3.5 w-3.5" />
                <span className="italic">Italic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ContextMenuShortcut>Ctrl+I</ContextMenuShortcut>
                {editor.isActive("italic") && (
                  <Check className="h-3 w-3 stroke-[2.5] text-primary" />
                )}
              </div>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <UnderlineIcon className="mr-2 h-3.5 w-3.5" />
                <span className="underline">Underline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ContextMenuShortcut>Ctrl+U</ContextMenuShortcut>
                {editor.isActive("underline") && (
                  <Check className="h-3 w-3 stroke-[2.5] text-primary" />
                )}
              </div>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Strikethrough className="mr-2 h-3.5 w-3.5" />
                <span className="line-through">Strikethrough</span>
              </div>
              {editor.isActive("strike") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Highlighter className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Highlight</span>
              </div>
              {editor.isActive("highlight") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Code className="mr-2 h-3.5 w-3.5" />
                <span className="font-mono text-2xs">Inline Code</span>
              </div>
              {editor.isActive("code") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Structure / Heading Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Heading1 className="mr-2 h-3.5 w-3.5 text-purple-500" />
            <span>Style & Headings</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Heading1 className="mr-2 h-3.5 w-3.5" />
                <span className="font-bold">Heading 1</span>
              </div>
              {editor.isActive("heading", { level: 1 }) && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Heading2 className="mr-2 h-3.5 w-3.5" />
                <span className="font-semibold">Heading 2</span>
              </div>
              {editor.isActive("heading", { level: 2 }) && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Heading3 className="mr-2 h-3.5 w-3.5" />
                <span className="font-medium">Heading 3</span>
              </div>
              {editor.isActive("heading", { level: 3 }) && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Pilcrow className="mr-2 h-3.5 w-3.5" />
                <span>Paragraph</span>
              </div>
              {editor.isActive("paragraph") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Quote className="mr-2 h-3.5 w-3.5" />
                <span>Quote</span>
              </div>
              {editor.isActive("blockquote") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Code2 className="mr-2 h-3.5 w-3.5" />
                <span>Code Block</span>
              </div>
              {editor.isActive("codeBlock") && (
                <Check className="h-3 w-3 stroke-[2.5] text-primary" />
              )}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Insert Elements Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <PlusCircle className="mr-2 h-3.5 w-3.5 text-blue-500" />
            <span>Insert</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListTodo className="mr-2 h-3.5 w-3.5 text-primary" />
              <span>To-do Checklist</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="mr-2 h-3.5 w-3.5" />
              <span>Bullet List</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="mr-2 h-3.5 w-3.5" />
              <span>Numbered List</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="mr-2 h-3.5 w-3.5" />
              <span>Divider Line</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon className="mr-2 h-3.5 w-3.5" />
              <span>Table (3×3)</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Clear formatting */}
        <ContextMenuItem
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Eraser className="mr-2 h-3.5 w-3.5 text-rose-500" />
          <span>Clear Formatting</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
