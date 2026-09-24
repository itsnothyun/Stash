import React from "react";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { ProofRibbon } from "./components/proof-ribbon";
import { FeatureWidgets } from "./components/feature-widgets";
import { FeatureFloating } from "./components/feature-floating";
import { FeatureSecurity } from "./components/feature-security";
import { FaqSection } from "./components/faq-section";
import { DownloadMatrix } from "./components/download-matrix";
import { FooterCta } from "./components/footer-cta";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-foreground antialiased selection:bg-white/20 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <ProofRibbon />
        <FeatureWidgets />
        <FeatureFloating />
        <FeatureSecurity />
        <FaqSection />
        <DownloadMatrix />
      </main>
      <FooterCta />
    </div>
  );
};

export default App;
