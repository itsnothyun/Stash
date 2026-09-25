import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  SignOut,
  X,
  ShieldCheck,
  ArrowClockwise,
  Coffee,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface QuirkyExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
}

const QUIRKY_HEADLINES = [
  { emoji: "🥺", text: "Wait, leaving so soon?" },
  { emoji: "🏴‍☠️", text: "Abandoning the Stash ship?" },
  { emoji: "🤠", text: "Whoa there, space cowboy!" },
  { emoji: "🛸", text: "Escape protocol initiated!" },
  { emoji: "🪴", text: "Going outside to touch grass?" },
  { emoji: "💾", text: "Don't leave me alone in RAM!" },
];

const QUIRKY_WISDOMS = [
  "Your notes are safe & snug in your local SQLite database, but we'll miss your keystrokes dearly.",
  "Remember: the outside world has no Ctrl+Z, no dark mode, and definitely no liquid glass widgets.",
  "Did you remember to drink some water, relax your shoulders, and unclench your jaw?",
  "Rumor has it that every time someone closes Stash, an unpinned sticky note sheds a tiny digital tear.",
  "Your open tasks might get lonely. Don't worry, they won't wander off, but they will be waiting patiently.",
  "Closing Stash will reduce your instantaneous productivity by approximately 42.8%. Are you ready for that reality?",
];

const FUNNY_EXCUSES = [
  "My cat demanded immediate keyboard supervision.",
  "Coffee deficit reaching critical systemic levels.",
  "Going to check if the real-world graphics got updated.",
  "Reaching spiritual enlightenment through closing tabs.",
  "Need to pretend I'm paying attention on a Zoom call.",
  "Stepping away before I start color-coding my shopping list.",
];

export const QuirkyExitModal: React.FC<QuirkyExitModalProps> = ({
  open,
  onOpenChange,
  onConfirmExit,
}) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [excuseIndex, setExcuseIndex] = useState<number | null>(null);

  // Randomize prompt on every modal opening
  useEffect(() => {
    if (open) {
      setHeadlineIndex(Math.floor(Math.random() * QUIRKY_HEADLINES.length));
      setWisdomIndex(Math.floor(Math.random() * QUIRKY_WISDOMS.length));
      setExcuseIndex(null);
    }
  }, [open]);

  // Handle ESC key to cancel
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const cycleExcuse = () => {
    setExcuseIndex((prev) =>
      prev === null ? 0 : (prev + 1) % FUNNY_EXCUSES.length
    );
  };

  const currentHeadline = QUIRKY_HEADLINES[headlineIndex];
  const currentWisdom = QUIRKY_WISDOMS[wisdomIndex];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={cn(
              "relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border select-none",
              "border-border/80 bg-background/95 backdrop-blur-xl",
              "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]",
              "p-6 text-foreground flex flex-col gap-5"
            )}
            role="alertdialog"
            aria-modal="true"
          >
            {/* Top Close icon */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header: Animated Avatar / Badge + Title */}
            <div className="flex items-start gap-4">
              <motion.div
                animate={{
                  rotate: [0, -6, 6, -3, 3, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 1.2 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-2xl shadow-inner"
              >
                {currentHeadline.emoji}
              </motion.div>

              <div className="flex flex-col gap-1 min-w-0 pr-5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/15">
                    Departure Warning
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug">
                  {currentHeadline.text}
                </h2>
              </div>
            </div>

            {/* Body Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentWisdom}
            </p>

            {/* Interactive Quirky Excuse Generator Box */}
            <div className="rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col gap-2 transition-all">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
                  <span>All stashes saved locally</span>
                </span>
                <button
                  type="button"
                  onClick={cycleExcuse}
                  className="flex items-center gap-1 text-[10px] font-semibold text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                  title="Generate a funny excuse"
                >
                  <ArrowClockwise className="h-2.5 w-2.5" />
                  <span>Excuse generator</span>
                </button>
              </div>

              {excuseIndex !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-surface-hover/80 px-2.5 py-1.5 text-[11px] italic text-foreground/90 border border-border/40 flex items-center gap-2"
                >
                  <Coffee className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span className="truncate">"{FUNNY_EXCUSES[excuseIndex]}"</span>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              {/* Confirm Exit (Subtle / Destructive) */}
              <button
                type="button"
                onClick={onConfirmExit}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all select-none cursor-pointer",
                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20",
                  "active:scale-95"
                )}
              >
                <SignOut className="h-3.5 w-3.5" />
                <span>Yes, let me escape</span>
              </button>

              {/* Cancel (Keep Stashing - Primary) */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenChange(false)}
                autoFocus
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all shadow-sm",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                )}
              >
                <Sparkle className="h-3.5 w-3.5" />
                <span>Never mind, stay in Stash!</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
