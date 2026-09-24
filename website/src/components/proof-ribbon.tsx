import React from "react";
import { Zap, ShieldCheck, Database, Cpu, WifiOff, Feather, Layers } from "lucide-react";

export const ProofRibbon: React.FC = () => {
  const items = [
    { icon: <Cpu className="h-4 w-4 text-orange-400" />, label: "Tauri 2.0 & Rust", sub: "Native Core" },
    { icon: <Database className="h-4 w-4 text-emerald-400" />, label: "Local SQLite", sub: "Zero Cloud" },
    { icon: <WifiOff className="h-4 w-4 text-cyan-400" />, label: "100% Offline", sub: "Fully Private" },
    { icon: <Zap className="h-4 w-4 text-amber-400" />, label: "< 25ms Launch", sub: "Instant Cold Start" },
    { icon: <Feather className="h-4 w-4 text-purple-400" />, label: "< 35MB RAM", sub: "Zero Chromium Bloat" },
    { icon: <ShieldCheck className="h-4 w-4 text-rose-400" />, label: "PIN Vault", sub: "4-Digit Lock" },
  ];

  return (
    <div className="border-y border-white/10 bg-neutral-950/60 py-6">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:border-white/10"
            >
              <div className="rounded-lg bg-white/5 p-2 shrink-0">{item.icon}</div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-foreground truncate">
                  {item.label}
                </span>
                <span className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
                  {item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
