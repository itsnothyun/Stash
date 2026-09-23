import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Text,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  ArrowUpDown,
  Highlighter,
  Underline as UnderlineIcon,
  Table as TableIcon,
} from "lucide-react";
import "@tiptap/extension-underline";
import "@tiptap/extension-highlight";
import { cn } from "@/lib/utils/cn";

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const ITEMS: SlashMenuItem[] = [
  {
    title: "Text",
    description: "Start writing plain text",
    icon: <Text className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "To-do list",
    description: "Track tasks with checkable boxes",
    icon: <CheckSquare className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: "Bulleted list",
    description: "Create a simple bulleted list",
    icon: <List className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Create an ordered list",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote or highlighted callout",
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: "Code block",
    description: "Display code snippet with syntax container",
    icon: <Code className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Visual separation line",
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: "Highlight",
    description: "Emphasize key words with color mark",
    icon: <Highlighter className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run();
    },
  },
  {
    title: "Underline",
    description: "Underline selected or new text",
    icon: <UnderlineIcon className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleUnderline().run();
    },
  },
  {
    title: "Table",
    description: "Insert a 3×3 table",
    icon: <TableIcon className="h-4 w-4" />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Swap Widget",
    description: "Interactive crypto token swap calculator",
    icon: <ArrowUpDown className="h-4 w-4" />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "paragraph",
          content: [{ type: "text", text: "[swap-widget]" }],
        })
        .run();
    },
  },
];

interface SlashMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  editor,
  isOpen,
  onClose,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % ITEMS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + ITEMS.length) % ITEMS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = ITEMS[selectedIndex];
        if (item) {
          // Delete slash character
          editor.commands.deleteRange({
            from: editor.state.selection.from - 1,
            to: editor.state.selection.from,
          });
          item.command(editor);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, editor, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 w-60 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in-50 zoom-in-95"
      style={{
        top: `${Math.min(position.top, window.innerHeight - 320)}px`,
        left: `${Math.min(position.left, window.innerWidth - 260)}px`,
      }}
    >
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
        Commands
      </div>
      <div className="max-h-64 overflow-y-auto space-y-0.5">
        {ITEMS.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.title}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                editor.commands.deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                });
                item.command(editor);
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs text-left transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border/60 bg-surface text-muted-foreground">
                {item.icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
