import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkle,
  CheckSquareOffset,
  Tag,
  BookOpen,
  Copy,
  Plus,
  Robot,
  FileText,
} from "@phosphor-icons/react";
import {
  computeReadingStats,
  extractHeuristicSummary,
  extractHeuristicActionItems,
  extractHeuristicTags,
  checkOllamaStatus,
  queryOllama,
  ReadingStats,
} from "../note-ai";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";

interface NoteAIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  noteText: string;
  onInsertToNote: (text: string) => void;
}

type AIMode = "summary" | "actions" | "tags" | "stats";

export const NoteAIAssistantModal: React.FC<NoteAIAssistantModalProps> = ({
  open,
  onOpenChange,
  noteTitle,
  noteText,
  onInsertToNote,
}) => {
  const [activeMode, setActiveMode] = useState<AIMode>("summary");
  const [ollamaActive, setOllamaActive] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [useOllama, setUseOllama] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<{ text: string; confidence: string }[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [ollamaOutput, setOllamaOutput] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    // Check Ollama daemon
    checkOllamaStatus().then((res) => {
      setOllamaActive(res.available);
      setOllamaModels(res.models);
      if (res.models.length > 0) {
        setSelectedModel(res.models[0]);
      }
    });

    // Run offline heuristics
    const computedStats = computeReadingStats(noteText);
    setStats(computedStats);

    const summaries = extractHeuristicSummary(noteText, 4);
    setSummaryPoints(summaries);

    const actions = extractHeuristicActionItems(noteText);
    setActionItems(actions);

    const tags = extractHeuristicTags(noteText, 6);
    setSuggestedTags(tags);
  }, [open, noteText]);

  const handleRunOllama = async () => {
    if (!selectedModel) return;
    setLoading(true);
    playClickSound();

    let prompt = "";
    if (activeMode === "summary") {
      prompt = `Provide a concise executive summary with bullet points for this note titled "${noteTitle}":\n\n${noteText}`;
    } else if (activeMode === "actions") {
      prompt = `Extract all tasks, deliverables, and actionable items from this note as a markdown checklist (- [ ] task):\n\n${noteText}`;
    } else if (activeMode === "tags") {
      prompt = `Suggest 5 concise lowercase hashtag keywords for organizing this note:\n\n${noteText}`;
    }

    try {
      const response = await queryOllama("http://localhost:11434", selectedModel, prompt);
      setOllamaOutput(response);
    } catch {
      toast.error("Ollama query failed", "Check that the local daemon is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (textToInsert: string) => {
    playClickSound();
    onInsertToNote(`\n\n${textToInsert}\n`);
    toast.success("Inserted into stash", "Content added to your active note.");
    onOpenChange(false);
  };

  const handleCopy = (textToCopy: string) => {
    playClickSound();
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard", "Ready to paste anywhere.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[92vw] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
        <DialogHeader className="p-4 pr-12 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex min-w-0 items-center space-x-2.5">
            <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkle className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Stash Copilot & Note Intelligence
              </DialogTitle>
              <div className="hidden text-xs text-muted-foreground sm:block">
                100% Offline heuristics • Optional Local Ollama LLM
              </div>
            </div>
          </div>

          {/* Local LLM indicator */}
          <div className="hidden shrink-0 items-center space-x-1.5 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 sm:flex">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                ollamaActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
              )}
            />
            <span className="text-muted-foreground">
              {ollamaActive ? `Ollama Active (${ollamaModels.length} models)` : "Offline Heuristics Engine"}
            </span>
          </div>
        </DialogHeader>

        <div className="p-3 space-y-4 sm:p-4">
          {/* Tab Selection */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-muted/60 border border-border">
            {(
              [
                { id: "summary", label: "Executive Summary", icon: FileText },
                { id: "actions", label: "Action Items", icon: CheckSquareOffset },
                { id: "tags", label: "Smart Tags", icon: Tag },
                { id: "stats", label: "Writing Insights", icon: BookOpen },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveMode(tab.id);
                    setOllamaOutput("");
                  }}
                  className={cn(
                    "flex-1 shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-all",
                    activeMode === tab.id
                      ? "bg-background text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" weight="bold" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode Specific Body */}
          <div className="min-h-[220px] rounded-xl bg-card border border-border p-4 flex flex-col justify-between">
            {activeMode === "summary" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Key Points & Takeaways</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Ranked by sentence prominence
                  </span>
                </div>

                {useOllama && ollamaOutput ? (
                  <div className="p-3 rounded-lg bg-muted/40 text-xs text-foreground whitespace-pre-wrap font-sans">
                    {ollamaOutput}
                  </div>
                ) : summaryPoints.length > 0 ? (
                  <ul className="space-y-2">
                    {summaryPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    Note text is too brief to extract meaningful summary points.
                  </p>
                )}
              </div>
            )}

            {activeMode === "actions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Detected Action Items</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {actionItems.length} tasks discovered
                  </span>
                </div>

                {useOllama && ollamaOutput ? (
                  <div className="p-3 rounded-lg bg-muted/40 text-xs text-foreground whitespace-pre-wrap font-sans">
                    {ollamaOutput}
                  </div>
                ) : actionItems.length > 0 ? (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground"
                      >
                        <CheckSquareOffset className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 truncate">{item.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No explicit imperative action triggers found in note text.
                  </p>
                )}
              </div>
            )}

            {activeMode === "tags" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Recommended Tags</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Based on keyword occurrence
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleInsert(`#${tag} `)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex items-center space-x-1"
                    >
                      <Tag className="h-3 w-3" />
                      <span>#{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMode === "stats" && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-lg font-bold text-foreground">{stats.words}</div>
                  <div className="text-[11px] text-muted-foreground">Word Count</div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-lg font-bold text-foreground">{stats.characters}</div>
                  <div className="text-[11px] text-muted-foreground">Characters</div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-lg font-bold text-foreground">{stats.readingTimeMinutes} min</div>
                  <div className="text-[11px] text-muted-foreground">Reading Time</div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-sm font-bold text-foreground truncate">{stats.estimatedGradeLevel}</div>
                  <div className="text-[11px] text-muted-foreground">Readability Level</div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
              {ollamaActive && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg bg-muted border border-border text-foreground"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setUseOllama(true);
                      handleRunOllama();
                    }}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border flex items-center space-x-1"
                  >
                    <Robot className="h-3.5 w-3.5 text-primary" />
                    <span>{loading ? "Thinking..." : "Run via Ollama"}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                {activeMode === "summary" && (
                  <>
                    <button
                      onClick={() => handleCopy(summaryPoints.map((p) => `• ${p}`).join("\n"))}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center space-x-1 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() =>
                        handleInsert(
                          `### 📌 Summary\n${summaryPoints.map((p) => `- ${p}`).join("\n")}`
                        )
                      }
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-1 shadow-xs transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" weight="bold" />
                      <span>Append to Note</span>
                    </button>
                  </>
                )}

                {activeMode === "actions" && (
                  <button
                    onClick={() =>
                      handleInsert(
                        `### ✅ Action Items\n${actionItems.map((a) => `- [ ] ${a.text}`).join("\n")}`
                      )
                    }
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" weight="bold" />
                    <span>Append Tasks to Note</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
