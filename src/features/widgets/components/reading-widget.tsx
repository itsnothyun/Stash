import React, { useState } from "react";
import { Plus, Star, BookOpen, Quote, Trash2 } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface ReadingWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export const ReadingWidget: React.FC<ReadingWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [title, setTitle] = useState("Designing Data-Intensive Applications");
  const [author, setAuthor] = useState("Martin Kleppmann");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [progressPct, setProgressPct] = useState(68);
  const [quote, setQuote] = useState(
    "A reliable system is one that continues to work correctly even when things go wrong."
  );

  const [takeaways, setTakeaways] = useState<string[]>([
    "Reliability vs Scalability vs Maintainability trade-offs",
    "SSTables and LSM-Trees power modern high-throughput storage engines",
    "Eventual consistency requires careful convergence semantics",
  ]);
  const [newTakeaway, setNewTakeaway] = useState("");

  const addTakeaway = () => {
    if (!newTakeaway.trim()) return;
    setTakeaways((prev) => [...prev, newTakeaway.trim()]);
    setNewTakeaway("");
  };

  const removeTakeaway = (idx: number) => {
    setTakeaways((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const takeawayLines = takeaways.map((t) => `- [ ] ${t}`).join("\n");
    const summary = `\n### 📖 Book Summary — ${title}\n*Author: ${author} • Rating: ${rating}/5 Stars • Progress: ${progressPct}%*\n\n> "${quote}"\n\n**Key Takeaways:**\n${takeawayLines}\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Banner: Book Title, Author, Star Rating */}
      <div className="flex flex-col gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-indigo-500 text-xs truncate"
              />
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name..."
                className="bg-transparent text-[10px] text-muted-foreground focus:outline-none border-b border-transparent focus:border-indigo-500 truncate"
              />
            </div>
          </div>

          {/* Interactive 5-Star Rating */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating ?? rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="p-0.5 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      active
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading Progress Slider */}
        <div className="space-y-1 pt-1 border-t border-indigo-500/20">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              Reading Progress
            </span>
            <span className="font-mono font-bold text-indigo-400">{progressPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progressPct}
            onChange={(e) => setProgressPct(Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Standout Quote Callout */}
      <div className="relative rounded-lg border border-border bg-background/60 p-2.5 shadow-2xs space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Quote className="h-3 w-3 text-indigo-400" />
          <span>Standout Pull Quote</span>
        </div>
        <textarea
          rows={2}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="w-full bg-transparent text-xs text-foreground italic focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Key Takeaways */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground">Key Takeaways</span>
          <span className="text-[10px] text-muted-foreground">{takeaways.length} points</span>
        </div>

        <div className="space-y-1">
          {takeaways.map((point, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-xs text-foreground truncate">{point}</span>
              </div>
              <button
                type="button"
                onClick={() => removeTakeaway(idx)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded"
                title="Remove takeaway"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-1.5 pt-0.5">
            <input
              type="text"
              value={newTakeaway}
              onChange={(e) => setNewTakeaway(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTakeaway()}
              placeholder="Add key takeaway... (press Enter)"
              className="flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={addTakeaway}
              disabled={!newTakeaway.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white font-semibold disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert Book Summary"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
