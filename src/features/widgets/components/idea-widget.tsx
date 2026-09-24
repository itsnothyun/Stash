import React, { useState } from "react";
import { Check, Lightbulb, RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface IdeaWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

const PALETTES = [
  ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#8B5CF6"],
  ["#06B6D4", "#3B82F6", "#8B5CF6", "#D946EF", "#F43F5E"],
  ["#84CC16", "#10B981", "#14B8A6", "#0EA5E9", "#6366F1"],
  ["#F97316", "#F59E0B", "#EAB308", "#84CC16", "#10B981"],
];

export const IdeaWidget: React.FC<IdeaWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [concept, setConcept] = useState("AI-powered ephemeral scratchpad with component widgets");
  const [confidence, setConfidence] = useState(85);
  const [validationInterviews, setValidationInterviews] = useState(12);

  const [paletteIndex, setPaletteIndex] = useState(0);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const [pros, setPros] = useState("Zero context-switching, tactile aesthetic controls");
  const [cons, setCons] = useState("Needs robust cross-platform floating window management");

  const currentPalette = PALETTES[paletteIndex];

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  };

  const nextPalette = () => {
    setPaletteIndex((i) => (i + 1) % PALETTES.length);
  };

  const getConfidenceBadge = (val: number) => {
    if (val >= 80) return { label: "High Conviction", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" };
    if (val >= 50) return { label: "Promising Signal", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" };
    return { label: "Early Hypothesis", color: "text-blue-400 bg-blue-500/15 border-blue-500/30" };
  };

  const badge = getConfidenceBadge(confidence);

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const hexList = currentPalette.join(", ");
    const summary = `\n### 💡 Idea Blueprint — ${concept}\n*Confidence: ${confidence}% (${badge.label}) • Customer Validations: ${validationInterviews}*\n\n**Pros:** ${pros}\n**Cons:** ${cons}\n**Palette:** \`${hexList}\`\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Banner: Concept & Confidence */}
      <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <Lightbulb className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-amber-500 text-xs flex-1 truncate"
            />
          </div>

          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs", badge.color)}>
            {badge.label}
          </span>
        </div>

        {/* Confidence Slider & Validation Counter */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-500/20">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-semibold text-muted-foreground uppercase">Hypothesis Confidence</span>
              <span className="font-mono font-bold text-amber-500">{confidence}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">User Validations:</span>
            <div className="flex items-center rounded-lg border border-border bg-background/60 p-0.5">
              <button
                type="button"
                onClick={() => setValidationInterviews((c) => Math.max(0, c - 1))}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                -
              </button>
              <span className="w-6 text-center font-mono font-semibold text-[11px] text-foreground">
                {validationInterviews}
              </span>
              <button
                type="button"
                onClick={() => setValidationInterviews((c) => c + 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Color Theme Palette */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-pink-500" />
            <span>Theme Swatches (Click to copy)</span>
          </span>
          <button
            type="button"
            onClick={nextPalette}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {currentPalette.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => handleCopyHex(hex)}
              className="group flex flex-col items-center gap-1 p-1 rounded-lg border border-border bg-background/60 hover:scale-105 transition-all shadow-2xs cursor-pointer"
            >
              <div
                className="h-6 w-full rounded-md shadow-inner flex items-center justify-center"
                style={{ backgroundColor: hex }}
              >
                {copiedHex === hex && <Check className="h-3 w-3 text-white drop-shadow stroke-[3]" />}
              </div>
              <span className="font-mono text-[9px] text-muted-foreground group-hover:text-foreground">
                {hex}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
            <ThumbsUp className="h-2.5 w-2.5" />
            <span>Key Advantages</span>
          </label>
          <textarea
            rows={2}
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none shadow-2xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-1">
            <ThumbsDown className="h-2.5 w-2.5" />
            <span>Risks & Trade-offs</span>
          </label>
          <textarea
            rows={2}
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none shadow-2xs"
          />
        </div>
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert Idea Blueprint"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
