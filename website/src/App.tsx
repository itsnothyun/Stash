import React from "react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { ProofRibbon } from "./components/proof-ribbon";
import { FeatureFloating } from "./components/feature-floating";
import { FeatureWidgets } from "./components/feature-widgets";
import { FeatureSecurity } from "./components/feature-security";
import { FeatureTactile } from "./components/feature-tactile";
import { DownloadMatrix } from "./components/download-matrix";
import { FaqSection } from "./components/faq-section";
import { FooterCta } from "./components/footer-cta";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      <Navbar />
      <main>
        <Hero />
        <ProofRibbon />
        <FeatureFloating />
        <FeatureWidgets />
        <FeatureSecurity />
        <FeatureTactile />
        <DownloadMatrix />
        <FaqSection />
      </main>
      <FooterCta />
    </div>
  );
};

export default App;
