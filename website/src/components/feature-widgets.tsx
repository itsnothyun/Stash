import React, { useState } from "react";
import {
  ArrowUpDown,
  CalendarClock,
  Kanban,
  Check,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";

export const FeatureWidgets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"swap" | "timer" | "kanban">("swap");

  // Currency Converter playground state
  const [payAmount, setPayAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState<"USD" | "EUR" | "ETH" | "PHP">("USD");
  const [toCurrency, setToCurrency] = useState<"EUR" | "USD" | "PHP" | "ETH">("EUR");
  const [insertedFeedback, setInsertedFeedback] = useState(false);

  const rates: Record<string, number> = {
    USD: 1.0,
    EUR: 1.09,
    ETH: 2630.0,
    PHP: 0.0175,
  };

  const payUsd = (parseFloat(payAmount) || 0) * rates[fromCurrency];
  const receiveAmount = rates[toCurrency] > 0 ? (payUsd / rates[toCurrency]).toFixed(2) : "0.00";

  const handleFlip = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency as any);
    setToCurrency(temp as any);
  };

  const handleInsert = () => {
    setInsertedFeedback(true);
    setTimeout(() => setInsertedFeedback(false), 2000);
  };

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1500); // 25 mins

  return (
    <section id="widgets" className="py-20 sm:py-28 border-b border-white/10 bg-neutral-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
          {/* Left Column */}
          <div className="max-w-md">
            <ul className="mb-5 flex flex-wrap gap-2 text-[12px] font-medium text-muted-foreground list-none p-0">
              <li className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                <ArrowUpDown className="h-3 w-3" />
                <span>Live Rates</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-orange-300">
                <CalendarClock className="h-3 w-3" />
                <span>Countdown & Focus</span>
              </li>
              <li className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">
                <Kanban className="h-3 w-3" />
                <span>Kanban & Tasks</span>
              </li>
            </ul>

            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              Mini apps inside your notes.
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Stop opening browser tabs for currency calculations, countdown timers, or habit checklists. Attach lightweight micro-widgets directly to any note and insert live outputs with one click.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-white/10"
              >
                <span>Download Stash</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Interactive Widget Playground */}
          <div className="rounded-2xl border border-white/15 bg-neutral-950 p-4 sm:p-6 shadow-2xl">
            {/* Widget Category Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("swap")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "swap"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Currency Swap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("timer")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "timer"
                      ? "bg-orange-500/20 border border-orange-500/40 text-orange-300"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Countdown & Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "kanban"
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Kanban Board</span>
                </button>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                Interactive preview
              </span>
            </div>

            {/* Tab 1: Currency Converter Playground */}
            {activeTab === "swap" && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
                    Currency & Token Converter
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live ECB & CoinGecko rates
                  </span>
                </div>

                {/* From Input Well */}
                <div className="flex items-center justify-between rounded-xl bg-black/50 border border-white/10 p-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                      Pay
                    </label>
                    <input
                      type="text"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="bg-transparent font-mono text-lg font-bold text-white outline-none w-32"
                    />
                  </div>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value as any)}
                    className="bg-neutral-800 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold text-white cursor-pointer outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="ETH">ETH (Ξ)</option>
                    <option value="PHP">PHP (₱)</option>
                  </select>
                </div>

                {/* Flip Button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button
                    type="button"
                    onClick={handleFlip}
                    className="rounded-full bg-neutral-800 p-1.5 border border-white/20 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    title="Flip currencies"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* To Input Well */}
                <div className="flex items-center justify-between rounded-xl bg-black/50 border border-white/10 p-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                      Receive (Calculated)
                    </label>
                    <span className="font-mono text-lg font-bold text-emerald-400">
                      {receiveAmount}
                    </span>
                  </div>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value as any)}
                    className="bg-neutral-800 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold text-white cursor-pointer outline-none"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="ETH">ETH (Ξ)</option>
                  </select>
                </div>

                {/* Insert into Note Button */}
                <button
                  type="button"
                  onClick={handleInsert}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
                >
                  {insertedFeedback ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied to note doc!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Insert 1-Click Summary into Note</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 2: Countdown Timer */}
            {activeTab === "timer" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-orange-400" />
                    Product Launch Countdown
                  </span>
                  <span className="font-mono text-orange-400 text-xs">25:00 Remaining</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Days", val: "14" },
                    { label: "Hours", val: "08" },
                    { label: "Mins", val: "42" },
                    { label: "Secs", val: "19" },
                  ].map((unit, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-black/40 p-3 flex flex-col items-center"
                    >
                      <span className="font-mono text-2xl font-bold text-white">{unit.val}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{unit.label}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-orange-500/10 border border-orange-500/25 p-3 text-xs text-orange-200">
                  ⚡ Native sound alerts & system notifications trigger even when Stash is minimized.
                </div>
              </div>
            )}

            {/* Tab 3: Kanban Board */}
            {activeTab === "kanban" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                    <span className="font-semibold text-foreground block mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      To Do (2)
                    </span>
                    <div className="rounded bg-neutral-800/80 p-2 border border-white/5 text-2xs mb-1.5">
                      Fix macOS notarization
                    </div>
                    <div className="rounded bg-neutral-800/80 p-2 border border-white/5 text-2xs">
                      Update release checksums
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                    <span className="font-semibold text-foreground block mb-2 text-[11px] uppercase tracking-wider text-cyan-400">
                      Doing (1)
                    </span>
                    <div className="rounded bg-cyan-950/40 p-2 border border-cyan-500/30 text-2xs text-cyan-200">
                      Marketing website build
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                    <span className="font-semibold text-foreground block mb-2 text-[11px] uppercase tracking-wider text-emerald-400">
                      Done (3)
                    </span>
                    <div className="rounded bg-emerald-950/40 p-2 border border-emerald-500/30 text-2xs text-emerald-200">
                      Tauri 2.0 migration
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
