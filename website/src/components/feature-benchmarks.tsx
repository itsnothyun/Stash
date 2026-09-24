import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Zap,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

interface BenchmarkMetric {
  title: string;
  stashValue: string;
  electronValue: string;
  unit: string;
  stashRatio: string;
  description: string;
  stashPercentage: number;
  electronPercentage: number;
}

const METRICS: BenchmarkMetric[] = [
  {
    title: "RAM Consumption",
    stashValue: "12.8",
    electronValue: "186.4",
    unit: "MB",
    stashRatio: "14.5x lighter",
    description: "Tauri 2.0 leverages the OS's native webview instead of shipping an entire bundled Chromium instance.",
    stashPercentage: 12,
    electronPercentage: 92,
  },
  {
    title: "Cold Launch Time",
    stashValue: "140",
    electronValue: "2,350",
    unit: "ms",
    stashRatio: "16.7x faster",
    description: "Native Rust binaries initialize SQLite schemas directly into memory without multi-process IPC lag.",
    stashPercentage: 10,
    electronPercentage: 95,
  },
  {
    title: "Installer Package Size",
    stashValue: "4.8",
    electronValue: "124.0",
    unit: "MB",
    stashRatio: "25.8x smaller",
    description: "Compact installer footprint that downloads in under 3 seconds on any standard connection.",
    stashPercentage: 8,
    electronPercentage: 96,
  },
  {
    title: "Background Network Requests",
    stashValue: "0",
    electronValue: "48+",
    unit: "req/hr",
    stashRatio: "100% offline",
    description: "Zero analytics, zero tracking beacons, and zero telemetry pinging remote servers.",
    stashPercentage: 0,
    electronPercentage: 80,
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Core Engine",
    stash: "Rust + Tauri 2.0 Native",
    electron: "Chromium + Node.js IPC",
    stashAdvantage: true,
  },
  {
    feature: "Data Storage",
    stash: "Local SQLite (AES-256 GCM)",
    electron: "Plaintext IndexedDB / Cloud",
    stashAdvantage: true,
  },
  {
    feature: "Offline Operation",
    stash: "100% Offline by Default",
    electron: "Degraded without Cloud Auth",
    stashAdvantage: true,
  },
  {
    feature: "Floating Window Shades",
    stash: "Native 36px Hardware Acceleration",
    electron: "High CPU Window Repainting",
    stashAdvantage: true,
  },
  {
    feature: "Security Boundary",
    stash: "Hardware Key Derivation & PIN Vault",
    electron: "Vulnerable to NPM Supply Chain",
    stashAdvantage: true,
  },
];

export const FeatureBenchmarks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"metrics" | "architecture">("metrics");

  return (
    <section id="benchmarks" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* Section Heading */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400 mb-3">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Architecture & Performance</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
            Why Stash feels instant
          </h2>
          <p className="mt-3 text-sm text-zinc-400 font-normal leading-relaxed max-w-xl">
            Most desktop note apps pack full Chromium browsers eating hundreds of megabytes of RAM. Stash is compiled directly to native machine code with Tauri 2.0 and Rust.
          </p>

          {/* Toggle pill */}
          <div className="mt-6 inline-flex rounded-full border border-white/[0.08] bg-[#161619] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setActiveTab("metrics")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-white text-black shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Benchmark Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                activeTab === "architecture"
                  ? "bg-white text-black shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Architectural Comparison
            </button>
          </div>
        </div>

        {/* Tab 1: Benchmark Metric Bars */}
        {activeTab === "metrics" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {METRICS.map((metric, idx) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/[0.08] bg-[#161619] p-6 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                  <h3 className="text-sm font-medium text-white">{metric.title}</h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold">
                    {metric.stashRatio}
                  </span>
                </div>

                {/* Stash Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Stash (Rust)
                    </span>
                    <span className="text-white font-medium">
                      {metric.stashValue} {metric.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(metric.stashPercentage, 4)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    />
                  </div>
                </div>

                {/* Traditional Electron Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>Traditional Electron Notes</span>
                    <span>
                      {metric.electronValue} {metric.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.electronPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-zinc-600/70"
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {metric.description}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Tab 2: Architecture Matrix Table */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/[0.08] bg-[#161619] shadow-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#121215] text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3.5 px-6 font-medium">Architecture Vector</th>
                    <th className="py-3.5 px-6 font-medium text-emerald-400">
                      Stash Desktop
                    </th>
                    <th className="py-3.5 px-6 font-medium text-zinc-500">
                      Standard Electron Apps
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6 font-medium text-white flex items-center gap-2">
                        <span>{row.feature}</span>
                      </td>
                      <td className="py-3.5 px-6 text-emerald-300 font-mono">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{row.stash}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-zinc-400 font-mono">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-zinc-600 shrink-0" />
                          <span>{row.electron}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-[#121215] border-t border-white/[0.06] text-[11px] text-zinc-500 font-mono flex items-center justify-between">
              <span>* Benchmarks measured on Apple M-series & Intel Core i7 13th Gen desktop</span>
              <span className="text-emerald-400">Zero Node.js dependency</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
