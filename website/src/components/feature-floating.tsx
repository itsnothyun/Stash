import React from "react";
import { Mic, ArrowUp, Search, Check } from "lucide-react";

export const FeatureFloating: React.FC = () => {
  return (
    <section id="floating" className="py-20 sm:py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column: Category Pills, Title, Description, Dark Pill Button */}
          <div className="text-left">
            {/* Squircle Badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-rose-500/20 text-rose-400 text-[10px]">
                  ●
                </div>
                <span>Traces</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-blue-500/20 text-blue-400 text-[10px]">
                  ◆
                </div>
                <span>Sessions</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <span>Agents</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              See what happened
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              Follow every model call and tool call, with the prompts and responses in one place.
            </p>

            {/* Dark Pill Button */}
            <div className="mt-6">
              <a
                href="#download"
                className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Explore traces
              </a>
            </div>
          </div>

          {/* Right Column: Waterfall Timeline Chart + Overlaid Floating Chat Card */}
          <div className="relative">
            {/* Background Waterfall Timeline Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-white/[0.06] mb-4">
                <span className="font-medium text-zinc-200">Trace</span>
                <span className="text-[10px] font-mono text-zinc-500">0s</span>
              </div>

              {/* Waterfall Spans */}
              <div className="space-y-3 text-xs">
                {/* Span 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">⌵</span>
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">support-triage</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">5.84s</span>
                </div>
                <div className="pl-6">
                  <div className="h-1.5 w-48 rounded-full bg-purple-500/70" />
                </div>

                {/* Span 2 */}
                <div className="flex items-center justify-between pl-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">classify-intent</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-zinc-400">
                    <div>920ms</div>
                    <div className="text-zinc-600 text-[9px]">$0.0011 · 612</div>
                  </div>
                </div>
                <div className="pl-12">
                  <div className="h-1.5 w-24 rounded-full bg-cyan-400" />
                </div>

                {/* Span 3 */}
                <div className="flex items-center justify-between pl-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">fetch-order</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">620ms</span>
                </div>
                <div className="pl-24">
                  <div className="h-1.5 w-16 rounded-full bg-blue-400" />
                </div>

                {/* Span 4 */}
                <div className="flex items-center justify-between pl-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">search-knowledge-base</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">1.46s</span>
                </div>
                <div className="pl-32">
                  <div className="h-1.5 w-32 rounded-full bg-amber-400" />
                </div>

                {/* Span 5 */}
                <div className="flex items-center justify-between pl-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">rerank-results</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-zinc-400">
                    <div>1.08s</div>
                    <div className="text-zinc-600 text-[9px]">$0.0042 · 1.5K</div>
                  </div>
                </div>
                <div className="pl-44">
                  <div className="h-1.5 w-20 rounded-full bg-rose-400" />
                </div>

                {/* Span 6 */}
                <div className="flex items-center justify-between pl-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">draft-reply</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-zinc-400">
                    <div>2.46s</div>
                    <div className="text-zinc-600 text-[9px]">$0.0089 · 3K</div>
                  </div>
                </div>
                <div className="pl-48">
                  <div className="h-1.5 w-28 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Overlaid Floating Chat Card (Top Right, exact Foglamp position) */}
            <div className="absolute -top-12 -right-3 sm:-right-6 z-10 w-72 sm:w-80 rounded-2xl border border-white/[0.12] bg-[#141418]/95 p-4 shadow-2xl backdrop-blur-xl">
              {/* User Prompt Bubble */}
              <div className="flex justify-end mb-3">
                <div className="rounded-xl bg-zinc-800/80 px-3 py-2 text-xs text-zinc-200 max-w-[85%]">
                  <p className="leading-snug">
                    Hey, order #48213 still says "processing" after 5 days. Can you check what's going on?
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-zinc-500 font-mono">
                    <span>10:42</span>
                    <Check className="h-2.5 w-2.5 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Agent Reply Bubble */}
              <div className="flex items-start gap-2 mb-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <div className="space-y-2 text-xs text-zinc-300">
                  <p className="leading-relaxed">
                    I looked into order #48213. It was held by an address-verification flag and cleared this morning. It's now packed and ships today, with delivery expected Tuesday.
                  </p>

                  {/* Tool chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-400 border border-white/[0.06]">
                      <Search className="h-2.5 w-2.5" />
                      <span>fetch-order</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-400 border border-white/[0.06]">
                      <Search className="h-2.5 w-2.5" />
                      <span>search-knowledge-base</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/50 px-3 py-2 text-xs text-zinc-500">
                <span>Message Acme Support</span>
                <div className="flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 text-zinc-400" />
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
                    <ArrowUp className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
