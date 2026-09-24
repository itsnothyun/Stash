import React, { useState, useEffect } from "react";
import { Download, Github, Monitor, Moon, Sun } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

export const FooterCta: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  return (
    <footer className="relative overflow-hidden pt-28 pb-16 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Pre-Footer Headline & Dual CTA Buttons (Exact Foglamp Style) */}
        <div className="flex flex-col items-center text-center pb-28">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-[450] tracking-tight text-white leading-[1.12] text-balance">
            Your desktop scratchpad<br />is one click away.
          </h2>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

            {/* Dark Pill Button */}
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Start free
            </a>
          </div>
        </div>

        {/* Footer Navigation Columns (Exact Foglamp Footer Layout) */}
        <div className="grid grid-cols-2 gap-8 pt-12 sm:grid-cols-5 border-t border-white/[0.06] text-xs">
          {/* Brand Column */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src={stashLogoSrc}
                alt="Stash Logo"
                className="h-5 w-5 object-contain rounded"
              />
              <span className="font-medium text-sm text-white tracking-tight">Stash</span>
            </div>
            <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
              Floating desktop scratchpad & modular HUD.
            </p>
            {/* Theme switcher pill matching Foglamp */}
            <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-zinc-950 p-1 text-zinc-500 text-[10px]">
              <span className="p-1 rounded-full text-zinc-400">
                <Monitor className="h-3 w-3" />
              </span>
              <span className="p-1 rounded-full bg-white/10 text-white">
                <Moon className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-medium text-white">Product</h4>
            <ul className="space-y-2 text-zinc-400 list-none p-0">
              <li><a href="#widgets" className="hover:text-white transition-colors">Currency Swap</a></li>
              <li><a href="#floating" className="hover:text-white transition-colors">Window Shade</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">PIN Vault</a></li>
              <li><a href="#widgets" className="hover:text-white transition-colors">Countdown Timer</a></li>
              <li><a href="#floating" className="hover:text-white transition-colors">Markdown Editor</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-medium text-white">Resources</h4>
            <ul className="space-y-2 text-zinc-400 list-none p-0">
              <li><a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a></li>
              <li><a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Quickstart</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Offline Architecture</a></li>
              <li><a href={`${GITHUB_REPO}/releases`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Changelog</a></li>
              <li><a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>

          {/* Company & Platforms Column */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-medium text-white">Platforms</h4>
            <ul className="space-y-2 text-zinc-400 list-none p-0">
              <li><a href={pkg.primaryInstaller.url} download className="hover:text-white transition-colors">Windows (.exe)</a></li>
              <li><a href={DOWNLOAD_PACKAGES.macos.primaryInstaller.url} download className="hover:text-white transition-colors">macOS (.dmg)</a></li>
              <li><a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">MIT License</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Concentric Wireframe Arcs Graphic at Bottom of Foglamp */}
        <div className="relative mt-20 flex justify-center overflow-hidden h-32 pointer-events-none select-none">
          <svg
            className="w-[900px] h-[300px] -bottom-10 absolute opacity-30 text-white"
            viewBox="0 0 900 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="450" cy="350" r="140" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="450" cy="350" r="220" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="450" cy="350" r="300" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" />
            <circle cx="450" cy="350" r="380" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="450" cy="350" r="460" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
          </svg>
          {/* Subtle fade out gradient over arcs */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black" />
        </div>
      </div>
    </footer>
  );
};
