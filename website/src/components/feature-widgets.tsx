import React from "react";
import { ArrowUpDown, TrendingUp, Calculator, Bell } from "lucide-react";

export const FeatureWidgets: React.FC = () => {
  return (
    <section id="widgets" className="py-20 sm:py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column: Category Pills, Title, Description, Dark Pill Button */}
          <div className="text-left">
            {/* Row of squircle pill badges (Exact Foglamp styling) */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-amber-500/20 text-amber-400 text-[10px]">
                  ●
                </div>
                <span>Agents</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-cyan-500/20 text-cyan-400 text-[10px]">
                  ▲
                </div>
                <span>Workflows</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <span>Customers</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-yellow-500/20 text-yellow-400 text-[10px]">
                  ★
                </div>
                <span>Alerts</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Know where your money goes
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              Track spending by model, agent, and customer. Get alerted when costs rise.
            </p>

            {/* Dark Pill Button */}
            <div className="mt-6">
              <a
                href="#download"
                className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Explore costs
              </a>
            </div>
          </div>

          {/* Right Column: Chart Card + Floating Overlay Pills (Exact Foglamp Visual) */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-2xl">
            {/* Chart Header */}
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
              <span className="font-medium text-zinc-200">Cost over time</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>gpt-5.6-sol</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  <span>claude...</span>
                </span>
              </div>
            </div>

            {/* Vertical Bar Chart with Y-axis */}
            <div className="relative h-44 flex items-end justify-between pl-8 pb-6 border-b border-white/[0.06]">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-mono text-zinc-500">
                <span>$60</span>
                <span>$45</span>
                <span>$30</span>
                <span>$15</span>
                <span>$0</span>
              </div>

              {/* Chart Grid Lines */}
              <div className="absolute inset-x-8 top-0 border-b border-dashed border-white/[0.04]" />
              <div className="absolute inset-x-8 top-1/4 border-b border-dashed border-white/[0.04]" />
              <div className="absolute inset-x-8 top-2/4 border-b border-dashed border-white/[0.04]" />
              <div className="absolute inset-x-8 top-3/4 border-b border-dashed border-white/[0.04]" />

              {/* 18 Vertical Bars with varying heights */}
              {[
                { h: "35%", c: "bg-cyan-500/70" },
                { h: "60%", c: "bg-orange-500/70" },
                { h: "45%", c: "bg-purple-500/70" },
                { h: "80%", c: "bg-cyan-400" },
                { h: "50%", c: "bg-orange-400" },
                { h: "70%", c: "bg-purple-400" },
                { h: "40%", c: "bg-cyan-500/70" },
                { h: "65%", c: "bg-orange-500/70" },
                { h: "55%", c: "bg-purple-500/70" },
                { h: "90%", c: "bg-cyan-400" },
                { h: "45%", c: "bg-orange-400" },
                { h: "75%", c: "bg-purple-400" },
                { h: "30%", c: "bg-cyan-500/70" },
                { h: "85%", c: "bg-orange-500/70" },
                { h: "50%", c: "bg-purple-500/70" },
                { h: "70%", c: "bg-cyan-400" },
                { h: "60%", c: "bg-orange-400" },
                { h: "80%", c: "bg-purple-400" },
              ].map((bar, idx) => (
                <div key={idx} className="relative z-0 w-2.5 rounded-t-sm flex flex-col justify-end h-full">
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-t-sm ${bar.c} transition-all duration-500 hover:brightness-125`}
                  />
                </div>
              ))}
            </div>

            {/* X-axis timestamps */}
            <div className="flex justify-between pl-8 pt-2 text-[10px] font-mono text-zinc-500">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>

            {/* Overlay Floating Card 1 (Top Right) */}
            <div className="absolute right-4 top-4 z-10 w-44 rounded-xl border border-white/[0.1] bg-[#141418]/95 p-2.5 shadow-2xl backdrop-blur-md">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    <span className="text-zinc-300 truncate max-w-[90px]">research-planner</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$318.20</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span className="text-zinc-300 truncate max-w-[90px]">support-triage</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$214.80</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span className="text-zinc-300 truncate max-w-[90px]">code-reviewer</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$196.40</span>
                </div>
              </div>
            </div>

            {/* Overlay Floating Card 2 (Bottom Right) */}
            <div className="absolute right-6 bottom-5 z-10 w-40 rounded-xl border border-white/[0.1] bg-[#141418]/95 p-2.5 shadow-2xl backdrop-blur-md">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-zinc-300">Acme Inc</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$241.60</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span className="text-zinc-300">Globex</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$188.30</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="text-zinc-300">Umbrella</span>
                  </div>
                  <span className="font-mono text-zinc-200 font-medium">$74.20</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
