import React, { useState, useEffect } from "react";
import {
  Download,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  ArrowUpDown,
  Pin,
  CalendarClock,
  ExternalLink,
  Code2,
} from "lucide-react";
import {
  detectUserOS,
  DOWNLOAD_PACKAGES,
  OperatingSystem,
  LATEST_VERSION,
  GITHUB_REPO,
} from "../lib/os-detect";

export const Hero: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [copiedCli, setCopiedCli] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const handleCopyCli = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <section className="relative isolate overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Top Ambient Radial Glow (Foglamp Style) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[900px] -translate-x-1/2 opacity-35 blur-[120px] [background:radial-gradient(circle_at_center,#10b981_0%,#06b6d4_30%,#8b5cf6_60%,transparent_80%)]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Hero Header & Value Proposition */}
        <div className="flex flex-col items-center text-center">
          {/* Release Tag Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 backdrop-blur-md shadow-xs shadow-emerald-500/10">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Stash v0.1.0 Released</span>
            <span className="text-emerald-500/60">·</span>
            <span className="text-emerald-300 font-mono text-[11px]">Tauri 2.0 & Rust</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl text-balance leading-[1.08]">
            Your desktop scratchpad, <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">unbound.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
            Floating stickies with live currency conversions, countdown timers, habits, and Markdown notes that hover right where you work. Zero bloat, 100% offline, powered by Tauri and Rust.
          </p>

          {/* CTA Buttons Group (Foglamp Luminous Prismatic Beam) */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {/* Primary Download Trigger */}
            <div className="relative">
              <div className="foglamp-beam-container">
                <a
                  href={pkg.primaryInstaller.url}
                  download
                  className="relative z-10 flex h-12 items-center gap-2.5 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-800 active:scale-[0.98]"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>
                    {os === "macos"
                      ? "Download for macOS"
                      : os === "windows"
                      ? "Download for Windows"
                      : "Download Stash"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground border-l border-white/20 pl-2">
                    {pkg.primaryInstaller.ext}
                  </span>
                </a>
                <div className="foglamp-beam-bloom" />
              </div>

              {/* Package Dropdown Selector */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <span>Or select other platform ({pkg.primaryInstaller.arch})</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-xl border border-white/10 bg-neutral-950 p-2 shadow-2xl backdrop-blur-xl z-50 text-left">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Available Installers
                    </div>
                    {Object.entries(DOWNLOAD_PACKAGES)
                      .filter(([key]) => key !== "unknown")
                      .map(([key, item]) => (
                        <a
                          key={key}
                          href={item.primaryInstaller.url}
                          download
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        >
                          <span className="font-medium text-foreground">{item.osName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {item.primaryInstaller.ext}
                          </span>
                        </a>
                      ))}
                    {pkg.secondaryInstaller && (
                      <a
                        href={pkg.secondaryInstaller.url}
                        download
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border-t border-white/10 mt-1 pt-1.5"
                      >
                        <span className="font-medium text-emerald-400">Portable Version</span>
                        <span className="font-mono text-[11px] text-muted-foreground">.exe</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Terminal Copy Pill */}
            <div className="h-12 flex items-center">
              <button
                type="button"
                onClick={() => handleCopyCli(pkg.cliCommand)}
                className="group relative flex h-12 items-center gap-2.5 rounded-full border border-white/10 bg-neutral-900/60 px-5 text-xs font-mono text-muted-foreground transition-all hover:border-white/20 hover:bg-neutral-900 hover:text-foreground"
              >
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>{pkg.cliCommand}</span>
                {copiedCli ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:scale-110" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3D Perspective Desktop Showcase (Foglamp Signature Mockup) */}
        <div className="relative mx-auto mt-16 sm:mt-24 max-w-5xl">
          {/* Ambient Window Aura */}
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 blur-2xl" />

          {/* Perspective Container */}
          <div className="perspective-desktop">
            <div className="perspective-window-tilt relative rounded-2xl border border-white/15 bg-neutral-950/90 p-3 sm:p-5 shadow-window-chrome">
              {/* Fake Desktop Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs text-muted-foreground px-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-2xs font-mono text-muted-foreground/80 ml-2">
                    Stash Desktop Workspace
                  </span>
                </div>
                <div className="flex items-center gap-3 text-2xs font-mono">
                  <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-emerald-400">
                    Always On Top: ON
                  </span>
                  <span>v0.1.0</span>
                </div>
              </div>

              {/* Three Layered Authentic Stash Windows */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Window 1: Main Note with Blueprint Pattern & Tasks */}
                <div className="md:col-span-7 flex flex-col rounded-xl border border-amber-500/25 bg-amber-950/15 paper-pattern-blueprint p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Sprint Planning & Architecture</span>
                    </div>
                    <Pin className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  </div>

                  <div className="space-y-2 text-xs text-foreground/90">
                    <p className="font-medium text-amber-300">
                      # Key Architecture Priorities
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground line-through">
                        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Build local SQLite revision checkpoints</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground line-through">
                        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Implement Currency & Token Swap micro-widget</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <span className="h-3.5 w-3.5 rounded border border-white/30 flex items-center justify-center bg-white/5" />
                        <span>Publish native Windows .exe and macOS .dmg</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-black/40 border border-white/10 p-2.5 font-mono text-[11px] text-cyan-300">
                      <code>cargo tauri build --bundles app,dmg,msi,nsis</code>
                    </div>
                  </div>
                </div>

                {/* Window 2 & 3: Currency Swap Widget & 36px Window Shade */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  {/* Minimized Window Shade (36px high) */}
                  <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-200 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-semibold truncate">API Keys & Tokens (Shaded)</span>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                      Double-click to expand
                    </span>
                  </div>

                  {/* Currency Swap Attached Widget */}
                  <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-neutral-900/90 p-3.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Currency Converter</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono ml-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">1.5 ETH</span>
                    </div>

                    {/* Swap Wells Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-3 py-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">You Pay</span>
                          <span className="text-sm font-semibold font-mono text-white">1.50</span>
                        </div>
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                          ETH
                        </span>
                      </div>

                      <div className="flex justify-center -my-1">
                        <span className="rounded-full bg-neutral-800 p-1 border border-white/20 text-muted-foreground">
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-3 py-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">You Receive</span>
                          <span className="text-sm font-semibold font-mono text-emerald-400">3,945.20</span>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                          USDC
                        </span>
                      </div>
                    </div>
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
