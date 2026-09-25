import React, { useEffect, useMemo, useState } from "react";
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
  Code2,
  Minus,
  ArrowUpDown,
  Highlighter,
  Underline as UnderlineIcon,
  Table as TableIcon,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  CalendarClock,
  Kanban,
  Sparkles,
  Palette,
  Sun,
  Users,
  Bug,
  Lightbulb,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import "@tiptap/extension-underline";
import "@tiptap/extension-highlight";
import { WidgetType } from "@/features/widgets/types";
import { cn } from "@/lib/utils/cn";

interface SlashMenuItem {
  title: string;
  description: string;
  category: "Blocks" | "Widgets";
  keywords: string[];
  icon: React.ReactNode;
  command: (editor: Editor, onAddWidget?: (type: WidgetType) => void) => void;
}

const ITEMS: SlashMenuItem[] = [
  // Formatting blocks
  {
    title: "Text",
    description: "Start writing plain text",
    category: "Blocks",
    keywords: ["text", "paragraph", "plain", "normal"],
    icon: <Text className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    category: "Blocks",
    keywords: ["heading", "h1", "title", "large"],
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    category: "Blocks",
    keywords: ["heading", "h2", "subtitle", "medium"],
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    category: "Blocks",
    keywords: ["heading", "h3", "section", "small"],
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "To-do checklist",
    description: "Track tasks with checkable boxes",
    category: "Blocks",
    keywords: ["todo", "task", "check", "checklist", "box"],
    icon: <CheckSquare className="h-4 w-4 text-emerald-500" />,
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: "Bulleted list",
    description: "Create a simple bulleted list",
    category: "Blocks",
    keywords: ["list", "bullet", "unordered"],
    icon: <List className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Create an ordered sequence",
    category: "Blocks",
    keywords: ["list", "numbered", "ordered", "123"],
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote or callout",
    category: "Blocks",
    keywords: ["quote", "blockquote", "callout"],
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: "Code block",
    description: "Display snippet with syntax container",
    category: "Blocks",
    keywords: ["code", "block", "snippet", "pre"],
    icon: <Code className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal separation line",
    category: "Blocks",
    keywords: ["divider", "hr", "line", "separator"],
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: "Highlight",
    description: "Emphasize words with color mark",
    category: "Blocks",
    keywords: ["highlight", "mark", "color"],
    icon: <Highlighter className="h-4 w-4 text-amber-500" />,
    command: (editor) => {
      editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run();
    },
  },
  {
    title: "Underline",
    description: "Underline selected or new text",
    category: "Blocks",
    keywords: ["underline", "u"],
    icon: <UnderlineIcon className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleUnderline().run();
    },
  },
  {
    title: "Table (3×3)",
    description: "Insert a structured table",
    category: "Blocks",
    keywords: ["table", "grid", "rows", "columns"],
    icon: <TableIcon className="h-4 w-4 text-primary" />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },

  // Interactive Widgets
  {
    title: "Quick Calculator",
    description: "Interactive desktop math calculator",
    category: "Widgets",
    keywords: ["calculator", "calc", "math", "numbers", "widget"],
    icon: <CalcIcon className="h-4 w-4 text-amber-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("calculator");
    },
  },
  {
    title: "Focus & Pomodoro Timer",
    description: "Focus timer and count-up stopwatch",
    category: "Widgets",
    keywords: ["timer", "pomodoro", "stopwatch", "focus", "time", "clock", "widget"],
    icon: <TimerIcon className="h-4 w-4 text-rose-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("timer");
    },
  },
  {
    title: "Currency Converter",
    description: "Instant token & currency swap exchange rates",
    category: "Widgets",
    keywords: ["swap", "currency", "crypto", "exchange", "rate", "usd", "eth", "widget"],
    icon: <ArrowUpDown className="h-4 w-4 text-emerald-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("swap");
    },
  },
  {
    title: "Market Tickers",
    description: "Live crypto and stock asset price tracker",
    category: "Widgets",
    keywords: ["ticker", "market", "stock", "crypto", "price", "btc", "widget"],
    icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("ticker");
    },
  },
  {
    title: "Countdown Timer",
    description: "Count down to any deadline, launch, or event",
    category: "Widgets",
    keywords: ["countdown", "event", "deadline", "date", "launch", "widget"],
    icon: <CalendarClock className="h-4 w-4 text-orange-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("countdown");
    },
  },
  {
    title: "World Clock",
    description: "Multi-timezone clocks and global time offsets",
    category: "Widgets",
    keywords: ["world", "clock", "timezone", "gmt", "utc", "time", "widget"],
    icon: <Globe className="h-4 w-4 text-cyan-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("worldclock");
    },
  },
  {
    title: "Unit Converter",
    description: "Length, mass, temperature, and digital data conversions",
    category: "Widgets",
    keywords: ["unit", "converter", "length", "weight", "metric", "imperial", "widget"],
    icon: <Ruler className="h-4 w-4 text-indigo-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("unitconverter");
    },
  },
  {
    title: "Tally & Goal Counter",
    description: "Click counter for habits, repetitions, and targets",
    category: "Widgets",
    keywords: ["counter", "tally", "goal", "habits", "reps", "widget"],
    icon: <Target className="h-4 w-4 text-purple-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("counter");
    },
  },
  {
    title: "Mini Web Browser",
    description: "Embedded browser with detachable Picture-in-Picture window",
    category: "Widgets",
    keywords: ["browser", "web", "pip", "url", "internet", "widget"],
    icon: <Globe className="h-4 w-4 text-cyan-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("browser");
    },
  },
  {
    title: "Daily Scratchpad",
    description: "Focus timer, streak badge, priorities & notes",
    category: "Widgets",
    keywords: ["scratchpad", "daily", "journal", "focus", "today", "widget"],
    icon: <Sun className="h-4 w-4 text-amber-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("scratchpad");
    },
  },
  {
    title: "Meeting Minutes",
    description: "Agenda, attendee presence check, and action items",
    category: "Widgets",
    keywords: ["meeting", "agenda", "minutes", "attendees", "action", "widget"],
    icon: <Users className="h-4 w-4 text-emerald-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("meeting");
    },
  },
  {
    title: "Kanban Board",
    description: "3-column To Do, In Progress, Done card board",
    category: "Widgets",
    keywords: ["kanban", "board", "sprint", "cards", "tasks", "agile", "widget"],
    icon: <Kanban className="h-4 w-4 text-blue-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("kanban");
    },
  },
  {
    title: "7-Day Habit Tracker",
    description: "Weekly consistency streak checkboxes",
    category: "Widgets",
    keywords: ["habit", "habits", "tracker", "streak", "weekly", "routine", "widget"],
    icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("habits");
    },
  },
  {
    title: "Bug Blitz & Triage",
    description: "Severity tags, status toggles, repro steps & bug count",
    category: "Widgets",
    keywords: ["bug", "issue", "triage", "severity", "p0", "p1", "dev", "widget"],
    icon: <Bug className="h-4 w-4 text-rose-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("bug");
    },
  },
  {
    title: "Idea Incubator",
    description: "Confidence slider, pros/cons, and validation steps",
    category: "Widgets",
    keywords: ["idea", "incubator", "brainstorm", "confidence", "hypothesis", "widget"],
    icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("idea");
    },
  },
  {
    title: "API & Tech Blueprint",
    description: "Endpoint method pill, JSON payload schema & cURL command",
    category: "Widgets",
    keywords: ["api", "tech", "endpoint", "curl", "json", "code", "widget"],
    icon: <Code2 className="h-4 w-4 text-blue-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("api");
    },
  },
  {
    title: "Book & Article Digest",
    description: "5-star rating, takeaways, key quotes & summary notes",
    category: "Widgets",
    keywords: ["reading", "book", "article", "rating", "quote", "summary", "widget"],
    icon: <BookOpen className="h-4 w-4 text-indigo-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("reading");
    },
  },
  {
    title: "Color Palette",
    description: "HEX swatch palette with one-click copy to clipboard",
    category: "Widgets",
    keywords: ["palette", "color", "hex", "swatches", "design", "rgb", "widget"],
    icon: <Palette className="h-4 w-4 text-pink-500" />,
    command: (_editor, onAddWidget) => {
      onAddWidget?.("palette");
    },
  },
];

interface SlashMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAddWidget?: (type: WidgetType) => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  editor,
  isOpen,
  onClose,
  position,
  onAddWidget,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ITEMS;
    return ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          // Delete slash character
          editor.commands.deleteRange({
            from: editor.state.selection.from - 1,
            to: editor.state.selection.from,
          });
          item.command(editor, onAddWidget);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredItems, editor, onClose, onAddWidget]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 w-72 overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95"
      style={{
        top: `${Math.min(position.top, window.innerHeight - 360)}px`,
        left: `${Math.min(position.left, window.innerWidth - 300)}px`,
      }}
    >
      <div className="px-2.5 py-1.5 border-b border-border/50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Type to filter blocks or widgets..."
          autoFocus
          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-0.5 p-1">
        {filteredItems.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No matching blocks or widgets
          </div>
        ) : (
          filteredItems.map((item, index) => {
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
                  item.command(editor, onAddWidget);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-left transition-colors cursor-pointer",
                  isSelected
                    ? "bg-accent text-accent-foreground shadow-2xs"
                    : "text-foreground hover:bg-muted/70"
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-surface shadow-2xs">
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold truncate">{item.title}</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-muted-foreground/70 shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
