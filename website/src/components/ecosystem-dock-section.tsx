import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, Shield, Cpu, Layers, Bookmark } from "lucide-react";
import { VerticalDock, DOCK_ITEMS } from "./vertical-dock";

export const EcosystemDockSection: React.FC = () => {
  return (
    <section id="ecosystem" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-[120px] [background:radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,rgba(168,85,247,0.1)_40%,transparent_75%)]"
      />

      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs text-zinc-300 backdrop-blur-md mb-4">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="tracking-wide uppercase text-[10px] font-semibold text-zinc-300">
              UNIFIED SUITE ECOSYSTEM
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-[450] text-white tracking-tight leading-[1.15]">
            Crafted for speed, intelligence & privacy.
          </h2>

          <p className="mt-3.5 text-xs sm:text-sm text-zinc-400 leading-relaxed text-balance">
            Stash connects into our suite of minimalist, high-velocity desktop and web applications.
            Glide over the dock to inspect each workspace.
          </p>
        </div>

        {/* Interactive Showcase Box */}
        <div className="rounded-3xl border border-white/[0.1] bg-gradient-to-b from-[#181920]/80 via-[#131418]/90 to-[#101014] p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* Left: The Vertical Dock Stage */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center">
                {/* Stage Lighting Halo */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

                {/* Inline Vertical Dock Component */}
                <VerticalDock position="inline" />
              </div>

              <span className="mt-3 text-[11px] text-zinc-500 font-mono tracking-tight flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Hover dock icons for magnification & glow
              </span>
            </div>

            {/* Right: Ecosystem Apps Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
              {DOCK_ITEMS.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  target={app.isCurrent ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="group relative rounded-2xl p-4 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 shadow-sm hover:shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Row: Icon + Badge + Arrow */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 flex items-center justify-center shrink-0">
                          <img
                            src={app.icon}
                            alt={`${app.name} icon`}
                            className="h-full w-full object-contain select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110"
                            draggable={false}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                              {app.name}
                            </h3>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {app.tagline}
                          </span>
                        </div>
                      </div>

                      <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                    </div>

                    {/* App Description */}
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  {/* Bottom Metadata */}
                  <div className="mt-3.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="capitalize">{app.id}</span>
                    <span className="text-zinc-400 group-hover:text-white transition-colors">
                      {app.isCurrent ? "Active App • Home" : "Open GitHub Repo →"}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
