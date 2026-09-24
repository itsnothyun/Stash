import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Database,
  ArrowRight,
  Check,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export const FeatureSecurity: React.FC = () => {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const CORRECT_PIN = "1234";

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        if (next === CORRECT_PIN) {
          setIsUnlocked(true);
          setError(false);
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 700);
        }
      }
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setPin("");
  };

  return (
    <section id="security" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column */}
          <div className="text-left">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-emerald-500/20 text-emerald-400 text-[10px]">
                  ●
                </div>
                <span>Local SQLite</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-rose-500/20 text-rose-400 text-[10px]">
                  ▲
                </div>
                <span>4-Digit PIN Vault</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <span>Zero Telemetry</span>
              </div>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Your thoughts stay on your machine. Period.
            </h2>

            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              No accounts, no cloud sync, no tracking. Every note, token, and widget state is stored in an encrypted local SQLite database directly on your hard drive. Protect confidential notes with a per-note 4-digit PIN.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="#downloads"
                className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#1c1c22] px-4 py-2 text-xs font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.55),0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.7)] hover:bg-[#24242c] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Get Stash Free
              </a>
            </div>
          </div>

          {/* Right Column: Interactive PIN Vault Simulator */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#161619] p-6 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-white/[0.06] mb-5">
              <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-rose-400" />
                <span>Interactive Vault Simulator (Try PIN: 1234)</span>
              </span>
              {isUnlocked && (
                <button
                  type="button"
                  onClick={handleLockAgain}
                  className="flex items-center gap-1 rounded bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[11px] font-medium border border-rose-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.5)] hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Lock Again</span>
                </button>
              )}
            </div>

            {/* Unlocked View vs Locked Keypad */}
            <AnimatePresence mode="wait">
              {!isUnlocked ? (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-4 space-y-4"
                >
                  {/* Glowing Lock Ring */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10">
                    <Lock className="h-5 w-5" />
                  </div>

                  <div className="text-center">
                    <h4 className="text-sm font-medium text-white">
                      Confidential Note is Locked
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Enter 4-digit PIN to decrypt local session:
                    </p>
                  </div>

                  {/* 4 PIN Dots */}
                  <motion.div
                    animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex gap-3 my-1"
                  >
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`h-3 w-3 rounded-full border transition-all ${
                          error
                            ? "bg-rose-500 border-rose-500 shadow-sm shadow-rose-500"
                            : pin.length > idx
                            ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                            : "border-white/20 bg-white/5"
                        }`}
                      />
                    ))}
                  </motion.div>

                  {/* Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 w-48 mt-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === "C") setPin("");
                          else if (key === "←") setPin(pin.slice(0, -1));
                          else handleDigit(key);
                        }}
                        className="flex h-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#1e1e23] text-xs font-mono font-medium text-white shadow-[0_4px_10px_rgba(0,0,0,0.55)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.7)] hover:bg-[#25252c] active:translate-y-0.5 active:shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 text-xs"
                >
                  <div className="flex items-center gap-2 font-medium text-emerald-300">
                    <Unlock className="h-4 w-4" />
                    <span>Decrypted Local Stash Session</span>
                  </div>

                  <div className="font-mono text-zinc-300 bg-[#131316] p-3 rounded-lg border border-white/[0.08] space-y-1.5 text-[11px]">
                    <div className="text-zinc-500">// AES-256 GCM hardware decrypted:</div>
                    <div><span className="text-purple-400">AWS_ACCESS_KEY</span> = <span className="text-emerald-300">"AKIA_STASH_LIVE_7729"</span></div>
                    <div><span className="text-purple-400">DATABASE_URL</span> = <span className="text-cyan-300">"postgres://root:vault@127.0.0.1:5432"</span></div>
                    <div><span className="text-purple-400">SEED_PHRASE</span> = <span className="text-amber-300">"orbit velvet crystal nebula drift pulse"</span></div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono border-t border-white/[0.06]">
                    <span>Hardware key derivation</span>
                    <span className="text-emerald-400">Zero cloud telemetry</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance Comparison Bar */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Local Read Latency: &lt; 0.2ms</span>
              <span className="text-emerald-400 font-medium">100% Offline</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
