import React, { useState } from "react";
import { ChevronDown, Search, ArrowRight, Sparkles, HelpCircle } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What makes Stash different from Sticky Notes, Apple Notes, or Obsidian?",
    a: "Unlike system sticky notes, Stash is packed with native micro-widgets (live fiat/crypto swaps, focus pomodoros, tally counters, kanban boards) and full Markdown support. Unlike heavy knowledge bases, Stash is instant (<25ms cold start, <35MB RAM) and floats right above your workflow with double-click window shading.",
  },
  {
    q: "Is Stash truly 100% offline-first?",
    a: "Yes. All your notes, task checklists, and revision histories are stored locally in an embedded SQLite database on your machine. Stash has zero telemetry, zero tracking, and never requires an account or internet connection to function.",
  },
  {
    q: "Where are my notes and settings saved on disk?",
    a: "On Windows, data is stored in %APPDATA%\\com.stash.app\\stash.db. On macOS, data is stored in ~/Library/Application Support/com.stash.app/stash.db. You can back up or sync this single SQLite file anytime.",
  },
  {
    q: "How does the live Currency & Token Swap widget work without an account?",
    a: "The Swap widget periodically queries public, rate-unlimited ticker feeds (such as the European Central Bank and public CoinGecko endpoints) when connected. If offline, it smoothly falls back to the latest cached rates with zero interruption.",
  },
  {
    q: "Can I export my notes as standard Markdown?",
    a: "Yes. Every stash can be exported as clean GitHub Flavored Markdown (.md) with one click from the kebab menu or context menu. You can also import existing markdown files directly.",
  },
  {
    q: "What are the system requirements and memory footprint?",
    a: "Stash runs on Windows 10/11 (64-bit and ARM64) and macOS 12+ (Universal for Apple Silicon M1-M4 & Intel). Thanks to Tauri and Rust, memory usage hovers around 30-40MB — a fraction of typical Electron-based apps.",
  },
];

const PRESET_QUERIES = [
  { label: "Shortcuts", answer: "Global shortcuts: Ctrl/Cmd+Shift+S (Quick Stash), Ctrl/Cmd+P (Keep on top), Ctrl/Cmd+D (Duplicate), Ctrl/Cmd+E (Archive)." },
  { label: "PIN Lock", answer: "You can protect any note with a 4-digit PIN via the titlebar menu. The stash locks automatically when the window closes." },
  { label: "Window Shade", answer: "Double-click any stash titlebar to roll it up into a compact 36px bar that floats unobtrusively above your code or browser." },
  { label: "Markdown", answer: "Full Tiptap WYSIWYG & Markdown editor with task lists, code blocks, tables, export, and historical revision rollback." },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const [queryResponse, setQueryResponse] = useState<string | null>(null);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;

    if (q.includes("shortcut") || q.includes("hotkey") || q.includes("key")) {
      setQueryResponse(PRESET_QUERIES[0].answer);
    } else if (q.includes("pin") || q.includes("lock") || q.includes("secret") || q.includes("password")) {
      setQueryResponse(PRESET_QUERIES[1].answer);
    } else if (q.includes("shade") || q.includes("minimize") || q.includes("roll")) {
      setQueryResponse(PRESET_QUERIES[2].answer);
    } else if (q.includes("markdown") || q.includes("tiptap") || q.includes("export") || q.includes("import")) {
      setQueryResponse(PRESET_QUERIES[3].answer);
    } else {
      setQueryResponse(
        `Stash is built with Tauri 2.0 and Rust to give you a native, zero-telemetry desktop scratchpad. You can explore all settings, micro-widgets, and shortcuts directly within the app.`
      );
    }
  };

  return (
    <section id="faq" className="py-20 sm:py-32 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column: Heading */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300 mb-4">
              <HelpCircle className="h-3 w-3" />
              <span>Frequently Asked Questions</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
              Questions & Answers
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Everything you need to know about Stash’s architecture, privacy, offline storage, and widgets.
            </p>
          </div>

          {/* Right Column: Accordion + "Ask Stash" drawer */}
          <div className="space-y-4">
            {/* Accordion Items */}
            <div className="divide-y divide-white/10 border-y border-white/10">
              {FAQS.map((item, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between text-left text-sm sm:text-base font-medium text-foreground hover:opacity-80 transition-opacity cursor-pointer gap-4"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-fadeIn pr-6">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* "Ask Stash" Interactive Inquiry Drawer (Foglamp Style) */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-lg">
              <form onSubmit={handleAsk} className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything else about Stash (e.g. shortcuts, PIN, offline)..."
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white/10 hover:bg-white/20 p-1.5 text-white transition-colors cursor-pointer shrink-0"
                  title="Submit inquiry"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 text-2xs text-muted-foreground">
                <span className="font-mono">Quick topics:</span>
                {PRESET_QUERIES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p.label);
                      setQueryResponse(p.answer);
                    }}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Instant Answer Preview */}
              {queryResponse && (
                <div className="mt-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3.5 text-xs text-emerald-200 animate-fadeIn">
                  <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Stash Assistant</span>
                  </div>
                  <p className="leading-relaxed">{queryResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
