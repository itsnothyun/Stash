import React, { useState } from "react";
import { Plus, X, ArrowRight, ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface KanbanCard {
  id: string;
  text: string;
  column: "todo" | "in_progress" | "done";
}

interface KanbanWidgetProps {
  initialCards?: KanbanCard[];
  onInsertToNote?: (text: string) => void;
}

const DEFAULT_CARDS: KanbanCard[] = [
  { id: "1", text: "Research specs", column: "done" },
  { id: "2", text: "Draft prototype", column: "in_progress" },
  { id: "3", text: "Ship update", column: "todo" },
];

export const KanbanWidget: React.FC<KanbanWidgetProps> = ({
  initialCards = DEFAULT_CARDS,
  onInsertToNote,
}) => {
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);
  const [newText, setNewText] = useState("");
  const [activeCol, setActiveCol] = useState<"todo" | "in_progress" | "done">("todo");

  const addCard = () => {
    if (!newText.trim()) return;
    const item: KanbanCard = {
      id: Date.now().toString(),
      text: newText.trim(),
      column: activeCol,
    };
    setCards([...cards, item]);
    setNewText("");
  };

  const moveCard = (id: string, dir: "prev" | "next") => {
    const cols: ("todo" | "in_progress" | "done")[] = ["todo", "in_progress", "done"];
    setCards(
      cards.map((c) => {
        if (c.id !== id) return c;
        const curIdx = cols.indexOf(c.column);
        const nextIdx = dir === "next" ? Math.min(2, curIdx + 1) : Math.max(0, curIdx - 1);
        return { ...c, column: cols[nextIdx] };
      })
    );
  };

  const removeCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  const handleCopySummary = () => {
    if (!onInsertToNote) return;

    const todoCards = cards.filter((c) => c.column === "todo");
    const inProgressCards = cards.filter((c) => c.column === "in_progress");
    const doneCards = cards.filter((c) => c.column === "done");

    const total = cards.length;
    const doneCount = doneCards.length;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const nowStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const todoText =
      todoCards.length > 0
        ? todoCards.map((c) => `- [ ] ${c.text}`).join("\n")
        : "- _No tasks in queue_";

    const inProgressText =
      inProgressCards.length > 0
        ? inProgressCards.map((c) => `- [ ] ⏳ ${c.text}`).join("\n")
        : "- _No tasks in progress_";

    const doneText =
      doneCards.length > 0
        ? doneCards.map((c) => `- [x] ${c.text}`).join("\n")
        : "- _No tasks completed yet_";

    const summary = `\n### 📋 Kanban Board Summary
> *${total} total tasks • ${doneCount} completed (${percent}%) • Logged on ${dateStr} at ${nowStr}*

#### 🟡 To Do (${todoCards.length})
${todoText}

#### 🔵 Doing (${inProgressCards.length})
${inProgressText}

#### 🟢 Done (${doneCards.length})
${doneText}\n`;

    onInsertToNote(summary);
  };

  const columns = [
    { id: "todo", label: "To Do", icon: Circle, color: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { id: "in_progress", label: "Doing", icon: Clock, color: "text-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { id: "done", label: "Done", icon: CheckCircle2, color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ] as const;

  return (
    <div className="flex flex-col gap-2 p-2.5 text-xs">
      {/* Quick Add Bar */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCard()}
          placeholder={`Add to ${activeCol === "todo" ? "To Do" : activeCol === "in_progress" ? "Doing" : "Done"}…`}
          className="flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <select
          value={activeCol}
          onChange={(e) => setActiveCol(e.target.value as any)}
          aria-label="Target column"
          className="rounded-sm border border-border bg-surface px-1.5 py-1 text-2xs text-muted-foreground focus:outline-none"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">Doing</option>
          <option value="done">Done</option>
        </select>
        <button
          onClick={addCard}
          aria-label="Add task card"
          className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.column === col.id);
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-md border border-border/60 bg-muted/20 p-1.5 min-h-[90px]"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Icon className={cn("h-3 w-3", col.color)} />
                  {col.label}
                </span>
                <span className={cn("rounded-full px-1.5 py-0.2 text-[9px] font-mono font-medium", col.badge)}>
                  {colCards.length}
                </span>
              </div>

              <div className="flex flex-col gap-1 mt-1.5 flex-1">
                {colCards.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/60 italic text-center py-2">
                    Empty
                  </span>
                ) : (
                  colCards.map((card) => (
                    <div
                      key={card.id}
                      className="group flex flex-col justify-between rounded border border-border/70 bg-card p-1.5 shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <span className="text-2xs text-foreground leading-snug break-words">
                        {card.text}
                      </span>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30 opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-0.5">
                          {col.id !== "todo" && (
                            <button
                              onClick={() => moveCard(card.id, "prev")}
                              title="Move left"
                              aria-label="Move card left"
                              className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <ArrowLeft className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              onClick={() => moveCard(card.id, "next")}
                              title="Move right"
                              aria-label="Move card right"
                              className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => removeCard(card.id)}
                          title="Delete card"
                          aria-label="Delete card"
                          className="rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insert summary into note button */}
      {onInsertToNote && cards.length > 0 && (
        <WidgetInsertButton
          onInsert={handleCopySummary}
          label="Insert to note"
          insertedLabel="Inserted to note!"
          className="mt-2.5"
        />
      )}
    </div>
  );
};
