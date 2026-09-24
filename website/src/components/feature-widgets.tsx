import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Check, Plus, TrendingUp, Sparkles, DollarSign } from "lucide-react";

export const FeatureWidgets: React.FC = () => {
  const [payAmount, setPayAmount] = useState("1.50");
  const [fromToken, setFromToken] = useState<"ETH" | "BTC" | "USD" | "EUR">("ETH");
  const [toToken, setToToken] = useState<"USDC" | "USD" | "EUR" | "PHP">("USDC");
  const [inserted, setInserted] = useState(false);
  const [rotation, setRotation] = useState(0);

  const rates: Record<string, number> = {
    ETH: 3420.5,
    BTC: 94180.0,
    USD: 1.0,
    EUR: 1.085,
    USDC: 1.0,
    PHP: 0.0171,
  };

  const payUsd = (parseFloat(payAmount) || 0) * (rates[fromToken] || 1);
  const receiveAmount = rates[toToken] > 0 ? (payUsd / rates[toToken]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  const handleFlip = () => {
    setRotation(rotation + 180);
    const temp = fromToken;
    // @ts-ignore
    setFromToken(toToken);
    // @ts-ignore
    setToToken(temp);
  };

  const handleInsert = () => {
    setInserted(true);
    setTimeout(() => setInserted(false), 2200);
  };

  return (
    <section id="widgets" className="py-20 sm:py-28 border-t border-white/[0.06] relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column: Category Pills, Title, Description, Dark Pill Button */}
          <div className="text-left">
            {/* Stash Squircle Badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-amber-500/20 text-amber-400 text-[10px]">
                  ●
                </div>
                <span>Crypto & Forex</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-emerald-500/20 text-emerald-400 text-[10px]">
                  ▲
                </div>
                <span>Live Rates</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <span>1-Click Insert</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Instant conversions right inside your notes
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              Swap crypto and fiat currencies with live rates directly on your desk. Calculate totals, track liquidity, and insert one-click summaries without switching tabs.
            </p>

            {/* Dark Pill Button */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#downloads"
                className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800 hover:border-white/20 active:scale-95 shadow-xs"
              >
                Download Stash Free
              </a>
            </div>
          </div>

          {/* Right Column: Chart Card + Interactive Currency Swap Playground + Overlaid Badges */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-zinc-200">Currency Swap Widget</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <span>1 ETH = $3,420.50</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">Updated 2s ago</span>
              </div>
            </div>

            {/* Interactive Currency Converter Well */}
            <div className="space-y-3 relative z-20 mb-6 rounded-xl bg-black/40 border border-white/[0.08] p-3.5 backdrop-blur-md">
              {/* Pay Well */}
              <div className="flex items-center justify-between rounded-lg bg-zinc-900/70 border border-white/[0.06] p-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">You Pay</span>
                  <input
                    type="text"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="bg-transparent font-mono text-base font-bold text-white outline-none w-28"
                  />
                </div>
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value as any)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-white outline-none cursor-pointer hover:border-white/30 transition-colors"
                >
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              {/* Flip Button with Spring Rotation */}
              <div className="flex justify-center -my-2 relative z-30">
                <motion.button
                  type="button"
                  onClick={handleFlip}
                  animate={{ rotate: rotation }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-full bg-neutral-800 p-1.5 border border-white/20 text-zinc-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer shadow-md"
                  title="Swap currencies"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </motion.button>
              </div>

              {/* Receive Well */}
              <div className="flex items-center justify-between rounded-lg bg-zinc-900/70 border border-white/[0.06] p-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">You Receive (Calculated)</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {receiveAmount}
                  </span>
                </div>
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value as any)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-300 outline-none cursor-pointer hover:border-white/30 transition-colors"
                >
                  <option value="USDC">USDC (USD Coin)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="PHP">PHP (₱)</option>
                </select>
              </div>

              {/* Insert Summary Button */}
              <button
                type="button"
                onClick={handleInsert}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer"
              >
                {inserted ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Summary pasted into active note!</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Insert 1-Click Summary into Stash Note</span>
                  </>
                )}
              </button>
            </div>

            {/* Sparkline & Bar Chart of Rate History */}
            <div className="relative h-28 flex items-end justify-between pl-6 pb-4 border-b border-white/[0.06]">
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-6 top-0 border-b border-dashed border-white/[0.04]" />
              <div className="absolute inset-x-6 top-1/2 border-b border-dashed border-white/[0.04]" />

              {/* 16 Vertical Bars representing liquidity volume */}
              {[
                { h: "35%", c: "bg-cyan-500/70" },
                { h: "60%", c: "bg-emerald-500/70" },
                { h: "45%", c: "bg-purple-500/70" },
                { h: "80%", c: "bg-cyan-400" },
                { h: "50%", c: "bg-emerald-400" },
                { h: "70%", c: "bg-purple-400" },
                { h: "40%", c: "bg-cyan-500/70" },
                { h: "65%", c: "bg-emerald-500/70" },
                { h: "55%", c: "bg-purple-500/70" },
                { h: "90%", c: "bg-cyan-400" },
                { h: "45%", c: "bg-emerald-400" },
                { h: "75%", c: "bg-purple-400" },
                { h: "30%", c: "bg-cyan-500/70" },
                { h: "85%", c: "bg-emerald-500/70" },
                { h: "50%", c: "bg-purple-500/70" },
                { h: "70%", c: "bg-cyan-400" },
              ].map((bar, idx) => (
                <div key={idx} className="relative z-0 w-2.5 rounded-t-sm flex flex-col justify-end h-full">
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-t-sm ${bar.c} transition-all duration-300 hover:brightness-125`}
                  />
                </div>
              ))}
            </div>

            {/* X-axis timestamps */}
            <div className="flex justify-between pl-6 pt-2 text-[10px] font-mono text-zinc-500">
              <span>00:00 UTC</span>
              <span>06:00 UTC</span>
              <span>12:00 UTC</span>
              <span>18:00 UTC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
