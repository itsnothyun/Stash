import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  HardDrives as HardDrive,
  Gauge,
  Lightning,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  Play,
  Pause,
  Database,
  ShieldCheck,
  Desktop,
  Pulse,
  CaretRight,
  Globe,
  Thermometer,
  MagnifyingGlass,
  StopCircle,
  ArrowDown,
  ArrowUp,
  AppWindow,
  Flame,
  X,
  Clock,
  SquaresFour,
} from "@phosphor-icons/react";
import {
  stashIpc,
  SystemPerformanceSnapshot,
  OptimizationResult,
  AppProcessInfo,
} from "@/lib/ipc/stash-ipc";
import {
  detectGpuDiagnostics,
  GpuDiagnostics,
  analyzeBottlenecks,
  SystemBottleneckAnalysis,
  formatBytes,
  formatSpeed,
  formatDuration,
} from "../hardware-detect";
import { toast } from "@/components/ui/toast";
import { PremiumSelect } from "@/components/ui/premium-select";
import { ProcessAppIcon } from "./process-app-icon";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";

type PerformanceTab = "apps" | "cockpit" | "bottlenecks" | "turbo";
type ProcessSortField = "cpu" | "memory" | "name" | "pid";

interface PerformanceHubProps {
  className?: string;
}

export const PerformanceHub: React.FC<PerformanceHubProps> = ({ className }) => {
  const { iconSet } = useUIStore();
  const isColorful = iconSet === "colorful";

  const [snapshot, setSnapshot] = useState<SystemPerformanceSnapshot | null>(null);
  const [gpu, setGpu] = useState<GpuDiagnostics | null>(null);
  const [analysis, setAnalysis] = useState<SystemBottleneckAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<PerformanceTab>("apps");

  // Polling settings: 1500ms, 2000ms, 5000ms, or 0 (paused)
  const [refreshInterval, setRefreshInterval] = useState<number>(2000);
  const [isPaused, setIsPaused] = useState(false);

  // Live UI Frame Rate counter
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Live Database Ping round-trip
  const [dbPingMs, setDbPingMs] = useState<number | null>(null);

  // History buffer for sparkline graph (last 16 data points of CPU & RAM %)
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);

  // Category filter for bottleneck radar
  const [activeAlertCategory, setActiveAlertCategory] = useState<string>("all");

  // Process Inspector filters & sorting
  const [processSearch, setProcessSearch] = useState("");
  const [processSort, setProcessSort] = useState<ProcessSortField>("cpu");
  const [processSortAsc, setProcessSortAsc] = useState(false);
  const [processFilterMode, setProcessFilterMode] = useState<"all" | "heavy" | "user">("all");

  // Process termination modal state
  const [processToKill, setProcessToKill] = useState<AppProcessInfo | null>(null);
  const [isKilling, setIsKilling] = useState(false);

  // Track FPS smoothly using requestAnimationFrame
  useEffect(() => {
    let active = true;
    const calcFps = (now: number) => {
      if (!active) return;
      frameCountRef.current++;
      const delta = now - lastFpsTimeRef.current;
      if (delta >= 1000) {
        const measuredFps = Math.min(144, Math.round((frameCountRef.current * 1000) / delta));
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      rafIdRef.current = requestAnimationFrame(calcFps);
    };

    rafIdRef.current = requestAnimationFrame(calcFps);
    return () => {
      active = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Fetch performance snapshot
  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    const startPing = performance.now();

    try {
      const data = await stashIpc.getSystemPerformance();
      const pingDuration = Math.max(0.1, Number((performance.now() - startPing).toFixed(1)));
      setDbPingMs(pingDuration);

      setSnapshot(data);

      const gpuInfo = detectGpuDiagnostics();
      setGpu(gpuInfo);

      const analyzed = analyzeBottlenecks(data, fps);
      setAnalysis(analyzed);

      // Append to historical sparklines
      setCpuHistory((prev) => [...prev.slice(-15), Math.round(data.global_cpu_usage)]);
      const ramPct = data.total_memory > 0 ? Math.round((data.used_memory / data.total_memory) * 100) : 0;
      setRamHistory((prev) => [...prev.slice(-15), ramPct]);
    } catch (err) {
      console.error("Failed to load performance metrics:", err);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [fps]);

  // Initial load
  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  // Polling loop with Page Visibility pause (saves CPU when Stash is minimized or tab is blurred)
  useEffect(() => {
    if (isPaused || refreshInterval <= 0) return;

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [fetchMetrics, isPaused, refreshInterval]);

  // Stash Turbo Optimization execution (No emoji stars)
  const handleOptimizeStash = async () => {
    setIsOptimizing(true);
    try {
      const result: OptimizationResult = await stashIpc.optimizeStashSystem();
      await fetchMetrics(true);

      const freedMb = (result.memory_freed_estimate_bytes / (1024 * 1024)).toFixed(2);
      toast.show({
        message: `Stash Turbo Compaction Complete: ${freedMb} MB memory reclaimed.`,
      });
    } catch (err) {
      toast.error("Optimization failed", String(err));
    } finally {
      setIsOptimizing(false);
    }
  };

  // Terminate runaway process handler
  const handleConfirmKillProcess = async () => {
    if (!processToKill) return;
    setIsKilling(true);
    try {
      const success = await stashIpc.killProcess(processToKill.pid);
      if (success) {
        toast.show({
          message: `Closed application: ${processToKill.name} (PID: ${processToKill.pid})`,
        });
        setProcessToKill(null);
        await fetchMetrics(true);
      } else {
        toast.error("Unable to close process", "The application could not be terminated or already exited.");
      }
    } catch (err) {
      toast.error("Failed to end process", String(err));
    } finally {
      setIsKilling(false);
    }
  };

  const ramUsagePct =
    snapshot && snapshot.total_memory > 0
      ? (snapshot.used_memory / snapshot.total_memory) * 100
      : 0;

  // Filtered and sorted processes
  const filteredProcesses = useMemo(() => {
    if (!snapshot || !snapshot.processes) return [];
    let list = [...snapshot.processes];

    if (processSearch.trim()) {
      const q = processSearch.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.pid).includes(q)
      );
    }

    if (processFilterMode === "heavy") {
      list = list.filter(
        (p) => p.cpu_usage >= 3.0 || p.memory_bytes >= 200 * 1024 * 1024
      );
    } else if (processFilterMode === "user") {
      list = list.filter((p) => !p.name.startsWith("svchost") && !p.name.startsWith("System"));
    }

    list.sort((a, b) => {
      let result = 0;
      if (processSort === "cpu") {
        result = b.cpu_usage - a.cpu_usage;
      } else if (processSort === "memory") {
        result = b.memory_bytes - a.memory_bytes;
      } else if (processSort === "name") {
        result = a.name.localeCompare(b.name);
      } else if (processSort === "pid") {
        result = a.pid - b.pid;
      }
      return processSortAsc ? -result : result;
    });

    return list;
  }, [snapshot, processSearch, processFilterMode, processSort, processSortAsc]);

  // Bottleneck alerts filter
  const filteredAlerts = useMemo(() => {
    return (analysis?.alerts || []).filter((a) => {
      if (activeAlertCategory === "all") return true;
      if (activeAlertCategory === "bottlenecks")
        return a.severity === "warning" || a.severity === "critical";
      return a.category.toLowerCase() === activeAlertCategory.toLowerCase();
    });
  }, [analysis, activeAlertCategory]);

  const topCpu = snapshot?.top_cpu_consumer;
  const topRam = snapshot?.top_ram_consumer;

  if (isLoading && !snapshot) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-20 gap-3 text-muted-foreground", className)}>
        <Gauge className="h-8 w-8 animate-pulse text-primary" />
        <span className="text-xs font-medium">Scanning system hardware & running applications…</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full", className)}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & VITAL SIGNS COCKPIT BAR                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-colors",
                isColorful
                  ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                  : "bg-muted text-foreground border-border"
              )}
            >
              <Gauge className="h-5 w-5" weight="bold" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  Performance & Process Monitor
                </h1>
                {analysis && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 shadow-2xs",
                      analysis.statusColor
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    <span>Health: {analysis.healthScore}/100 · {analysis.overallStatus}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live system telemetry, process inspector, and resource monitor.
              </p>
            </div>
          </div>

          {/* Action Toolbar: Custom Premium Dropdowns & Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Live Polling Toggle */}
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/70 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
              title={isPaused ? "Resume live polling" : "Pause live polling"}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-500" weight="fill" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-500" weight="fill" />
                  <span>Live Feed</span>
                </>
              )}
            </button>

            {/* Premium Polling Interval Selector */}
            <PremiumSelect<number>
              value={refreshInterval}
              onChange={setRefreshInterval}
              options={[
                { value: 1500, label: "1.5s (Fast)" },
                { value: 2000, label: "2.0s (Balanced)" },
                { value: 5000, label: "5.0s (Eco)" },
              ]}
              align="end"
            />

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => void fetchMetrics(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/70 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <ArrowClockwise className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>

            {/* Turbo Optimize Button (No emoji stars) */}
            <button
              type="button"
              onClick={handleOptimizeStash}
              disabled={isOptimizing}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs shadow-primary/20",
                "bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              )}
            >
              <Lightning className={cn("h-3.5 w-3.5", isOptimizing && "animate-spin")} weight="fill" />
              <span>{isOptimizing ? "Compacting…" : "Turbo Optimize Stash"}</span>
            </button>
          </div>
        </div>

        {/* Vital Signs Ribbon Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 border-t border-border/50 text-xs">
          {/* CPU Global */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Cpu className={cn("h-3 w-3", isColorful ? "text-blue-500" : "text-foreground")} />
              <span>CPU Load</span>
            </span>
            <span className="font-mono text-sm font-bold text-foreground mt-0.5">
              {snapshot ? `${snapshot.global_cpu_usage.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {snapshot ? `${snapshot.physical_core_count} Cores / ${snapshot.logical_core_count} Threads` : ""}
            </span>
          </div>

          {/* RAM Memory */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Pulse className={cn("h-3 w-3", isColorful ? "text-emerald-500" : "text-foreground")} />
              <span>RAM Used</span>
            </span>
            <span className="font-mono text-sm font-bold text-foreground mt-0.5">
              {ramUsagePct.toFixed(0)}%
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {snapshot ? `${formatBytes(snapshot.used_memory)} / ${formatBytes(snapshot.total_memory)}` : ""}
            </span>
          </div>

          {/* Network Throughput */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Globe className={cn("h-3 w-3", isColorful ? "text-cyan-500" : "text-foreground")} />
              <span>Network</span>
            </span>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs font-bold">
              <span className="text-emerald-500 flex items-center gap-0.5">
                <ArrowDown className="h-3 w-3 shrink-0" />
                <span>{snapshot?.network ? formatSpeed(snapshot.network.rx_rate_bytes_per_sec) : "0 KB/s"}</span>
              </span>
              <span className="text-blue-500 flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3 shrink-0" />
                <span>{snapshot?.network ? formatSpeed(snapshot.network.tx_rate_bytes_per_sec) : "0 KB/s"}</span>
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {snapshot?.network?.active_interfaces || 1} Interfaces
            </span>
          </div>

          {/* Thermal Temp */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Thermometer className={cn("h-3 w-3", isColorful ? "text-rose-500" : "text-foreground")} />
              <span>Package Temp</span>
            </span>
            <span className="font-mono text-sm font-bold text-foreground mt-0.5">
              {snapshot?.thermal?.package_temp_celsius != null
                ? `${snapshot.thermal.package_temp_celsius.toFixed(0)}°C`
                : "Nominal"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {snapshot?.thermal?.package_temp_celsius != null && snapshot.thermal.package_temp_celsius > 80
                ? "Warm Load"
                : "Normal Thermal"}
            </span>
          </div>

          {/* Stash Footprint */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Lightning className="h-3 w-3 text-primary" weight="fill" />
              <span>Stash Memory</span>
            </span>
            <span className="font-mono text-sm font-bold text-emerald-500 mt-0.5">
              {snapshot?.stash_process ? formatBytes(snapshot.stash_process.memory_bytes) : "48 MB"}
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">
              &lt; 0.1% System RAM
            </span>
          </div>

          {/* Engine Latency */}
          <div className="flex flex-col p-2.5 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Database className="h-3 w-3 text-primary" />
              <span>SQLite IPC</span>
            </span>
            <span className="font-mono text-sm font-bold text-foreground mt-0.5">
              {dbPingMs !== null ? `${dbPingMs} ms` : "0.2 ms"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {fps} FPS Render
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP RESOURCE CONSUMERS SPOTLIGHT (With Actual App Icons)               */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Flame className="h-4 w-4 text-rose-500" weight="bold" />
            <span>Top Resource Consumers</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {snapshot?.total_processes_count || 0} active processes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card A: Highest CPU Consumer */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ProcessAppIcon
                  processName={topCpu?.name || "App"}
                  isStash={topCpu?.is_stash}
                  size={24}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-500 border border-rose-500/25">
                      Highest CPU
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      PID: {topCpu?.pid || "—"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-0.5 truncate" title={topCpu?.name}>
                    {topCpu?.name || "System Idle"}
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-lg font-bold text-rose-500">
                  {topCpu ? `${topCpu.cpu_usage.toFixed(1)}%` : "0%"}
                </span>
                <p className="text-[10px] text-muted-foreground">CPU Load</p>
              </div>
            </div>

            {/* Meter Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-rose-500"
                  animate={{ width: `${Math.min(100, Math.max(8, topCpu?.cpu_usage || 0))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{topCpu ? formatDuration(topCpu.run_time_secs) : "—"}</span>
                </span>
                <span>RAM: {topCpu ? formatBytes(topCpu.memory_bytes) : "—"}</span>
                {topCpu && (
                  <button
                    type="button"
                    onClick={() => setProcessToKill(topCpu)}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    <span>End Task</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card B: Highest RAM Consumer */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ProcessAppIcon
                  processName={topRam?.name || "App"}
                  isStash={topRam?.is_stash}
                  size={24}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      Highest Memory
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      PID: {topRam?.pid || "—"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-0.5 truncate" title={topRam?.name}>
                    {topRam?.name || "System Idle"}
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-lg font-bold text-emerald-500">
                  {topRam ? formatBytes(topRam.memory_bytes) : "0 MB"}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {topRam && snapshot && snapshot.total_memory > 0
                    ? `${((topRam.memory_bytes / snapshot.total_memory) * 100).toFixed(1)}% of total RAM`
                    : "Working Set"}
                </p>
              </div>
            </div>

            {/* Meter Bar */}
            <div className="space-y-1.5">
              {(() => {
                const memPct =
                  topRam && snapshot && snapshot.total_memory > 0
                    ? (topRam.memory_bytes / snapshot.total_memory) * 100
                    : 0;
                return (
                  <>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        animate={{ width: `${Math.min(100, Math.max(8, memPct))}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{topRam ? formatDuration(topRam.run_time_secs) : "—"}</span>
                      </span>
                      <span>CPU: {topRam ? `${topRam.cpu_usage.toFixed(1)}%` : "0%"}</span>
                      {topRam && (
                        <button
                          type="button"
                          onClick={() => setProcessToKill(topRam)}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <StopCircle className="h-3.5 w-3.5" />
                          <span>End Task</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("apps")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "apps"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AppWindow className="h-4 w-4 text-indigo-500" weight="bold" />
            <span>Applications ({snapshot?.total_processes_count || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cockpit")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "cockpit"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SquaresFour className="h-4 w-4 text-blue-500" weight="bold" />
            <span>Hardware Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bottlenecks")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "bottlenecks"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" weight="bold" />
            <span>Bottlenecks</span>
            {filteredAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                {filteredAlerts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("turbo")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "turbo"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Lightning className="h-4 w-4 text-amber-500" weight="fill" />
            <span>Stash Turbo</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{snapshot?.hostname || "DESKTOP"}</span>
          <span>·</span>
          <span>{snapshot?.os_name || "Windows"}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: RUNNING APPLICATIONS & PROCESS INSPECTOR                  */}
      {/* ========================================================================= */}
      {activeTab === "apps" && (
        <div className="flex flex-col gap-3.5">
          {/* Controls Bar: Search, Category Filters, Premium Select Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={processSearch}
                onChange={(e) => setProcessSearch(e.target.value)}
                placeholder="Search processes or PID…"
                className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs bg-background border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
              {processSearch && (
                <button
                  type="button"
                  onClick={() => setProcessSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Mode Buttons */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setProcessFilterMode("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]",
                  processFilterMode === "all"
                    ? "bg-secondary text-secondary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setProcessFilterMode("heavy")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px] flex items-center gap-1",
                  processFilterMode === "heavy"
                    ? "bg-rose-500/15 text-rose-500 font-bold border border-rose-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Flame className="h-3 w-3" />
                <span>Heavy Impact</span>
              </button>
              <button
                type="button"
                onClick={() => setProcessFilterMode("user")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]",
                  processFilterMode === "user"
                    ? "bg-secondary text-secondary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                User Apps
              </button>
            </div>

            {/* Premium Select Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <PremiumSelect<ProcessSortField>
                value={processSort}
                onChange={setProcessSort}
                options={[
                  { value: "cpu", label: "CPU Usage" },
                  { value: "memory", label: "Memory (RAM)" },
                  { value: "name", label: "Name (A–Z)" },
                  { value: "pid", label: "PID" },
                ]}
                align="end"
              />

              <button
                type="button"
                onClick={() => setProcessSortAsc((asc) => !asc)}
                className="p-1.5 rounded-lg border border-border/70 bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={processSortAsc ? "Ascending order" : "Descending order"}
              >
                {processSortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Process Table with Real App Icons */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-4">Application</th>
                    <th className="py-2.5 px-3">PID</th>
                    <th className="py-2.5 px-3 text-right">CPU %</th>
                    <th className="py-2.5 px-3">CPU</th>
                    <th className="py-2.5 px-3 text-right">Memory</th>
                    <th className="py-2.5 px-3">RAM</th>
                    <th className="py-2.5 px-3">Uptime</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {filteredProcesses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground font-sans">
                        <MagnifyingGlass className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                        <p className="text-xs font-semibold">No applications found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProcesses.map((proc) => {
                      const ramPct =
                        snapshot && snapshot.total_memory > 0
                          ? (proc.memory_bytes / snapshot.total_memory) * 100
                          : 0;

                      const isHeavy = proc.cpu_usage >= 5.0 || proc.memory_bytes >= 500 * 1024 * 1024;

                      return (
                        <tr
                          key={proc.pid}
                          className={cn(
                            "hover:bg-muted/30 transition-colors group",
                            proc.is_stash && "bg-primary/5",
                            isHeavy && "bg-rose-500/[0.02]"
                          )}
                        >
                          {/* Application Name & Actual App Icon */}
                          <td className="py-2 px-4 font-sans font-medium text-foreground flex items-center gap-2.5">
                            <ProcessAppIcon
                              processName={proc.name}
                              isStash={proc.is_stash}
                              size={18}
                            />

                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold truncate max-w-[190px]" title={proc.name}>
                                {proc.name}
                              </span>
                              {proc.is_stash && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                                  Stash
                                </span>
                              )}
                              {proc.pid === topCpu?.pid && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                  Top CPU
                                </span>
                              )}
                              {proc.pid === topRam?.pid && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                  Top RAM
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PID */}
                          <td className="py-2 px-3 text-muted-foreground text-xs">
                            {proc.pid}
                          </td>

                          {/* CPU % */}
                          <td
                            className={cn(
                              "py-2 px-3 text-right font-bold text-xs",
                              proc.cpu_usage >= 20
                                ? "text-rose-500"
                                : proc.cpu_usage >= 5
                                ? "text-amber-500"
                                : "text-foreground"
                            )}
                          >
                            {proc.cpu_usage.toFixed(1)}%
                          </td>

                          {/* CPU Meter */}
                          <td className="py-2 px-3 w-28">
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  proc.cpu_usage >= 20
                                    ? "bg-rose-500"
                                    : proc.cpu_usage >= 5
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(2, proc.cpu_usage))}%` }}
                              />
                            </div>
                          </td>

                          {/* Memory */}
                          <td className="py-2 px-3 text-right font-bold text-xs text-foreground">
                            {formatBytes(proc.memory_bytes)}
                          </td>

                          {/* Memory Meter */}
                          <td className="py-2 px-3 w-28">
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  ramPct >= 15 ? "bg-rose-500" : ramPct >= 5 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(2, ramPct * 3))}%` }}
                              />
                            </div>
                          </td>

                          {/* Uptime */}
                          <td className="py-2 px-3 text-muted-foreground text-[11px] font-sans">
                            {formatDuration(proc.run_time_secs)}
                          </td>

                          {/* Action End Process */}
                          <td className="py-2 px-4 text-right font-sans">
                            {proc.is_stash ? (
                              <span className="text-[10px] text-muted-foreground italic">Protected</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setProcessToKill(proc)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                                title={`End process ${proc.name}`}
                              >
                                End Task
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-2.5 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>
                Showing <strong>{filteredProcesses.length}</strong> of {snapshot?.total_processes_count || 0} processes
              </span>
              <span>
                Total RAM occupied:{" "}
                <strong className="text-foreground">
                  {formatBytes(filteredProcesses.reduce((acc, p) => acc + p.memory_bytes, 0))}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: HARDWARE COCKPIT                                          */}
      {/* ========================================================================= */}
      {activeTab === "cockpit" && (
        <div className="flex flex-col gap-5">
          {/* Main Grid: 4 Cockpit Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* CPU Cockpit */}
            <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col gap-2.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Cpu className={cn("h-4 w-4", isColorful ? "text-blue-500" : "text-foreground")} />
                  <span>CPU</span>
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {snapshot ? `${snapshot.global_cpu_usage.toFixed(1)}%` : "…"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      snapshot && snapshot.global_cpu_usage >= 85
                        ? "bg-rose-500"
                        : snapshot && snapshot.global_cpu_usage >= 60
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    )}
                    animate={{ width: `${Math.min(100, snapshot?.global_cpu_usage || 0)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>{snapshot ? `${snapshot.physical_core_count}P / ${snapshot.logical_core_count}T` : ""}</span>
                  <span>{snapshot?.cpu_cores[0]?.frequency ? `${snapshot.cpu_cores[0].frequency} MHz` : "Turbo"}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground truncate" title={snapshot?.cpu_brand}>
                {snapshot?.cpu_brand || "System Processor"}
              </p>

              {/* Sparkline */}
              <div className="flex items-end gap-1 h-5 pt-1 border-t border-border/40">
                {cpuHistory.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500/25 rounded-t-xs hover:bg-blue-500 transition-colors"
                    style={{ height: `${Math.max(15, val)}%` }}
                    title={`${val}%`}
                  />
                ))}
              </div>
            </div>

            {/* Memory (RAM) */}
            <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col gap-2.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Pulse className={cn("h-4 w-4", isColorful ? "text-emerald-500" : "text-foreground")} />
                  <span>Memory</span>
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {ramUsagePct.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      ramUsagePct >= 90
                        ? "bg-rose-500"
                        : ramUsagePct >= 75
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    animate={{ width: `${Math.min(100, ramUsagePct)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>{snapshot ? formatBytes(snapshot.used_memory) : "0 GB"} used</span>
                  <span>{snapshot ? formatBytes(snapshot.total_memory) : "0 GB"} total</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground truncate">
                {snapshot ? `${formatBytes(snapshot.available_memory)} available` : "Detecting RAM…"}
              </p>

              {/* Sparkline */}
              <div className="flex items-end gap-1 h-5 pt-1 border-t border-border/40">
                {ramHistory.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-emerald-500/25 rounded-t-xs hover:bg-emerald-500 transition-colors"
                    style={{ height: `${Math.max(15, val)}%` }}
                    title={`${val}%`}
                  />
                ))}
              </div>
            </div>

            {/* Graphics & GPU */}
            <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col gap-2.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Desktop className={cn("h-4 w-4", isColorful ? "text-purple-500" : "text-foreground")} />
                  <span>Graphics</span>
                </span>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  {fps} FPS
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${Math.min(100, (fps / 144) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>{(1000 / Math.max(1, fps)).toFixed(1)} ms frame</span>
                  <span>Hardware Accel</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground truncate" title={gpu?.unmaskedRenderer}>
                {gpu?.unmaskedRenderer || "Detecting GPU…"}
              </p>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                <span>{gpu?.unmaskedVendor || "GPU"}</span>
                <span>Max Tex: {gpu?.maxTextureSize || 8192}px</span>
              </div>
            </div>

            {/* Storage Drive */}
            <div className="p-4 rounded-xl bg-card border border-border/70 flex flex-col gap-2.5 shadow-xs relative overflow-hidden">
              {(() => {
                const disk = snapshot?.disks[0];
                const usedDisk = disk ? disk.total_space - disk.available_space : 0;
                const diskPct = disk && disk.total_space > 0 ? (usedDisk / disk.total_space) * 100 : 0;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <HardDrive className={cn("h-4 w-4", isColorful ? "text-amber-500" : "text-foreground")} />
                        <span>Storage</span>
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {diskPct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            diskPct >= 90 ? "bg-rose-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(100, diskPct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                        <span>{formatBytes(usedDisk)} used</span>
                        <span>{disk ? formatBytes(disk.total_space) : "0 GB"}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {disk ? `${formatBytes(disk.available_space)} free on ${disk.mount_point}` : "Scanning…"}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                      <span>{disk?.file_system || "NTFS"}</span>
                      <span>{disk?.is_removable ? "Removable" : "SSD/NVMe"}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Row 2: CPU Multi-Core Matrix & Network Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* CPU Multi-Core Matrix */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Cpu className={cn("h-4 w-4", isColorful ? "text-blue-500" : "text-foreground")} />
                  <span>Multi-Core Load Matrix</span>
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {snapshot?.cpu_cores.length || 0} Cores
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {snapshot?.cpu_cores.map((core) => (
                  <div
                    key={core.id}
                    className={cn(
                      "p-2 rounded-lg border flex flex-col gap-1 transition-all",
                      core.usage >= 90
                        ? "bg-rose-500/10 border-rose-500/40"
                        : core.usage >= 65
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-muted/30 border-border/50"
                    )}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono text-muted-foreground">{core.name}</span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          core.usage >= 90
                            ? "text-rose-500"
                            : core.usage >= 65
                            ? "text-amber-500"
                            : "text-foreground"
                        )}
                      >
                        {core.usage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          core.usage >= 90
                            ? "bg-rose-500"
                            : core.usage >= 65
                            ? "bg-amber-500"
                            : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, core.usage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Network & Hardware Status */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Globe className={cn("h-4 w-4", isColorful ? "text-cyan-500" : "text-foreground")} />
                  <span>Network Throughput</span>
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {snapshot?.network?.active_interfaces || 1} Ifaces
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-emerald-500" />
                    <span>Download</span>
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-500">
                    {snapshot?.network ? formatSpeed(snapshot.network.rx_rate_bytes_per_sec) : "0 KB/s"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Total: {snapshot?.network ? formatBytes(snapshot.network.total_rx_bytes) : "0 B"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-blue-500" />
                    <span>Upload</span>
                  </span>
                  <span className="font-mono text-base font-bold text-blue-500">
                    {snapshot?.network ? formatSpeed(snapshot.network.tx_rate_bytes_per_sec) : "0 KB/s"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Total: {snapshot?.network ? formatBytes(snapshot.network.total_tx_bytes) : "0 B"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <span>Thermal Sensors: {snapshot?.thermal?.sensor_count || 0}</span>
                <span>Uptime: {snapshot ? formatDuration(snapshot.uptime_secs) : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: BOTTLENECK RADAR                                          */}
      {/* ========================================================================= */}
      {activeTab === "bottlenecks" && (
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ShieldCheck className={cn("h-4 w-4", isColorful ? "text-primary" : "text-foreground")} />
                <span>Bottleneck Diagnostics</span>
              </h3>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 text-xs">
              {(["all", "bottlenecks", "RAM", "CPU", "STORAGE"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveAlertCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer capitalize text-[11px]",
                    activeAlertCategory === cat
                      ? "bg-secondary text-secondary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex flex-col gap-2">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-muted/30 border border-border/50 flex flex-col items-center justify-center">
                <CheckCircle className="h-7 w-7 text-emerald-500 mb-1.5" weight="fill" />
                <p className="text-xs font-semibold text-foreground">No Bottlenecks Detected</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Hardware running with adequate headroom and low latency.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col gap-1 transition-all text-xs",
                    alert.severity === "critical"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : alert.severity === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "bg-muted/40 border-border/60 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {alert.severity === "critical" ? (
                        <WarningCircle className="h-4 w-4 shrink-0 text-rose-500" weight="fill" />
                      ) : alert.severity === "warning" ? (
                        <WarningCircle className="h-4 w-4 shrink-0 text-amber-500" weight="fill" />
                      ) : (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" weight="fill" />
                      )}
                      <span className="font-semibold text-foreground">{alert.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-background/60 border border-border">
                        {alert.category}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-foreground">
                      {alert.value}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {alert.detail}
                  </p>

                  {alert.recommendation && (
                    <div className="flex items-start gap-1.5 pt-0.5 text-[11px] text-primary">
                      <CaretRight className="h-3 w-3 shrink-0 mt-0.5" />
                      <span><strong>Action:</strong> {alert.recommendation}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: STASH TURBO ENGINE                                        */}
      {/* ========================================================================= */}
      {activeTab === "turbo" && (
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                  <Lightning className="h-5 w-5" weight="fill" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Stash Engine & Memory Footprint
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Native Rust backend with zero-drag memory footprint.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOptimizeStash}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Lightning className={cn("h-4 w-4", isOptimizing && "animate-spin")} weight="fill" />
                <span>{isOptimizing ? "Compacting…" : "Turbo Optimize Stash"}</span>
              </button>
            </div>

            {/* Proof Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-background/50 border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Working Set</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {snapshot?.stash_process ? formatBytes(snapshot.stash_process.memory_bytes) : "48 MB"}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">
                  {analysis ? `< ${analysis.stashOverheadPctOfRam.toFixed(2)}% RAM` : "< 0.1%"}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-background/50 border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">CPU Usage</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {snapshot?.stash_process ? `${snapshot.stash_process.cpu_usage.toFixed(1)}%` : "< 0.1%"}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">
                  Near-Zero Idle
                </span>
              </div>

              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-background/50 border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">SQLite DB Size</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {snapshot ? formatBytes(snapshot.db_size_bytes) : "420 KB"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Indexed WAL
                </span>
              </div>

              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-background/50 border border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Windows Active</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {snapshot ? `${snapshot.active_windows_count}` : "1"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Tauri Webview
                </span>
              </div>
            </div>
          </div>

          {/* Benchmark comparison card */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Desktop Application Memory Footprint Comparison
            </h3>

            <div className="space-y-2.5 pt-1">
              {[
                { name: "Slack", memory: "850 MB", pct: 85, color: "bg-muted-foreground/30" },
                { name: "Notion Desktop", memory: "720 MB", pct: 72, color: "bg-muted-foreground/30" },
                { name: "Microsoft Teams", memory: "980 MB", pct: 98, color: "bg-muted-foreground/30" },
                { name: "Stash (Native Rust)", memory: snapshot?.stash_process ? formatBytes(snapshot.stash_process.memory_bytes) : "48 MB", pct: 6, color: "bg-primary font-bold" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-mono font-bold text-foreground">{item.memory}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", item.color)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PROCESS TERMINATION CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {processToKill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border/80 shadow-2xl p-5 flex flex-col gap-3.5 relative overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <ProcessAppIcon
                  processName={processToKill.name}
                  isStash={processToKill.is_stash}
                  size={24}
                />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    End Task: {processToKill.name}?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PID: {processToKill.pid} · Consuming{" "}
                    <strong>{processToKill.cpu_usage.toFixed(1)}% CPU</strong> and{" "}
                    <strong>{formatBytes(processToKill.memory_bytes)} RAM</strong>.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/50">
                Terminating an active desktop application will force it to close. Any unsaved documents in that application may be lost.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setProcessToKill(null)}
                  disabled={isKilling}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKillProcess}
                  disabled={isKilling}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-xs shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <StopCircle className="h-4 w-4" weight="bold" />
                  <span>{isKilling ? "Terminating…" : "End Process"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
