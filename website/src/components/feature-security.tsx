import React from "react";
import { AlertTriangle, CheckCircle2, Heart } from "lucide-react";

export const FeatureSecurity: React.FC = () => {
  return (
    <section id="security" className="py-20 sm:py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column: Category Pills, Title, Description, Dark Pill Button */}
          <div className="text-left">
            {/* Squircle Badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-pink-500/20 text-pink-400 text-[10px]">
                  ♥
                </div>
                <span>Evals</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-yellow-500/20 text-yellow-400 text-[10px]">
                  ▲
                </div>
                <span>Alerts</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Catch bad answers
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              Check your agents' responses and get alerted when quality drops.
            </p>

            {/* Dark Pill Button */}
            <div className="mt-6">
              <a
                href="#download"
                className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Explore evals
              </a>
            </div>
          </div>

          {/* Right Column: Scatter Plot Chart + Overlaid Judge Fail Card */}
          <div className="relative">
            {/* Background Scatter Plot Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between text-xs mb-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                  <span className="font-medium text-zinc-200">Helpfulness</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  <span className="font-mono text-zinc-300">56</span> scored{" "}
                  <span className="font-mono text-emerald-400 font-medium">84% pass</span>
                </div>
              </div>

              {/* Scatter Plot Chart */}
              <div className="relative h-44 pl-8 pb-6 border-b border-white/[0.06]">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-mono text-zinc-500">
                  <span>1.0</span>
                  <span>0.5</span>
                  <span>0.0</span>
                </div>

                {/* Threshold line at 0.70 */}
                <div className="absolute inset-x-8 top-[30%] border-b border-dashed border-rose-500/40 z-0">
                  <span className="absolute right-0 -top-4 text-[9px] font-mono text-rose-400">
                    0.70
                  </span>
                </div>

                {/* Plot Points Area */}
                <div className="relative h-full w-full">
                  {/* Passing Green Points (Clustered > 0.7) */}
                  {[
                    { left: "5%", top: "15%" },
                    { left: "8%", top: "22%" },
                    { left: "12%", top: "12%" },
                    { left: "16%", top: "18%" },
                    { left: "20%", top: "25%" },
                    { left: "24%", top: "10%" },
                    { left: "28%", top: "14%" },
                    { left: "32%", top: "28%" },
                    { left: "50%", top: "16%" },
                    { left: "54%", top: "12%" },
                    { left: "58%", top: "22%" },
                    { left: "62%", top: "15%" },
                    { left: "66%", top: "18%" },
                    { left: "70%", top: "24%" },
                    { left: "74%", top: "10%" },
                    { left: "78%", top: "15%" },
                    { left: "82%", top: "20%" },
                    { left: "86%", top: "14%" },
                    { left: "90%", top: "22%" },
                  ].map((pt, i) => (
                    <span
                      key={i}
                      style={{ left: pt.left, top: pt.top }}
                      className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    />
                  ))}

                  {/* Failing Red Points (Below 0.7) */}
                  {[
                    { left: "36%", top: "45%" },
                    { left: "40%", top: "40%" },
                    { left: "44%", top: "48%" },
                    { left: "48%", top: "42%" },
                  ].map((pt, i) => (
                    <span
                      key={i}
                      style={{ left: pt.left, top: pt.top }}
                      className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    />
                  ))}
                </div>
              </div>

              {/* X-axis timestamps */}
              <div className="flex justify-between pl-8 pt-2 text-[10px] font-mono text-zinc-500">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
              </div>
            </div>

            {/* Overlaid Floating Judge Fail Card (Bottom Right, exact Foglamp position) */}
            <div className="absolute -bottom-8 -right-3 sm:-right-6 z-10 w-72 sm:w-80 rounded-2xl border border-white/[0.12] bg-[#141418]/95 p-4 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <span className="text-pink-400 text-xs">♥</span>
                  <span>Judge</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>Fail</span>
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300 block mb-0.5">Judge's reason</span>
                  <p className="leading-relaxed">
                    Restates the status without checking the order. Gives no reason for the delay and no next step.
                  </p>
                </div>

                {/* Bad response quote */}
                <div className="rounded-lg bg-black/50 p-2.5 text-[11px] font-mono text-zinc-400 border border-white/[0.06] leading-relaxed">
                  "Your order is processing. Orders can take time. Please wait and check back later."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
