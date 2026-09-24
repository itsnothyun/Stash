import React, { useState } from "react";
import { Pin, PinOff, Minimize2, Maximize2, Sparkles, Layers, ArrowRight } from "lucide-react";

export const FeatureFloating: React.FC = () => {
  const [isShaded, setIsShaded] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  return (
    <section id="floating" className="py-20 sm:py-28 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column: Copy & Tag Pills (Foglamp Style) */}
          <div className="max-w-md">
            {/* Squircle Tag Pills */}
            <ul className="mb-5 flex flex-wrap gap-2 text-[12px] font-medium text-muted-foreground list-none p-0">
              <li className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                <Pin className="h-3 w-3" />
                <span>Always-On-Top</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-300">
                <Minimize2 className="h-3 w-3" />
                <span>Window Shade (36px)</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-purple-300">
                <Layers className="h-3 w-3" />
                <span>Focus Recede</span>
              </li>
            </ul>

            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              Float, shade, or recede into the background.
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Keep critical specs, API endpoints, or checklists floating right over your code editor or browser. Double-click the compact header to roll it up into a minimal 36px titlebar shade.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-white/10"
              >
                <span>Try floating mode</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Window Shade & Pin Simulator */}
          <div className="relative rounded-2xl border border-white/15 bg-neutral-950/80 p-4 sm:p-6 shadow-2xl overflow-hidden">
            {/* Background Workspace Lines */}
            <div className="pointer-events-none absolute inset-0 opacity-15 [background:radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Interactive Control Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs">
              <span className="font-mono text-muted-foreground text-[11px]">
                Interactive Simulator — Click controls below to test:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    isPinned
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-muted-foreground"
                  }`}
                >
                  <Pin className="h-3 w-3" />
                  <span>{isPinned ? "Pinned (Always On Top)" : "Unpinned"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShaded(!isShaded)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                >
                  {isShaded ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  <span>{isShaded ? "Expand Window" : "Roll Up to Shade"}</span>
                </button>
              </div>
            </div>

            {/* The Simulated Stash Window */}
            <div
              className={`relative z-10 rounded-xl border border-white/20 bg-neutral-900 transition-all duration-300 overflow-hidden shadow-xl ${
                isShaded ? "h-11 border-cyan-500/40" : "h-64"
              }`}
            >
              {/* Window Titlebar */}
              <div
                onDoubleClick={() => setIsShaded(!isShaded)}
                className="flex h-11 items-center justify-between border-b border-white/10 px-3 text-xs bg-neutral-950/60 cursor-pointer select-none"
                title="Double-click to toggle shade"
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>GraphQL Client Config & Auth Tokens</span>
                  {isShaded && (
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                      SHADED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned(!isPinned);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                  >
                    {isPinned ? <Pin className="h-3 w-3 text-emerald-400" /> : <PinOff className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShaded(!isShaded);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                  >
                    {isShaded ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Window Body (Hidden when shaded) */}
              {!isShaded && (
                <div className="p-4 space-y-3 text-xs font-mono text-muted-foreground animate-fadeIn">
                  <div className="text-foreground">
                    <span className="text-purple-400">const</span> <span className="text-cyan-300">GRAPHQL_ENDPOINT</span> = <span className="text-emerald-300">"https://api.stash.dev/v1/graphql"</span>;
                  </div>
                  <div className="text-foreground">
                    <span className="text-purple-400">const</span> <span className="text-cyan-300">AUTH_HEADER</span> = <span className="text-emerald-300">"Bearer stsh_live_9941a80c2f"</span>;
                  </div>
                  <div className="border-t border-white/10 pt-2 text-2xs text-muted-foreground">
                    • Window chrome fades away while you type to prevent distraction<br />
                    • Stays pinned seamlessly while you switch between VS Code, Chrome, and terminal
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
