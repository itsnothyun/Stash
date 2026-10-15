import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Github, Monitor, Moon, Sun, BookOpen, Check, ArrowRight, Sparkles } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

import { NavigationView } from "./navbar";

interface FooterCtaProps {
  onNavigate?: (view: NavigationView) => void;
  onNavigateToDocs?: () => void;
}

export const FooterCta: React.FC<FooterCtaProps> = ({ onNavigate, onNavigateToDocs }) => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const pkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const handleLink = (e: React.MouseEvent, view: NavigationView) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(view);
    } else if (view === "docs" && onNavigateToDocs) {
      onNavigateToDocs();
    } else {
      window.location.hash = `#${view}`;
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setIsSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="relative overflow-hidden pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        {/* Pre-Footer Headline & Dual CTA Buttons (Exact Foglamp Style) */}
        <div className="flex flex-col items-center text-center pb-24">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-[450] tracking-tight text-white leading-[1.12] text-balance">
            Your desktop scratchpad<br />is one click away.
          </h2>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* White Pill Button */}
            <a
              href={pkg.primaryInstaller.url}
              download
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.8)] hover:bg-neutral-100 active:translate-y-0.5 transition-all cursor-pointer"
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
              className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#1a1a20] px-5 py-2.5 text-xs font-medium text-zinc-300 shadow-[0_4px_14px_rgba(0,0,0,0.55),0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.7)] hover:bg-[#22222a] hover:text-white active:translate-y-0.5 transition-all cursor-pointer"
            >
              Start free
            </a>
          </div>
        </div>

        {/* Liquid Glass Outer Specular Bezel */}
        <div className="relative w-full max-w-[1140px] mx-auto select-none p-[3px] rounded-[40px] transition-all duration-300 bg-gradient-to-b from-white/25 via-white/[0.05] via-40% to-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_24px_-4px_rgba(255,255,255,0.03)]">
          {/* Inner Frosted Glass Card Container */}
          <div className="relative w-full overflow-hidden rounded-[37px] px-8 py-8 sm:px-11 sm:py-9 transition-all duration-300 bg-gradient-to-br from-[#1b1c21]/95 via-[#131417]/95 to-[#0e0f11]/95 backdrop-blur-2xl shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.14),inset_0_-1px_1.5px_0_rgba(0,0,0,0.6)]">
            {/* Top Row: Brand & Newsletter + Link Columns */}
            <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-8 items-start">
              {/* Brand & Newsletter Column */}
              <div className="flex flex-col gap-5 max-w-sm w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={stashLogoSrc}
                      alt="Stash Logo"
                      className="h-5 w-5 object-contain rounded"
                    />
                    <span className="font-semibold text-sm text-white tracking-tight">Stash</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10">
                    Desktop v0.1.1
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed pr-2">
                  Liquid glass interfaces, crafted with care for fast offline notes,
                  responsive checklists, and focused workflows.
                </p>

                {/* Newsletter Pill Field */}
                <form onSubmit={handleSubscribe} className="w-full">
                  <div className="group relative flex items-center justify-between p-1 pl-4 rounded-full transition-all duration-300 bg-white/[0.06] border border-white/10 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.1),inset_0_-1px_1.5px_0_rgba(0,0,0,0.5)] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email for updates…"
                      required
                      className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none min-w-0 pr-2"
                    />

                    {/* Glass CTA Submit Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      className="relative overflow-hidden shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold select-none cursor-pointer transition-all duration-200 bg-gradient-to-b from-[#ffffff] to-[#e2e2e8] text-zinc-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.2),0_7px_16px_-6px_rgba(0,0,0,0.4)]"
                    >
                      {/* Sweeping shine sheen layer */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-full top-0 w-1/2 h-[200%] -rotate-25 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[350%] transition-all duration-700 ease-out"
                      />

                      {isSubscribed ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" />
                          <span className="text-emerald-700">Subscribed</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Navigation Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 w-full lg:w-auto text-xs">
                {/* Product Column */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-2">
                    Product
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <a href="#widgets" className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left">
                      Currency Swap
                    </a>
                    <a href="#floating" className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left">
                      Window Shade
                    </a>
                    <a href="#security" className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left">
                      PIN Vault
                    </a>
                    <a href="#widgets" className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left">
                      Countdown Timer
                    </a>
                    <a href="#floating" className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left">
                      Markdown Editor
                    </a>
                  </div>
                </div>

                {/* Resources Column */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-2">
                    Resources
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <a
                      href="#docs"
                      onClick={(e) => handleLink(e, "docs")}
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left cursor-pointer"
                    >
                      Docs & API
                    </a>
                    <a
                      href="#templates"
                      onClick={(e) => handleLink(e, "templates")}
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left cursor-pointer"
                    >
                      Note Templates
                    </a>
                    <a
                      href="#shortcuts"
                      onClick={(e) => handleLink(e, "shortcuts")}
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left cursor-pointer"
                    >
                      Shortcuts
                    </a>
                    <a
                      href="#changelog"
                      onClick={(e) => handleLink(e, "changelog")}
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left cursor-pointer"
                    >
                      Changelog
                    </a>
                    <a
                      href={GITHUB_REPO}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      GitHub Repo
                    </a>
                  </div>
                </div>

                {/* Platforms Column */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 px-2">
                    Platforms
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <a
                      href={pkg.primaryInstaller.url}
                      download
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      Windows (.exe)
                    </a>
                    <a
                      href={DOWNLOAD_PACKAGES.macos.primaryInstaller.url}
                      download
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      macOS (.dmg)
                    </a>
                    <a
                      href={`${GITHUB_REPO}/blob/main/LICENSE`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      MIT License
                    </a>
                    <a
                      href="#privacy"
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      Privacy
                    </a>
                    <a
                      href="#terms"
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      Terms
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="h-px w-full bg-white/10 my-6" />

            {/* Bottom Row: Metadata & Circular Frosted Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500 font-normal">
                © 2026 Stash • High-performance offline notes & liquid glass widgets.
              </p>

              {/* Social / Circular Glass Action Buttons */}
              <div className="flex items-center gap-2.5">
                <motion.a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)] hover:bg-white/[0.16] hover:text-white text-zinc-400"
                  title="GitHub Repository"
                >
                  <Github className="h-4 w-4" />
                </motion.a>

                <motion.a
                  href={pkg.primaryInstaller.url}
                  download
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)] hover:bg-white/[0.16] hover:text-white text-zinc-400"
                  title="Download Stash"
                >
                  <Download className="h-4 w-4" />
                </motion.a>

                <motion.button
                  type="button"
                  onClick={(e) => handleLink(e, "docs")}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-2px_rgba(0,0,0,0.4)] hover:bg-white/[0.16] hover:text-white text-zinc-400"
                  title="Documentation & Guides"
                >
                  <BookOpen className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
