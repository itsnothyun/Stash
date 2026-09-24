import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Github, Menu, X, ArrowRight, Shield, Layers, ArrowUpDown, Sparkles } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, LATEST_VERSION, GITHUB_REPO } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

export const Navbar: React.FC = () => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const currentPkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const navLinks = [
    { label: "Floating", href: "#floating" },
    { label: "Widgets", href: "#widgets" },
    { label: "Security", href: "#security" },
    { label: "Downloads", href: "#downloads" },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Liquid Glass Shell (Framer Liquid Glass Component Replica) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative w-full max-w-[760px] rounded-full p-[2px] transition-all"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(200, 200, 200, 0.14) 12%, rgba(120, 120, 120, 0.08) 60%, rgba(255, 255, 255, 0.28) 100%)",
          boxShadow:
            "0 4px 14px rgba(0, 0, 0, 0.25), 0 12px 30px rgba(0, 0, 0, 0.4), 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
        }}
      >
        {/* Inner Glass Track */}
        <div
          className="relative flex items-center justify-between rounded-full px-3.5 py-1.5 backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(150deg, rgba(20, 22, 28, 0.85) 0%, rgba(12, 13, 16, 0.8) 50%, rgba(18, 20, 26, 0.85) 100%)",
            boxShadow:
              "inset 0px 1px 1.5px 0px rgba(255, 255, 255, 0.22), inset 0px -1px 1.5px 0px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Left: Brand Logo & Wordmark (Clean logo without container box, no version pill) */}
          <a
            href="#"
            className="flex items-center gap-2 pl-1.5 transition-transform hover:opacity-90 active:scale-95"
          >
            <img
              src={stashLogoSrc}
              alt="Stash Logo"
              className="h-6 w-6 object-contain select-none drop-shadow-sm"
              draggable={false}
            />
            <span className="text-sm font-semibold tracking-tight text-white">
              Stash
            </span>
          </a>

          {/* Center: Desktop Nav Links with Liquid Hover Glide */}
          <nav
            onMouseLeave={() => setHoveredIdx(null)}
            className="hidden md:flex items-center gap-1 relative px-2 py-0.5"
          >
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredIdx(idx)}
                className="relative px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {hoveredIdx === idx && (
                  <motion.div
                    layoutId="liquid-nav-hover"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      boxShadow:
                        "inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            ))}
          </nav>

          {/* Right: GitHub Star & Liquid Glass CTA Button */}
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>

            {/* Liquid Glass CTA Button (From Framer GlassCTA) */}
            <div
              className="relative rounded-full p-[1px] transition-all"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 100%)",
                boxShadow:
                  "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
              }}
            >
              <a
                href={currentPkg.primaryInstaller.url}
                download
                className="group relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)",
                  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                }}
              >
                <Download className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:-translate-y-0.5" />
                <span>
                  {os === "macos"
                    ? "Get for Mac"
                    : os === "windows"
                    ? "Get for Windows"
                    : "Download"}
                </span>
                <span className="hidden font-mono text-[10px] text-zinc-400 lg:inline">
                  {currentPkg.primaryInstaller.ext}
                </span>
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden md:hidden pt-2"
            >
              <div
                className="rounded-2xl p-4 backdrop-blur-2xl space-y-3"
                style={{
                  background: "rgba(14, 15, 18, 0.94)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <div className="flex flex-col space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span>GitHub Repository</span>
                    <Github className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};
