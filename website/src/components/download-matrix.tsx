import React, { useState } from "react";
import {
  Download,
  Check,
  Copy,
  ExternalLink,
  Cpu,
  Terminal,
  Package,
  HardDrive,
  ShieldCheck,
  FileCode,
  Sparkles,
} from "lucide-react";
import { DOWNLOAD_PACKAGES, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";

export const DownloadMatrix: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const windows = DOWNLOAD_PACKAGES.windows;
  const macos = DOWNLOAD_PACKAGES.macos;
  const linux = DOWNLOAD_PACKAGES.linux;

  return (
    <section id="downloads" className="py-20 sm:py-28 bg-transparent relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Section Heading */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Latest Release {LATEST_VERSION}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
            Install Stash on your desktop
          </h2>
          <p className="mt-3 text-sm text-zinc-400 font-normal leading-relaxed max-w-lg">
            Free and open-source under MIT. 100% offline, native binary installers for Windows and macOS.
          </p>
        </div>

        {/* The Two Main Platform Cards (Windows & macOS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ========================================================
             WINDOWS PLATFORM CARD
             ======================================================== */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            {/* Top ambient highlight */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

            <div>
              {/* Header: OS Name, Architectures & Windows Logo */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">Windows</h3>
                    <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-semibold">
                      v{LATEST_VERSION.replace("v", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      <Cpu className="h-2.5 w-2.5 text-cyan-400" />
                      x64
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      <Cpu className="h-2.5 w-2.5 text-cyan-400" />
                      ARM64
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">Win 10, 11</span>
                  </div>
                </div>

                {/* Windows 11 Icon Box */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20 shadow-xs">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.902-1.799" />
                  </svg>
                </div>
              </div>

              {/* Primary & Secondary Installer Buttons */}
              <div className="space-y-2.5 mb-5">
                {/* Primary .EXE Installer */}
                <a
                  href={windows.primaryInstaller.url}
                  download
                  className="flex w-full h-11 items-center justify-between rounded-full bg-white px-5 text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.8)] hover:bg-neutral-100 active:translate-y-0.5 transition-all cursor-pointer group/btn"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Small Windows logo */}
                    <svg className="h-4 w-4 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.902-1.799" />
                    </svg>
                    <span>Download Windows Installer</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-700 bg-black/5 px-2 py-0.5 rounded-full">
                    <span className="font-bold">.exe</span>
                    <span>•</span>
                    <span>{windows.primaryInstaller.size}</span>
                  </div>
                </a>

                {/* Portable Standalone .EXE */}
                {windows.secondaryInstaller && (
                  <a
                    href={windows.secondaryInstaller.url}
                    download
                    className="flex w-full h-9 items-center justify-between rounded-full border border-white/[0.08] bg-[#1a1a20] px-4 text-xs font-normal text-zinc-300 hover:bg-[#22222a] hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.55)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.7)] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Portable Standalone Executable</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 rounded bg-white/5 px-1.5 py-0.5 border border-white/5">
                      No Install
                    </span>
                  </a>
                )}
              </div>

              {/* Package Manager (Winget CLI) */}
              <div className="rounded-xl bg-[#131316] border border-white/[0.06] p-3.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-cyan-400" />
                    <span>Winget CLI</span>
                  </span>
                  <span className="text-emerald-400 font-medium">Verified Package</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-zinc-300 bg-[#1a1a20] rounded-lg px-2.5 py-1.5 border border-white/[0.04]">
                  <code className="text-cyan-300">{windows.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(windows.cliCommand, "winget")}
                    className="p-1.5 rounded-md bg-[#25252e] border border-white/[0.06] text-zinc-400 hover:text-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all cursor-pointer ml-2"
                    title="Copy command"
                  >
                    {copiedKey === "winget" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="mt-5 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>SHA256: 4a2bf...8c9e</span>
              </span>
              <a
                href={`${GITHUB_REPO}/releases`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <span>Release notes</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* ========================================================
             MACOS PLATFORM CARD
             ======================================================== */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            {/* Top ambient highlight */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />

            <div>
              {/* Header: OS Name, Architectures & Apple Logo */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">macOS</h3>
                    <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-400 font-semibold">
                      v{LATEST_VERSION.replace("v", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      <Cpu className="h-2.5 w-2.5 text-purple-400" />
                      Apple Silicon
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      <Cpu className="h-2.5 w-2.5 text-zinc-400" />
                      Intel x86
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">macOS 12+</span>
                  </div>
                </div>

                {/* Apple Logo Box */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] p-2 text-white border border-white/[0.1] shadow-xs">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.77 1.04-1.85.93-2.93-.9.04-2 .6-2.65 1.36-.58.67-1.08 1.76-.95 2.82 1.01.08 2.05-.48 2.67-1.25z" />
                  </svg>
                </div>
              </div>

              {/* Primary & Universal Binary Buttons */}
              <div className="space-y-2.5 mb-5">
                {/* Primary .DMG Disk Image */}
                <a
                  href={macos.primaryInstaller.url}
                  download
                  className="flex w-full h-11 items-center justify-between rounded-full bg-white px-5 text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.8)] hover:bg-neutral-100 active:translate-y-0.5 transition-all cursor-pointer group/btn"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Small Apple logo */}
                    <svg className="h-4 w-4 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.77 1.04-1.85.93-2.93-.9.04-2 .6-2.65 1.36-.58.67-1.08 1.76-.95 2.82 1.01.08 2.05-.48 2.67-1.25z" />
                    </svg>
                    <span>Download macOS Disk Image</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-700 bg-black/5 px-2 py-0.5 rounded-full">
                    <span className="font-bold">.dmg</span>
                    <span>•</span>
                    <span>{macos.primaryInstaller.size}</span>
                  </div>
                </a>

                {/* Universal Binary Architecture Badge */}
                <div className="flex w-full h-9 items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.02] px-4 text-xs font-normal text-zinc-300">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-purple-400" />
                    <span>Universal Binary Architecture</span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-300 rounded bg-purple-500/10 px-1.5 py-0.5 border border-purple-500/20">
                    M1-M4 & Intel
                  </span>
                </div>
              </div>

              {/* Package Manager (Homebrew Cask) */}
              <div className="rounded-xl bg-[#131316] border border-white/[0.06] p-3.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    {/* Beer / Brew Icon */}
                    <svg className="h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
                      <path d="M9 12v6" />
                      <path d="M13 12v6" />
                      <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-2 .5-3 .5a2 2 0 0 1-2-2 2 2 0 0 1 2-2c1 0 1.5.5 3 .5s2-.5 3-.5 2 .5 3 .5a2 2 0 0 1 2 2 2 2 0 0 1-2 2Z" />
                      <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
                    </svg>
                    <span>Homebrew Cask</span>
                  </span>
                  <span className="text-emerald-400 font-medium">1-Command Install</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-zinc-300 bg-[#1a1a20] rounded-lg px-2.5 py-1.5 border border-white/[0.04]">
                  <code className="text-purple-300">{macos.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(macos.cliCommand, "brew")}
                    className="p-1.5 rounded-md bg-[#25252e] border border-white/[0.06] text-zinc-400 hover:text-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all cursor-pointer ml-2"
                    title="Copy command"
                  >
                    {copiedKey === "brew" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="mt-5 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>SHA256: 9e1f3...4b2a</span>
              </span>
              <a
                href={`${GITHUB_REPO}/releases`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <span>Release notes</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Linux & Open-Source Banner */}
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#161619] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Linux Tux Icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.5 2 8 4 8 7v4c-1.5 1-2.5 3-2.5 5 0 2 1 4 2.5 4h8c1.5 0 2.5-2 2.5-4 0-2-1-4-2.5-5V7c0-3-1.5-5-4-5zm-1.5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1.5 3c1 0 1.8.4 2 1h-4c.2-.6 1-1 2-1z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-medium text-white flex items-center gap-2">
                <span>Looking for Linux or building from source?</span>
                <span className="text-[10px] font-mono text-zinc-500">.AppImage / .deb / cargo build</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Stash compiles natively with Rust and Tauri across any standard Linux desktop distribution.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${GITHUB_REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1e1e24] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#25252e] shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.65)] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>View Linux Builds</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1e1e24] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#25252e] shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.65)] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>GitHub Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
