import React, { useState } from "react";
import { Download, Check, Copy, ExternalLink, Cpu } from "lucide-react";
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
    <section id="downloads" className="py-20 sm:py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="text-left mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
            Install Stash on your desktop
          </h2>
          <p className="mt-3 text-sm text-zinc-400 font-normal leading-relaxed max-w-lg">
            Free and open-source under MIT. Native binary packages for Windows and macOS.
          </p>
        </div>

        {/* The Two Main Platform Cards (Windows & macOS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WINDOWS CARD */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div>
                  <h3 className="text-base font-medium text-white">Windows</h3>
                  <span className="text-xs text-zinc-500 font-mono">Windows 10, 11 (64-bit)</span>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2 text-zinc-300 border border-white/[0.08]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.902-1.799" />
                  </svg>
                </div>
              </div>

              {/* Primary Installer Button */}
              <div className="space-y-2.5 mb-5">
                <a
                  href={windows.primaryInstaller.url}
                  download
                  className="flex w-full h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-medium text-black shadow-sm transition-colors hover:bg-neutral-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Windows (.exe)</span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    ({windows.primaryInstaller.size})
                  </span>
                </a>

                {windows.secondaryInstaller && (
                  <a
                    href={windows.secondaryInstaller.url}
                    download
                    className="flex w-full h-9 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 text-xs font-normal text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <span>Portable Standalone (.exe)</span>
                  </a>
                )}
              </div>

              {/* Package Manager (winget) */}
              <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 font-mono uppercase tracking-wider">
                  <span>Winget CLI</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
                  <code>{windows.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(windows.cliCommand, "winget")}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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

            <div className="mt-5 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>SHA256: 4a2bf...8c9e</span>
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

          {/* MACOS CARD */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div>
                  <h3 className="text-base font-medium text-white">macOS</h3>
                  <span className="text-xs text-zinc-500 font-mono">macOS 12+ (Universal Binary)</span>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2 text-zinc-300 border border-white/[0.08]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.77 1.04-1.85.93-2.93-.9.04-2 .6-2.65 1.36-.58.67-1.08 1.76-.95 2.82 1.01.08 2.05-.48 2.67-1.25z" />
                  </svg>
                </div>
              </div>

              {/* Primary Installer Button */}
              <div className="space-y-2.5 mb-5">
                <a
                  href={macos.primaryInstaller.url}
                  download
                  className="flex w-full h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-medium text-black shadow-sm transition-colors hover:bg-neutral-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download macOS Disk Image (.dmg)</span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    ({macos.primaryInstaller.size})
                  </span>
                </a>

                <div className="flex w-full h-9 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 text-xs font-normal text-zinc-400">
                  <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Universal: Apple Silicon (M1-M4) & Intel</span>
                </div>
              </div>

              {/* Package Manager (Homebrew) */}
              <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 font-mono uppercase tracking-wider">
                  <span>Homebrew Cask</span>
                  <span className="text-emerald-400">1-command</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
                  <code>{macos.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(macos.cliCommand, "brew")}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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

            <div className="mt-5 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>SHA256: 9e1f3...4b2a</span>
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
      </div>
    </section>
  );
};
