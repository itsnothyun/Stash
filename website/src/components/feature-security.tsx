import React, { useState } from "react";
import { Lock, Unlock, Database, KeyRound, ShieldCheck, ArrowRight, Check } from "lucide-react";

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
          }, 800);
        }
      }
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setPin("");
  };

  return (
    <section id="security" className="py-20 sm:py-28 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column */}
          <div className="max-w-md">
            <ul className="mb-5 flex flex-wrap gap-2 text-[12px] font-medium text-muted-foreground list-none p-0">
              <li className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                <Database className="h-3 w-3" />
                <span>Local SQLite</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-300">
                <Lock className="h-3 w-3" />
                <span>4-Digit PIN Vault</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-purple-300">
                <ShieldCheck className="h-3 w-3" />
                <span>Zero Telemetry</span>
              </li>
            </ul>

            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              No accounts. No cloud lock-in. Your thoughts stay local.
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Every note, task, and revision checkpoint is stored in a local SQLite database directly on your hard drive. Protect confidential client stashes behind a per-note 4-digit PIN with session timeouts.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-white/10"
              >
                <span>Get Stash free</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive PIN Vault Simulator */}
          <div className="rounded-2xl border border-white/15 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5 text-xs text-muted-foreground">
              <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-rose-400" />
                Interactive Security Vault (Try PIN: 1234)
              </span>
              {isUnlocked && (
                <button
                  type="button"
                  onClick={handleLockAgain}
                  className="rounded bg-rose-500/20 text-rose-300 px-2 py-0.5 text-2xs font-semibold hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  Lock Again
                </button>
              )}
            </div>

            {!isUnlocked ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-lg">
                  <Lock className="h-6 w-6" />
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-semibold text-foreground">
                    This Stash is PIN Protected
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter 4-digit PIN to decrypt session:
                  </p>
                </div>

                {/* PIN Dots */}
                <div className="flex gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-3 w-3 rounded-full border transition-all ${
                        error
                          ? "bg-rose-500 border-rose-500 animate-shake"
                          : pin.length > idx
                          ? "bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-400/50"
                          : "border-white/20 bg-white/5"
                      }`}
                    />
                  ))}
                </div>

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
                      className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-neutral-900 text-xs font-mono font-semibold text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 text-xs animate-fadeIn">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <Unlock className="h-4 w-4" />
                  <span>Vault Unlocked — Confidential Stash</span>
                </div>
                <div className="font-mono text-muted-foreground bg-black/40 p-3 rounded-lg border border-white/10 space-y-1">
                  <div>AWS_SECRET_KEY = "AKIA_DEMO_9918237"</div>
                  <div>DATABASE_URL = "postgres://root:vault99@db:5432/main"</div>
                  <div>MNEMONIC_SEED = "orbit velvet crystal nebula drift pulse"</div>
                </div>
                <p className="text-2xs text-emerald-400/80">
                  ✓ Automatically locks when the window closes or your custom inactivity timer expires.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
