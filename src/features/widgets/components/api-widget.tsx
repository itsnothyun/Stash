import React, { useState } from "react";
import { Check, CopySimple as Copy, ShieldCheck, Binary, Terminal } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "IPC";

interface ApiWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export const ApiWidget: React.FC<ApiWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [method, setMethod] = useState<HttpMethod>("IPC");
  const [endpoint, setEndpoint] = useState("ipc://stash/toggle_window_shade");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Quick base converter state
  const [decInput, setDecInput] = useState("255");

  const hexVal = Number(decInput) ? `0x${Number(decInput).toString(16).toUpperCase()}` : "0x0";
  const binVal = Number(decInput) ? `0b${Number(decInput).toString(2)}` : "0b0";

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpoint).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1200);
  };

  const methodColors: Record<HttpMethod, string> = {
    GET: "bg-foreground text-background",
    POST: "bg-foreground text-background",
    PUT: "bg-foreground text-background",
    DELETE: "bg-foreground text-background",
    IPC: "bg-foreground text-background",
  };

  const handleInsertSummary = () => {
    if (!onInsertToNote) return;
    const summary = `\n### 💻 API & Code Spec\n\`\`\`typescript\n// Method: ${method}\n// Endpoint: ${endpoint}\n// Encryption: AES-256 GCM • Status: 200 OK\n\ninterface StashPayload {\n  action: "shade_toggle";\n  animateDurationMs: 130;\n  preserveAestheticBlur: true;\n}\n\`\`\`\n`;
    onInsertToNote(summary);
  };

  return (
    <div className={cn("flex flex-col gap-3 p-3 text-xs", className)}>
      {/* Top Bar: Method Selector & Endpoint */}
      <div className="flex flex-col gap-2 rounded-xl bg-card border border-border/70 p-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            {(["GET", "POST", "IPC", "PUT"] as HttpMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-all cursor-pointer",
                  method === m
                    ? `${methodColors[m]} shadow-xs`
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-muted/60 border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-foreground" />
            <span>AES-256 GCM</span>
          </div>
        </div>

        {/* Endpoint URL input with 1-click copy */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1 shadow-inner">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1 bg-transparent font-mono text-[11px] text-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedUrl ? (
              <>
                <Check className="h-2.5 w-2.5 text-foreground" weight="bold" />
                <span className="text-foreground">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-2.5 w-2.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Schema / Payload Preview */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Payload Schema
          </span>
          <span className="font-mono text-muted-foreground">JSON / TypeScript</span>
        </div>
        <pre className="p-2 rounded-lg border border-border bg-muted/20 font-mono text-[10px] leading-relaxed text-zinc-300 overflow-x-auto">
{`{
  "endpoint": "${endpoint}",
  "method": "${method}",
  "params": {
    "blurTransition": true,
    "targetHeight": 38
  }
}`}
        </pre>
      </div>

      {/* Quick Base Converter Helper */}
      <div className="rounded-lg border border-border bg-background/60 p-2 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Binary className="h-3 w-3 text-foreground" />
            <span>Quick Base Converter</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">DEC / HEX / BIN</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <label className="text-[9px] text-muted-foreground">Decimal:</label>
            <input
              type="number"
              value={decInput}
              onChange={(e) => setDecInput(e.target.value)}
              className="w-full rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground">Hex:</label>
            <div className="rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-400 truncate">
              {hexVal}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground">Binary:</label>
            <div className="rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400 truncate">
              {binVal}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onInsertToNote && (
        <div className="flex justify-end pt-1">
          <WidgetInsertButton
            onInsert={handleInsertSummary}
            label="Insert API Blueprint"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};
