import React, { useMemo, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";
import { computeLineDiff } from "@/features/stash/diff-utils";

interface DevToolsWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

type DevToolTab = "json" | "regex" | "diff";

export const DevToolsWidget: React.FC<DevToolsWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [tab, setTab] = useState<DevToolTab>("json");

  // JSON Tool State
  const [jsonInput, setJsonInput] = useState(`{"name":"Stash","version":"0.1.1","offline":true,"tags":["desktop","tauri","react"]}`);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Regex Tool State
  const [regexPattern, setRegexPattern] = useState(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}`);
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexText, setRegexText] = useState("Send notes to team@stash.app and support@stash.app for questions.");
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Diff Tool State
  const [diffOriginal, setDiffOriginal] = useState("const count = 10;\nconst limit = 100;");
  const [diffModified, setDiffModified] = useState("const count = 15;\nconst limit = 100;\nconst active = true;");

  const diff = useMemo(() => computeLineDiff(diffOriginal, diffModified), [diffOriginal, diffModified]);

  // Format JSON
  const handleFormatJson = (indent = 2) => {
    playClickSound();
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, indent));
      setJsonError(null);
      toast.success("JSON Validated & Formatted");
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleMinifyJson = () => {
    playClickSound();
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // Test Regex
  const handleTestRegex = () => {
    playClickSound();
    try {
      const re = new RegExp(regexPattern, regexFlags);
      // Without the g flag, String.match returns capture groups, not separate matches.
      const firstMatch = re.global ? null : re.exec(regexText);
      const matches = re.global ? regexText.match(re) || [] : firstMatch ? [firstMatch[0]] : [];
      setRegexMatches(matches);
      setRegexError(null);
    } catch (err: any) {
      setRegexError(err.message);
      setRegexMatches([]);
    }
  };

  const handleInsert = () => {
    playClickSound();
    if (tab === "json") {
      onInsertToNote(`\`\`\`json\n${jsonInput}\n\`\`\`\n`);
    } else if (tab === "regex") {
      onInsertToNote(
        `### 🔍 Regex Match Report\n- **Pattern**: \`/${regexPattern}/${regexFlags}\`\n- **Matches (${regexMatches.length})**:\n${regexMatches.map((m) => `  - \`${m}\``).join("\n")}\n`
      );
    } else {
      const diffText = diff.lines
        .map((l) => `${l.type === "added" ? "+" : l.type === "removed" ? "-" : " "} ${l.text}`)
        .join("\n");
      onInsertToNote(`### 📝 Diff Snapshot\n\`\`\`diff\n${diffText}\n\`\`\`\n`);
    }
    toast.success("Inserted into note");
  };

  return (
    <div className={cn("flex flex-col space-y-2.5 p-3 rounded-xl bg-card border border-border shadow-xs", className)}>
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-muted/60 p-0.5 rounded-lg border border-border/80">
          {(
            [
              { id: "json", label: "JSON" },
              { id: "regex", label: "Regex" },
              { id: "diff", label: "Diff" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                tab === t.id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleInsert}
          className="px-2 py-1 text-[11px] font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 flex items-center space-x-1"
        >
          <Plus className="h-3 w-3" weight="bold" />
          <span>Insert</span>
        </button>
      </div>

      {/* JSON TAB */}
      {tab === "json" && (
        <div className="space-y-2">
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setJsonError(null);
            }}
            rows={5}
            spellCheck={false}
            className="w-full p-2 rounded-lg bg-neutral-950 font-mono text-[11px] text-neutral-200 border border-neutral-800 focus:outline-none"
          />
          {jsonError && (
            <div className="text-[10px] text-rose-400 font-mono bg-rose-950/30 p-1.5 rounded-md border border-rose-800/40">
              {jsonError}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleFormatJson(2)}
              className="px-2 py-1 text-xs rounded-md bg-muted text-foreground hover:bg-muted/80 border border-border"
            >
              Prettify (2 spaces)
            </button>
            <button
              onClick={handleMinifyJson}
              className="px-2 py-1 text-xs rounded-md bg-muted text-foreground hover:bg-muted/80 border border-border"
            >
              Minify
            </button>
          </div>
        </div>
      )}

      {/* REGEX TAB */}
      {tab === "regex" && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-muted-foreground font-mono">/</span>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="pattern"
              className="flex-1 px-2 py-1 text-xs font-mono rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200"
            />
            <span className="text-xs text-muted-foreground font-mono">/</span>
            <input
              type="text"
              value={regexFlags}
              onChange={(e) => setRegexFlags(e.target.value)}
              placeholder="flags"
              className="w-10 px-1.5 py-1 text-xs font-mono rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200 text-center"
            />
            <button
              onClick={handleTestRegex}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground"
            >
              Test
            </button>
          </div>

          <textarea
            value={regexText}
            onChange={(e) => setRegexText(e.target.value)}
            rows={3}
            placeholder="Test string..."
            className="w-full p-2 rounded-lg bg-neutral-950 font-mono text-[11px] text-neutral-200 border border-neutral-800 focus:outline-none"
          />

          {regexError && (
            <div className="text-[10px] text-rose-400 font-mono">{regexError}</div>
          )}

          {regexMatches.length > 0 && (
            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 font-mono space-y-1">
              <div>Found {regexMatches.length} match{regexMatches.length > 1 ? "es" : ""}:</div>
              <div className="flex flex-wrap gap-1">
                {regexMatches.map((m, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/50">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIFF TAB */}
      {tab === "diff" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-muted-foreground font-medium mb-1">Original</div>
              <textarea
                value={diffOriginal}
                onChange={(e) => setDiffOriginal(e.target.value)}
                rows={4}
                className="w-full p-1.5 rounded-lg bg-neutral-950 font-mono text-[10px] text-neutral-300 border border-neutral-800"
              />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-medium mb-1">Modified</div>
              <textarea
                value={diffModified}
                onChange={(e) => setDiffModified(e.target.value)}
                rows={4}
                className="w-full p-1.5 rounded-lg bg-neutral-950 font-mono text-[10px] text-neutral-300 border border-neutral-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">+{diff.stats.added}</span>
            <span className="text-rose-600 dark:text-rose-400">-{diff.stats.removed}</span>
            <span className="text-muted-foreground">{diff.stats.unchanged} unchanged</span>
          </div>
          <div className="max-h-40 overflow-auto rounded-lg bg-neutral-950 border border-neutral-800 p-1.5 font-mono text-[10px]">
            {diff.lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap px-1",
                  line.type === "added" && "bg-emerald-500/15 text-emerald-300",
                  line.type === "removed" && "bg-rose-500/15 text-rose-300",
                  line.type === "unchanged" && "text-neutral-400"
                )}
              >
                {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
