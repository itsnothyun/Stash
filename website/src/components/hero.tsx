import React, { useState, useEffect } from "react";
import {
  Download,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Layers,
  ArrowUpDown,
  CalendarClock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Flame,
  Key,
  Settings,
  User,
  Sliders,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  detectUserOS,
  DOWNLOAD_PACKAGES,
  OperatingSystem,
  LATEST_VERSION,
  GITHUB_REPO,
} from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

export const Hero: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText("npx create-stash-widget@latest");
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Left-Aligned Headline Block (Exact Foglamp Alignment & Typography) */}
        <div className="text-left">
          <h1 className="font-display text-4xl sm:text-5xl md:text-[56px] font-[450] tracking-tight text-white leading-[1.12] text-balance">
            Know what your workspace is doing
          </h1>

          <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400 font-normal leading-relaxed text-pretty">
            Live currency swaps, countdown timers, habits, and Markdown notes that float right where you work. Zero bloat, local SQLite, built for Windows and macOS.
          </p>

          {/* CTA Row: Left Buttons + Right Brand Badge */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* White Pill Button */}
              <a
                href={pkg.primaryInstaller.url}
                download
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-neutral-200 shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-black" />
                <span>
                  {os === "macos"
                    ? "Download for macOS (.dmg)"
                    : os === "windows"
                    ? "Download for Windows (.exe)"
                    : "Download Stash"}
                </span>
              </a>

              {/* Ghost Pill Button */}
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <span>Start free</span>
              </a>
            </div>

            {/* Right: Built with Tauri & Rust */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-normal">
              <span>Built for</span>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>Tauri 2.0</span>
                <span className="text-zinc-600">/</span>
                <span className="text-orange-400 font-mono text-[10px]">Rust</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Application Frame (Foglamp Software Mockup Window) */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[210px_1fr]">
            {/* Left App Sidebar */}
            <div className="hidden md:flex flex-col justify-between border-r border-white/[0.06] bg-[#0a0a0c] p-3 text-xs">
              <div>
                {/* Workspace Switcher */}
                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-white mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={stashLogoSrc}
                      alt="Stash"
                      className="h-4 w-4 object-contain rounded"
                    />
                    <span className="tracking-tight">Personal Vault</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </div>

                {/* Sidebar Navigation Items with Squircle Colored Badges */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-rose-500/20 text-rose-400 text-[10px]">
                      ●
                    </div>
                    <span>Overview</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-cyan-500/20 text-cyan-400 text-[10px]">
                      ▲
                    </div>
                    <span>Workflows</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-purple-500/20 text-purple-400 text-[10px]">
                      ■
                    </div>
                    <span>Widgets</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-blue-500/20 text-blue-400 text-[10px]">
                      ◆
                    </div>
                    <span>Sessions</span>
                  </div>

                  {/* Active Selected Item (Traces / Stickies) */}
                  <div className="flex items-center gap-2.5 rounded-md bg-white/[0.06] px-2.5 py-1.5 font-medium text-white shadow-xs">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-amber-500/20 text-amber-400 text-[10px]">
                      ★
                    </div>
                    <span>Traces</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-pink-500/20 text-pink-400 text-[10px]">
                      ♥
                    </div>
                    <span>Evals</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-yellow-500/20 text-yellow-400 text-[10px]">
                      ▲
                    </div>
                    <span>Alerts</span>
                  </div>
                </div>
              </div>

              {/* Bottom Sidebar Items */}
              <div className="border-t border-white/[0.06] pt-3 space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <Key className="h-3.5 w-3.5" />
                  <span>API Keys</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 text-zinc-300 font-medium pt-1">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] text-white font-bold">
                    G
                  </div>
                  <span>Gustavo</span>
                </div>
              </div>
            </div>

            {/* Main Workspace Table Viewport */}
            <div className="flex flex-col bg-[#0c0c0e]">
              {/* Header Bar with Filter Chips & Time Segmented Control */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/[0.06] px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-white text-xs">
                    <span className="text-amber-400">★</span>
                    <span>Traces</span>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors">
                      <span>Any agent</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                    </button>
                    <button className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors">
                      <span>Any model</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                    </button>
                    <button className="hidden sm:flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors">
                      <AlertCircle className="h-2.5 w-2.5 text-amber-400" />
                      <span>Errors only</span>
                    </button>
                    <button className="p-1 rounded-md border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white">
                      <Sliders className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Right: Time Range Selector */}
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/40 p-0.5 text-[11px] text-zinc-400">
                  <span className="rounded bg-white/[0.08] px-2 py-0.5 font-medium text-white">24h</span>
                  <span className="px-2 py-0.5 hover:text-white cursor-pointer">3d</span>
                  <span className="px-2 py-0.5 hover:text-white cursor-pointer">7d</span>
                  <span className="px-1.5 py-0.5 text-zinc-500">📅</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-medium text-zinc-500">
                      <th className="py-2.5 px-4 font-normal">Trace</th>
                      <th className="py-2.5 px-3 font-normal text-right">Spans</th>
                      <th className="py-2.5 px-3 font-normal text-right">Tokens</th>
                      <th className="py-2.5 px-3 font-normal text-right">Duration</th>
                      <th className="py-2.5 px-3 font-normal text-right">Cost</th>
                      <th className="py-2.5 px-4 font-normal text-right">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {/* Row 1 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          Hey, my order #48213 still says "processing" after 5 days. Can you chec...
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 GPT-5.6 Sol</span>
                          <span>•</span>
                          <span>Session</span>
                          <span>•</span>
                          <span className="text-purple-400">👤 support-triage</span>
                          <span>•</span>
                          <span className="text-cyan-400">👤 onboard-customer</span>
                          <span>•</span>
                          <span>🏢 Acme Inc</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">8</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">4.2K</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">5.84s</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300">$0.041800</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">12s ago</td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          Compare vector DB options for a 50M-embedding workload
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 Claude Fable 5</span>
                          <span>•</span>
                          <span className="text-orange-400">👤 research-planner</span>
                          <span>•</span>
                          <span>🏢 Globex</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">14</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">12K</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">9.12s</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300">$0.124000</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">48s ago</td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          Draft a renewal reminder for dormant workspaces
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 Gemini 3.5 Flash</span>
                          <span>•</span>
                          <span className="text-rose-400">👤 email-drafter</span>
                          <span>•</span>
                          <span>🏢 Initech</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">3</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">1.9K</td>
                      <td className="py-3 px-3 text-right font-mono text-cyan-400 font-medium">1.58s</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">$0.009400</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">3m ago</td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          <span>Which accounts drove the Q3 revenue dip? Break it down by plan t...</span>
                          <span className="inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-mono text-rose-400 bg-rose-500/10">
                            ⚠ 2
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 Claude Fable 5</span>
                          <span>•</span>
                          <span>Session</span>
                          <span>•</span>
                          <span className="text-blue-400">👤 sql-analyst</span>
                          <span>•</span>
                          <span>🏢 Globex</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">17</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">15K</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400 font-medium">12.68s</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300">$0.162000</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">8m ago</td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          Translate the onboarding guide to Japanese, keep the code blocks
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 GLM 5</span>
                          <span>•</span>
                          <span className="text-cyan-400">👤 doc-translator</span>
                          <span>•</span>
                          <span>🏢 Initech</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">5</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">9.8K</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">2.14s</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300">$0.012100</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">14m ago</td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200 truncate max-w-xs sm:max-w-md">
                          Reconcile the Stripe payout against invoices for July
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="text-zinc-400">🤖 MiniMax M2.5</span>
                          <span>•</span>
                          <span className="text-purple-400">👤 billing-reconciler</span>
                          <span>•</span>
                          <span className="text-yellow-400">👤 weekly-digest</span>
                          <span>•</span>
                          <span>🏢 Hooli</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">4</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">1.4K</td>
                      <td className="py-3 px-3 text-right font-mono text-cyan-400 font-medium">920ms</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">$0.003800</td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">19m ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-zinc-500">
                <span>6 traces</span>
                <div className="flex items-center gap-3">
                  <span>1 to 6 ↕</span>
                  <div className="flex items-center gap-1">
                    <button className="p-0.5 rounded hover:bg-white/10">&lt;</button>
                    <button className="p-0.5 rounded hover:bg-white/10">&gt;</button>
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
