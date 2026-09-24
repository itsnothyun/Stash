import React, { useState, useEffect } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { ProofRibbon } from "./components/proof-ribbon";
import { FeatureWidgets } from "./components/feature-widgets";
import { FeatureFloating } from "./components/feature-floating";
import { FeatureShortcuts } from "./components/feature-shortcuts";
import { FeatureBenchmarks } from "./components/feature-benchmarks";
import { FeatureSecurity } from "./components/feature-security";
import { FaqSection } from "./components/faq-section";
import { DownloadMatrix } from "./components/download-matrix";
import { FooterCta } from "./components/footer-cta";
import { DocsPage } from "./components/docs-page";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "docs">(() => {
    return window.location.hash.startsWith("#docs") ? "docs" : "home";
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith("#docs")) {
        setCurrentView("docs");
      } else if (!window.location.hash || window.location.hash === "#" || !window.location.hash.startsWith("#docs")) {
        setCurrentView("home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateToDocs = () => {
    window.location.hash = "#docs";
    setCurrentView("docs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToHome = () => {
    window.location.hash = "#";
    setCurrentView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (currentView === "docs") {
    return <DocsPage onBackToHome={navigateToHome} />;
  }

  return (
    <div className="relative min-h-screen bg-[#121215] text-foreground antialiased selection:bg-white/20 selection:text-white canvas-ambient-glow">
      <Navbar onNavigateToDocs={navigateToDocs} onNavigateHome={navigateToHome} />
      <main className="relative z-10">
        <Hero />
        <ProofRibbon />
        <FeatureWidgets />
        <FeatureFloating />
        <FeatureShortcuts />
        <FeatureBenchmarks />
        <FeatureSecurity />

        {/* Documentation Teaser Ribbon */}
        <section id="docs-preview" className="py-16 relative">
          <div className="mx-auto max-w-5xl px-6 sm:px-8">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#161619] via-[#1a1a24] to-[#161619] p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Developer Documentation</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-[450] text-white tracking-tight">
                  Explore the full Stash developer docs
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Deep-dive into our local SQLite schemas, Tauri 2.0 Rust commands, AES-256 GCM cryptographic vaults, and complete keyboard shortcut reference.
                </p>
              </div>

              <button
                type="button"
                onClick={navigateToDocs}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.8)] hover:bg-neutral-100 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Read Documentation</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </button>
            </div>
          </div>
        </section>

        <FaqSection />
        <DownloadMatrix />
      </main>
      <FooterCta onNavigateToDocs={navigateToDocs} />
    </div>
  );
};

export default App;
