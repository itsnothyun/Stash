import React, { useState, useEffect } from "react";
import { Github, Download } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

export const Navbar: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const currentPkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/70 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 sm:px-8">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-2.5">
          <a href="#" className="flex items-center gap-2 transition-opacity hover:opacity-85">
            <img
              src={stashLogoSrc}
              alt="Stash Logo"
              className="h-6 w-6 object-contain rounded-md shadow-sm"
            />
            <span className="text-sm font-medium tracking-tight text-white">
              Stash
            </span>
          </a>
        </div>

        {/* Right: Nav Links + GitHub + Download Pill */}
        <div className="flex items-center gap-6 text-xs">
          <nav className="hidden items-center gap-6 sm:flex text-zinc-400">
            <a
              href="#floating"
              className="transition-colors hover:text-white"
            >
              Floating
            </a>
            <a
              href="#widgets"
              className="transition-colors hover:text-white"
            >
              Widgets
            </a>
            <a
              href="#security"
              className="transition-colors hover:text-white"
            >
              Security
            </a>
            <a
              href="#downloads"
              className="transition-colors hover:text-white"
            >
              Downloads
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition-colors p-1"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>

            <a
              href={`${GITHUB_REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-block text-zinc-400 hover:text-white transition-colors"
            >
              Changelog
            </a>

            {/* Foglamp Solid White Pill Button */}
            <a
              href={currentPkg.primaryInstaller.url}
              download
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-neutral-200 active:scale-95 shadow-sm"
            >
              <span>Download</span>
              <span className="hidden font-mono text-[10px] text-zinc-500 sm:inline">
                {currentPkg.primaryInstaller.ext}
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
