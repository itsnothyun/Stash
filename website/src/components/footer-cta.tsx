import React, { useState, useEffect } from "react";
import { Download, Github, Heart, Sparkles, ExternalLink } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";

export const FooterCta: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  return (
    <footer className="relative isolate overflow-hidden pt-20 pb-12">
      {/* Bottom Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-[450px] w-[800px] -translate-x-1/2 opacity-25 blur-[120px] [background:radial-gradient(circle_at_center,#10b981_0%,#8b5cf6_60%,transparent_80%)]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Big Bold Headline Call to Action */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto pb-20 border-b border-white/10">
          <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-foreground text-balance">
            The desktop scratchpad you won't want to close.
          </h2>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl text-pretty">
            Free and open source. Fast, lightweight, and always floating right where you think.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <div className="foglamp-beam-container">
              <a
                href={pkg.primaryInstaller.url}
                download
                className="relative z-10 flex h-12 items-center gap-2.5 rounded-full bg-neutral-900 px-7 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-850 active:scale-[0.98]"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span>
                  {os === "macos"
                    ? "Download for Mac (.dmg)"
                    : os === "windows"
                    ? "Download for Windows (.exe)"
                    : "Download Stash"}
                </span>
                <span className="font-mono text-2xs text-muted-foreground ml-1">
                  {LATEST_VERSION}
                </span>
              </a>
              <div className="foglamp-beam-bloom" />
            </div>

            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-foreground hover:bg-white/10 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500">
              <div className="h-3 w-3 rounded-xs bg-black flex flex-col justify-between p-0.5">
                <div className="h-0.5 w-full bg-emerald-400 rounded-full" />
                <div className="h-0.5 w-full bg-cyan-400 rounded-full" />
              </div>
            </div>
            <span className="font-semibold text-foreground">Stash Desktop</span>
            <span>· MIT Licensed · Local SQLite · Zero Telemetry</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#floating" className="hover:text-foreground transition-colors">
              Floating
            </a>
            <a href="#widgets" className="hover:text-foreground transition-colors">
              Widgets
            </a>
            <a href="#download" className="hover:text-foreground transition-colors">
              Installers
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
