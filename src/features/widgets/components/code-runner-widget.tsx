import React, { useState } from "react";
import { Play, Eraser, Plus, Terminal } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";
import { runSnippet } from "../code-runner";

interface CodeRunnerWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

export const CodeRunnerWidget: React.FC<CodeRunnerWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [code, setCode] = useState<string>(
    `// JavaScript / Math Scratchpad\nconst items = [120, 45, 89, 210];\nconst total = items.reduce((a, b) => a + b, 0);\nconsole.log("Calculated Total:", total);\ntotal * 1.12;`
  );
  const [output, setOutput] = useState<string>("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);

  const handleRun = () => {
    playClickSound();
    const startTime = performance.now();
    try {
      const { logs, result } = runSnippet(code);
      const endTime = performance.now();

      let finalOutput = logs.join("\n");
      if (result !== undefined) {
        finalOutput += (finalOutput ? "\n=> " : "=> ") + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result));
      }

      setOutput(finalOutput || "(Execution completed with no return value)");
      setIsError(false);
      setExecutionTime(Math.round((endTime - startTime) * 100) / 100);
    } catch (err: any) {
      const endTime = performance.now();
      setOutput(err?.message || String(err));
      setIsError(true);
      setExecutionTime(Math.round((endTime - startTime) * 100) / 100);
    }
  };

  const handleClear = () => {
    setOutput("");
    setExecutionTime(null);
    setIsError(false);
  };

  const handleInsert = () => {
    playClickSound();
    const snippet = `\`\`\`javascript\n${code}\n\`\`\`\n\n**Output (${executionTime ?? 0}ms):**\n\`\`\`\n${output}\n\`\`\`\n`;
    onInsertToNote(snippet);
    toast.success("Code & output inserted", "Appended to your active note.");
  };

  return (
    <div className={cn("flex flex-col space-y-2.5 p-3 rounded-xl bg-card border border-border shadow-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
          <Terminal className="h-4 w-4 text-emerald-500" />
          <span>Code Sandbox</span>
        </div>
        {executionTime !== null && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {executionTime}ms
          </span>
        )}
      </div>

      {/* Editor Box */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={5}
        spellCheck={false}
        className="w-full p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-neutral-200 border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleRun}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1 transition-colors shadow-xs"
          >
            <Play className="h-3 w-3" weight="bold" />
            <span>Run</span>
          </button>
          <button
            onClick={handleClear}
            title="Clear output"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>

        {output && (
          <button
            onClick={handleInsert}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-medium text-foreground flex items-center space-x-1 transition-colors"
          >
            <Plus className="h-3 w-3" weight="bold" />
            <span>Insert to Note</span>
          </button>
        )}
      </div>

      {/* Output Console */}
      {output && (
        <div
          className={cn(
            "p-2.5 rounded-lg font-mono text-xs whitespace-pre-wrap max-h-36 overflow-y-auto border",
            isError
              ? "bg-rose-950/30 text-rose-300 border-rose-800/40"
              : "bg-neutral-950 text-neutral-300 border-neutral-800"
          )}
        >
          {output}
        </div>
      )}
    </div>
  );
};
