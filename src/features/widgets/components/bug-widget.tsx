import React, { useState } from "react";
import { Plus, Bug, Trash2, ArrowRight } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

type Severity = "P0" | "P1" | "P2";
type BugStatus = "Triage" | "In Flight" | "Resolved";

interface BugWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export const BugWidget: React.FC<BugWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [title, setTitle] = useState("Window shade roll up animation glitch");
  const [severity, setSeverity] = useState<Severity>("P1");
  const [status, setStatus] = useState<BugStatus>("In Flight");
  const [reproCount, setReproCount] = useState(3);

  const [steps, setSteps] = useState<string[]>([
    "Open floating stash window",
    "Click the chevron window shade button in header",
    "Observe titlebar dimensions during blur animation",
  ]);
  const [newStep, setNewStep] = useState("");

  const [expected, setExpected] = useState("Smooth 38px titlebar with frosted glass blur");
  const [actual, setActual] = useState("Sudden jump if monitor scaling exceeds 150%");

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps((prev) => [...prev, newStep.trim()]);
    setNewStep("");
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNextStatus = () => {
    if (status === "Triage") setStatus("In Flight");
    else if (status === "In Flight") setStatus("Resolved");
    else setStatus("Triage");
  };

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const stepLines = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const summary = `\n### 🐛 Bug Report — [${severity}] ${title}\n*Status: ${status} • Repro Runs: ${reproCount} attempts*\n\n**Steps to Reproduce:**\n${stepLines}\n\n**Expected:** ${expected}\n**Actual:** ${actual}\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Banner: Title, Severity Pills, Status */}
      <div className="flex flex-col gap-2 rounded-xl bg-card border border-border/70 p-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs transition-colors",
                severity === "P0" && "bg-rose-500/20 text-rose-500",
                severity === "P1" && "bg-amber-500/20 text-amber-500",
                severity === "P2" && "bg-blue-500/20 text-blue-500"
              )}
            >
              <Bug className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-primary text-xs flex-1 truncate"
            />
          </div>

          <button
            type="button"
            onClick={handleNextStatus}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shadow-2xs cursor-pointer",
              status === "Triage" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
              status === "In Flight" && "bg-blue-500/15 text-blue-400 border border-blue-500/30",
              status === "Resolved" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            )}
          >
            <span>{status}</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-60" />
          </button>
        </div>

        {/* Severity Selector & Repro Stepper */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Severity:</span>
            {(["P0", "P1", "P2"] as Severity[]).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={cn(
                  "px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-all cursor-pointer",
                  severity === sev
                    ? sev === "P0"
                      ? "bg-rose-500 text-white shadow-xs shadow-rose-500/30"
                      : sev === "P1"
                      ? "bg-amber-500 text-black shadow-xs shadow-amber-500/30"
                      : "bg-blue-500 text-white shadow-xs shadow-blue-500/30"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Repro Runs:</span>
            <div className="flex items-center rounded-lg border border-border bg-background/60 p-0.5">
              <button
                type="button"
                onClick={() => setReproCount((c) => Math.max(0, c - 1))}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                -
              </button>
              <span className="w-6 text-center font-mono font-semibold text-[11px] text-foreground">
                {reproCount}
              </span>
              <button
                type="button"
                onClick={() => setReproCount((c) => c + 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Steps to Reproduce */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground">Steps to Reproduce</span>
          <span className="text-[10px] text-muted-foreground">{steps.length} steps</span>
        </div>

        <div className="space-y-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-mono font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="text-xs text-foreground truncate">{step}</span>
              </div>
              <button
                type="button"
                onClick={() => removeStep(idx)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded"
                title="Remove step"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-1.5 pt-0.5">
            <input
              type="text"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
              placeholder="Add step... (press Enter)"
              className="flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={addStep}
              disabled={!newStep.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500 text-white font-semibold disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Expected vs Actual */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
            Expected Behavior
          </label>
          <textarea
            rows={2}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none shadow-2xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">
            Actual Behavior
          </label>
          <textarea
            rows={2}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none shadow-2xs"
          />
        </div>
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert Bug Report"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
