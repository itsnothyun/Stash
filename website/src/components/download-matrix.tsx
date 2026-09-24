import React, { useState } from "react";
import { Download, Terminal, Check, Copy, ShieldCheck, Sparkles, ExternalLink, Cpu } from "lucide-react";
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
    <section id="download" className="py-20 sm:py-32 border-b border-white/10 relative isolate">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 opacity-25 blur-[120px] [background:radial-gradient(circle_at_center,#10b981_0%,#3b82f6_50%,transparent_80%)]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 mb-4">
            <Download className="h-3 w-3" />
            <span>Download Matrix · {LATEST_VERSION}</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
            Install Stash on your desktop.
          </h2>

          <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
            Free and open-source under MIT. Choose your operating system below or install via your system package manager.
          </p>
        </div>

        {/* The Two Main Platform Cards (Windows & macOS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* WINDOWS CARD */}
          <div className="relative rounded-2xl border border-white/15 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all hover:border-white/25">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">Windows</h3>
                  <span className="text-xs text-muted-foreground font-mono">Windows 10, 11 (64-bit / ARM64)</span>
                </div>
                <div className="rounded-xl bg-blue-500/15 p-2.5 text-blue-400 border border-blue-500/30">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.902-1.799" />
                  </svg>
                </div>
              </div>

              {/* Primary Installer Button with Foglamp Beam */}
              <div className="space-y-3 mb-6">
                <div className="foglamp-beam-container w-full">
                  <a
                    href={windows.primaryInstaller.url}
                    download
                    className="relative z-10 flex w-full h-12 items-center justify-center gap-2.5 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-850 active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>Download Windows Installer (.exe)</span>
                    <span className="font-mono text-2xs text-muted-foreground ml-1">
                      ({windows.primaryInstaller.size})
                    </span>
                  </a>
                  <div className="foglamp-beam-bloom" />
                </div>

                {windows.secondaryInstaller && (
                  <a
                    href={windows.secondaryInstaller.url}
                    download
                    className="flex w-full h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
                  >
                    <span>Download Portable (.exe)</span>
                    <span className="text-2xs text-muted-foreground font-mono">No install needed</span>
                  </a>
                )}
              </div>

              {/* Package Manager (winget) */}
              <div className="rounded-xl bg-black/50 border border-white/10 p-3.5">
                <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1.5 font-mono">
                  <span>INSTALL VIA WINGET</span>
                  <span className="text-emerald-400">Recommended for devs</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-foreground">
                  <code>{windows.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(windows.cliCommand, "winget")}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
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

            <div className="mt-6 pt-4 border-t border-white/10 text-2xs font-mono text-muted-foreground flex items-center justify-between">
              <span>SHA256: 4a2bf...8c9e</span>
              <a
                href={`${GITHUB_REPO}/releases`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                <span>Release notes</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* MACOS CARD */}
          <div className="relative rounded-2xl border border-white/15 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all hover:border-white/25">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">macOS</h3>
                  <span className="text-xs text-muted-foreground font-mono">macOS 12+ (Monterey, Sonoma, Sequoia)</span>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 text-white border border-white/20">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.77 1.04-1.85.93-2.93-.9.04-2 .6-2.65 1.36-.58.67-1.08 1.76-.95 2.82 1.01.08 2.05-.48 2.67-1.25z" />
                  </svg>
                </div>
              </div>

              {/* Primary Installer Button with Foglamp Beam */}
              <div className="space-y-3 mb-6">
                <div className="foglamp-beam-container w-full">
                  <a
                    href={macos.primaryInstaller.url}
                    download
                    className="relative z-10 flex w-full h-12 items-center justify-center gap-2.5 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-850 active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>Download macOS Disk Image (.dmg)</span>
                    <span className="font-mono text-2xs text-muted-foreground ml-1">
                      ({macos.primaryInstaller.size})
                    </span>
                  </a>
                  <div className="foglamp-beam-bloom" />
                </div>

                <div className="flex w-full h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-foreground">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Universal Binary</span>
                  <span className="text-2xs text-muted-foreground font-mono">Apple Silicon & Intel</span>
                </div>
              </div>

              {/* Package Manager (Homebrew) */}
              <div className="rounded-xl bg-black/50 border border-white/10 p-3.5">
                <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1.5 font-mono">
                  <span>INSTALL VIA HOMEBREW</span>
                  <span className="text-emerald-400">1-line terminal command</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-foreground">
                  <code>{macos.cliCommand}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(macos.cliCommand, "brew")}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
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

            <div className="mt-6 pt-4 border-t border-white/10 text-2xs font-mono text-muted-foreground flex items-center justify-between">
              <span>SHA256: 9e1f3...4b2a</span>
              <a
                href={`${GITHUB_REPO}/releases`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                <span>Release notes</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Linux Banner Card (Community) */}
        <div className="mt-8 max-w-5xl mx-auto rounded-2xl border border-white/10 bg-neutral-950/60 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/10 p-2 font-mono text-xs text-muted-foreground">🐧</span>
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Looking for Linux?
              </span>
              <span className="text-xs text-muted-foreground">
                Community builds available for Ubuntu, Debian, Arch, and Fedora.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={linux.primaryInstaller.url}
              download
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
            >
              Download .AppImage
            </a>
            {linux.secondaryInstaller && (
              <a
                href={linux.secondaryInstaller.url}
                download
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors"
              >
                Download .deb
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
