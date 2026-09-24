import React, { useState } from "react";
import { Palette, Type, Check, Sparkles, ArrowRight } from "lucide-react";

export const FeatureTactile: React.FC = () => {
  const [paper, setPaper] = useState<"blueprint" | "dots" | "lines" | "plain">("blueprint");
  const [font, setFont] = useState<"mono" | "sans" | "serif">("mono");

  const paperClasses = {
    blueprint: "paper-pattern-blueprint",
    dots: "paper-pattern-dots",
    lines: "paper-pattern-lines",
    plain: "",
  };

  const fontClasses = {
    mono: "font-mono",
    sans: "font-sans",
    serif: "font-serif",
  };

  return (
    <section id="personalization" className="py-20 sm:py-28 border-b border-white/10 bg-neutral-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column */}
          <div className="max-w-md">
            <ul className="mb-5 flex flex-wrap gap-2 text-[12px] font-medium text-muted-foreground list-none p-0">
              <li className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-purple-300">
                <Palette className="h-3 w-3" />
                <span>Tactile Paper</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                <Type className="h-3 w-3" />
                <span>Reading Personas</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                <Sparkles className="h-3 w-3" />
                <span>Neon / Acrylic Glow</span>
              </li>
            </ul>

            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              Paper textures with physical soul.
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Stash bridges the tactile sensation of physical notebooks with desktop speed. Switch between Dot Grid, Blueprint mesh, Ruled notebook, or clean solid paper. Pair with dev-centric monospace, editorial serif, or modern sans.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-white/10"
              >
                <span>Download Stash</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Interactive Texture & Font Switcher */}
          <div className="rounded-2xl border border-white/15 bg-neutral-950 p-4 sm:p-6 shadow-2xl">
            {/* Control Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
              {/* Paper Selector */}
              <div>
                <span className="block text-2xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Paper Texture:
                </span>
                <div className="flex gap-1.5">
                  {(["blueprint", "dots", "lines", "plain"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPaper(p)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border capitalize transition-colors cursor-pointer ${
                        paper === p
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          : "border-white/10 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selector */}
              <div>
                <span className="block text-2xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Typography Persona:
                </span>
                <div className="flex gap-1.5">
                  {(["mono", "sans", "serif"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFont(f)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border capitalize transition-colors cursor-pointer ${
                        font === f
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "border-white/10 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {f === "mono" ? "Dev Mono" : f === "sans" ? "Modern Sans" : "Classic Serif"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Note Preview */}
            <div
              className={`rounded-xl border border-purple-500/30 bg-purple-950/15 p-5 shadow-inner transition-all duration-300 ${paperClasses[paper]} ${fontClasses[font]}`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-sm font-bold text-foreground">
                  Architecture Principles & Notes
                </span>
                <span className="text-2xs font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                  {paper.toUpperCase()} · {font.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-xs text-foreground/90 leading-relaxed">
                <p>
                  1. Local-first architecture: The client owns the state. Sync happens asynchronously without ever blocking the user.
                </p>
                <p>
                  2. Speed as a feature: Memory footprint under 35MB, cold boot in less than 25 milliseconds.
                </p>
                <div className="p-2 rounded bg-black/40 border border-white/10 text-2xs text-muted-foreground mt-3">
                  Click the buttons above to preview different paper textures and font personas in real-time.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
