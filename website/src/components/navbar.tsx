import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { detectUserOS, DOWNLOAD_PACKAGES, OperatingSystem, GITHUB_REPO } from "../lib/os-detect";
import stashLogoSrc from "../assets/logo.png";

interface NavbarProps {
  onNavigateToDocs?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToDocs, onNavigateHome }) => {
  const [os, setOs] = useState<OperatingSystem>("windows");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    setOs(detectUserOS());
  }, []);

  const currentPkg = DOWNLOAD_PACKAGES[os] || DOWNLOAD_PACKAGES.windows;

  const navLinks = [
    { label: "Home", href: "#" },
  ];

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Liquid Glass Shell - Sized properly by inner content */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative w-fit max-w-[calc(100vw-2rem)] rounded-full p-[2px] transition-all"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(200, 200, 200, 0.14) 12%, rgba(120, 120, 120, 0.08) 60%, rgba(255, 255, 255, 0.28) 100%)",
          boxShadow:
            "0 4px 14px rgba(0, 0, 0, 0.25), 0 12px 30px rgba(0, 0, 0, 0.4), 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
        }}
      >
        {/* Inner Glass Track */}
        <div
          className="relative flex items-center gap-2 sm:gap-3 rounded-full px-3 sm:px-4 py-1.5 backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(150deg, rgba(20, 22, 28, 0.85) 0%, rgba(12, 13, 16, 0.8) 50%, rgba(18, 20, 26, 0.85) 100%)",
            boxShadow:
              "inset 0px 1px 1.5px 0px rgba(255, 255, 255, 0.22), inset 0px -1px 1.5px 0px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Left: Brand Logo & Wordmark */}
          <a
            href="#"
            onClick={handleHomeClick}
            className="flex items-center gap-2 pl-1 pr-1.5 transition-transform hover:opacity-90 active:scale-95 cursor-pointer"
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

          {/* Divider */}
          <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* Center: Navigation Link */}
          <nav
            onMouseLeave={() => setHoveredIdx(null)}
            className="flex items-center relative px-1 py-0.5"
          >
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleHomeClick}
                onMouseEnter={() => setHoveredIdx(idx)}
                className="relative px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:text-white"
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

          {/* Divider */}
          <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* Right: GitHub Icon & Liquid Glass CTA Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>

            {/* Liquid Glass CTA Button */}
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
                className="group relative flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
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
                <span className="hidden font-mono text-[10px] text-zinc-400 sm:inline">
                  {currentPkg.primaryInstaller.ext}
                </span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};
