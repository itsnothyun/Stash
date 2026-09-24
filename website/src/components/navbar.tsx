import React, { useState, useEffect } from "react";
import { Download, Github, ChevronDown, Check, Sparkles, ExternalLink } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";

export const Navbar: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const currentPkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Left: Brand Logo & Version Pill */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
            {/* Geometric Stash icon */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-sm shadow-emerald-500/20">
              <div className="h-4 w-4 rounded-sm bg-black/85 flex flex-col justify-between p-0.5">
                <div className="h-0.5 w-full bg-emerald-400 rounded-full" />
                <div className="h-0.5 w-2/3 bg-cyan-400 rounded-full" />
                <div className="h-0.5 w-full bg-emerald-300 rounded-full" />
              </div>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Stash
            </span>
          </a>

          <a
            href={`${GITHUB_REPO}/releases/tag/${LATEST_VERSION}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{LATEST_VERSION}</span>
          </a>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#floating"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Floating
          </a>
          <a
            href="#widgets"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Widgets
          </a>
          <a
            href="#security"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Security
          </a>
          <a
            href="#personalization"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Themes
          </a>
          <a
            href="#download"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Download
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>

        {/* Right: GitHub Star Button & OS Download Pill */}
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground sm:inline-flex"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
            <span className="rounded bg-white/10 px-1 py-0.2 text-[10px] font-mono">★ 1.4k</span>
          </a>

          {/* Quick OS Download button with beam */}
          <div className="relative">
            <div className="foglamp-beam-container">
              <a
                href={currentPkg.primaryInstaller.url}
                download
                className="relative z-10 flex h-9 items-center gap-2 rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white shadow-md transition-all hover:bg-neutral-800"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {os === "macos"
                    ? "Get for Mac"
                    : os === "windows"
                    ? "Get for Windows"
                    : "Download Stash"}
                </span>
                <span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">
                  {currentPkg.primaryInstaller.ext}
                </span>
              </a>
              <div className="foglamp-beam-bloom" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
