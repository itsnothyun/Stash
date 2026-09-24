import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Check } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What is Stash?",
    a: "Stash is a lightweight floating desktop scratchpad and modular HUD built with Tauri and Rust. It features live currency conversions, countdown timers, habits, and Markdown notes that float right where you work.",
  },
  {
    q: "Does Stash require an account or internet access?",
    a: "No. Stash is 100% offline-first. All your notes, settings, and revision histories are stored in a local SQLite database on your hard drive. Zero telemetry, zero external tracking.",
  },
  {
    q: "Can I self-host or sync my database?",
    a: "Yes. Your entire vault is stored in a single standard SQLite file. You can back it up, sync it via Syncthing or iCloud Drive, or encrypt it with hardware keys.",
  },
  {
    q: "Where are my notes and private keys stored?",
    a: "On Windows, in %APPDATA%\\com.stash.app\\stash.db. On macOS, in ~/Library/Application Support/com.stash.app/stash.db. Confidential notes can also be protected behind a 4-digit PIN.",
  },
  {
    q: "How does the 36px Window Shade feature work?",
    a: "Double-click any titlebar to collapse it into a minimal 36px micro-bar that hovers above your code, design canvas, or browser without obscuring your workspace.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [inquiry, setInquiry] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setInquiry("");
      setShowInput(false);
    }, 2500);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column */}
          <div className="text-left">
            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Questions
            </h2>
            <p className="mt-3 text-sm text-zinc-400 font-normal leading-relaxed">
              The short ones are here. For anything else, ask below.
            </p>
          </div>

          {/* Right Column: Minimal Accordion with Framer Motion Height Spring */}
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {FAQS.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-normal text-zinc-200 hover:text-white transition-colors cursor-pointer gap-4"
                  >
                    <span>{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="shrink-0 text-zinc-500"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 text-xs text-zinc-400 leading-relaxed pr-6">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Bottom Row: Ask anything else */}
            <div className="py-4">
              {!showInput ? (
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowInput(true)}
                  className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Ask anything else</span>
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    placeholder="Type your question..."
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none border-b border-white/20 pb-1"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
                  >
                    {submitted ? "Sent!" : "Submit"}
                  </motion.button>
                </motion.form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
