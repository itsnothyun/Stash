import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Users,
  Bug,
  Target,
  TrendingUp,
  Code2,
  Lightbulb,
  BookOpen,
  Copy,
  Check,
  Search,
  FileText,
  Sparkles,
  ArrowRight,
  Download,
  Terminal,
  Play,
  Pause,
  Flame,
  Clock,
  Kanban,
  Sliders,
  Shield,
  Star,
  Palette,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                   Interactive Component Driven Mini-Widgets                */
/* -------------------------------------------------------------------------- */

// 1. Daily Scratchpad Component
const DailyScratchpadWidget: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Deep focus sprint (90 min)", done: true, priority: "High" },
    { id: 2, text: "Review pending PR #42 & merge", done: false, priority: "Urgent" },
    { id: 3, text: "Daily architecture sync", done: false, priority: "Normal" },
  ]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Top HUD: Focus Timer & Streak Badge */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-mono text-xs font-semibold text-white">
              {formatTimer(timerSeconds)}
            </span>
            <span className="text-[10px] text-amber-300/80 block -mt-0.5">
              Focus Pomodoro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex h-7 items-center gap-1 rounded-lg bg-amber-400 text-black px-2.5 font-semibold text-[11px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{timerRunning ? "Pause" : "Start"}</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-[10px] font-mono text-amber-300">
            <Flame className="h-3 w-3 text-orange-400 animate-pulse" />
            <span>5d Streak</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Today's Checklist</span>
          <span className="font-mono text-amber-300 font-medium">
            {completedCount}/{tasks.length} Completed ({progressPercent}%)
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Interactive Task Items */}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
              task.done
                ? "bg-white/[0.02] border-white/5 opacity-60"
                : "bg-white/[0.04] border-white/10 hover:border-amber-400/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  task.done
                    ? "bg-amber-400 border-amber-400 text-black"
                    : "border-white/30 bg-black/30"
                }`}
              >
                {task.done && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span
                className={`text-xs ${
                  task.done ? "line-through text-zinc-500" : "text-zinc-200"
                }`}
              >
                {task.text}
              </span>
            </div>

            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                task.priority === "Urgent"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : task.priority === "High"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Bug Blitz & Issue Triage Component
const BugTriageWidget: React.FC = () => {
  const [severity, setSeverity] = useState<"P0" | "P1" | "P2">("P1");
  const [status, setStatus] = useState<"Triage" | "In Progress" | "Resolved">("In Progress");
  const [failCount, setFailCount] = useState(3);
  const [steps, setSteps] = useState([
    { id: 1, text: "Open Stash on 4K display", checked: true },
    { id: 2, text: "Double click outer header to roll shade", checked: true },
    { id: 3, text: "Observe GPU blur-xl settling animation", checked: false },
  ]);

  const toggleStep = (id: number) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Severity & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 mr-1">Severity:</span>
          {(["P0", "P1", "P2"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSeverity(lvl)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${
                severity === lvl
                  ? lvl === "P0"
                    ? "bg-rose-500 text-white shadow-sm"
                    : lvl === "P1"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-amber-500 text-black shadow-sm"
                  : "bg-black/30 text-zinc-400 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setStatus(
                status === "Triage"
                  ? "In Progress"
                  : status === "In Progress"
                  ? "Resolved"
                  : "Triage"
              )
            }
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] font-medium text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>{status}</span>
          </button>
        </div>
      </div>

      {/* Repro Steps Checklist */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Reproduction Checklist</span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            <span>Repro Count:</span>
            <button
              type="button"
              onClick={() => setFailCount(Math.max(1, failCount - 1))}
              className="h-4 w-4 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="text-white font-bold px-1">{failCount}x</span>
            <button
              type="button"
              onClick={() => setFailCount(failCount + 1)}
              className="h-4 w-4 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {steps.map((st) => (
          <div
            key={st.id}
            onClick={() => toggleStep(st.id)}
            className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03] border border-white/5 hover:border-rose-400/20 cursor-pointer select-none"
          >
            <div
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                st.checked
                  ? "bg-rose-500 border-rose-500 text-white"
                  : "border-white/30 bg-black/30"
              }`}
            >
              {st.checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            </div>
            <span className={`text-[11px] ${st.checked ? "text-zinc-400" : "text-zinc-200"}`}>
              {st.text}
            </span>
          </div>
        ))}
      </div>

      {/* Environment Matrix Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-mono text-[9px] text-zinc-400">
          OS: Win11 23H2
        </span>
        <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-mono text-[9px] text-zinc-400">
          Core: Tauri 2.0
        </span>
        <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-mono text-[9px] text-emerald-400">
          GPU: Hardware Accel
        </span>
      </div>
    </div>
  );
};

// 3. Meeting Minutes & 1-on-1 Sync Component
const MeetingSyncWidget: React.FC = () => {
  const [attendees, setAttendees] = useState([
    { name: "Alex", role: "Host", present: true },
    { name: "Sarah", role: "Design", present: true },
    { name: "David", role: "Eng", present: false },
  ]);
  const [meetingMinsLeft, setMeetingMinsLeft] = useState(14);

  const toggleAttendee = (idx: number) => {
    setAttendees(
      attendees.map((a, i) => (i === idx ? { ...a, present: !a.present } : a))
    );
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Live Meeting Slot Header */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
            <Users className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-white text-xs">Sprint Sync & Alignment</span>
            <span className="text-[10px] text-emerald-300 block -mt-0.5">
              ⏱️ {meetingMinsLeft}m remaining in 30m slot
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {attendees.map((att, i) => (
            <button
              key={att.name}
              type="button"
              onClick={() => toggleAttendee(i)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition-all cursor-pointer ${
                att.present
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-black/30 border-white/10 text-zinc-500 line-through"
              }`}
            >
              <span>{att.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Items Matrix */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-zinc-400 font-medium">Assigned Action Items</span>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-zinc-200 text-xs">Publish macOS Universal DMG build</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] font-mono">
                Sarah
              </span>
              <span className="rounded bg-black/40 text-zinc-400 px-1.5 py-0.5 text-[9px] font-mono">
                Today
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
              <span className="text-zinc-300 text-xs">Benchmark speech recognition latency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 text-[9px] font-mono">
                David
              </span>
              <span className="rounded bg-black/40 text-amber-300 px-1.5 py-0.5 text-[9px] font-mono">
                Tomorrow
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Project Sprint & Kanban Board Component
const ProjectSprintWidget: React.FC = () => {
  const [columns, setColumns] = useState({
    todo: ["Retina Image Export", "Radix Tooltips"],
    inFlight: ["Voice Waveform HUD"],
    done: ["Ghost Mode", "PIN Vault"],
  });

  const advanceTask = (task: string, from: "todo" | "inFlight") => {
    if (from === "todo") {
      setColumns({
        ...columns,
        todo: columns.todo.filter((t) => t !== task),
        inFlight: [...columns.inFlight, task],
      });
    } else if (from === "inFlight") {
      setColumns({
        ...columns,
        inFlight: columns.inFlight.filter((t) => t !== task),
        done: [...columns.done, task],
      });
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Sprint Header */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-2">
          <Kanban className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-white">Sprint 4 Deliverables</span>
        </div>
        <span className="font-mono text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
          75% Complete
        </span>
      </div>

      {/* 3-Column Mini Kanban */}
      <div className="grid grid-cols-3 gap-2">
        {/* To Do Column */}
        <div className="rounded-xl border border-white/5 bg-black/40 p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1 border-b border-white/5">
            <span>TO DO</span>
            <span className="rounded bg-white/10 px-1">{columns.todo.length}</span>
          </div>
          {columns.todo.map((item) => (
            <div
              key={item}
              onClick={() => advanceTask(item, "todo")}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5 hover:border-blue-400/40 text-[10px] text-zinc-200 cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Click to move to In Flight"
            >
              {item}
            </div>
          ))}
        </div>

        {/* In Flight Column */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-blue-400 pb-1 border-b border-blue-500/20">
            <span>IN FLIGHT</span>
            <span className="rounded bg-blue-500/20 px-1">{columns.inFlight.length}</span>
          </div>
          {columns.inFlight.map((item) => (
            <div
              key={item}
              onClick={() => advanceTask(item, "inFlight")}
              className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-200 cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Click to move to Done"
            >
              {item}
            </div>
          ))}
        </div>

        {/* Done Column */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 pb-1 border-b border-emerald-500/20">
            <span>DONE</span>
            <span className="rounded bg-emerald-500/20 px-1">{columns.done.length}</span>
          </div>
          {columns.done.map((item) => (
            <div
              key={item}
              className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[10px] text-emerald-200 line-through opacity-80"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Idea Incubator & Validation Lab Component
const IdeaLabWidget: React.FC = () => {
  const [confidence, setConfidence] = useState(85);
  const [testUsers, setTestUsers] = useState(14);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const swatches = ["#06b6d4", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* 10x Hypothesis Confidence Slider */}
      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">Hypothesis Confidence Meter</span>
          <span className="font-mono text-xs font-bold text-yellow-300">
            {confidence}% Score
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full accent-yellow-400 h-1.5 rounded-full bg-white/10 cursor-pointer"
        />
      </div>

      {/* Validation Metric Counter & Palette Generator */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl border border-white/10 bg-black/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400">User Tests Completed</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-base font-bold text-white">
              {testUsers} / 20
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTestUsers(Math.max(1, testUsers - 1))}
                className="h-5 w-5 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setTestUsers(testUsers + 1)}
                className="h-5 w-5 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Color Palette Swatches */}
        <div className="p-2.5 rounded-xl border border-white/10 bg-black/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400">Theme Swatches</span>
          <div className="flex items-center gap-1.5 mt-1">
            {swatches.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => handleCopyHex(hex)}
                style={{ backgroundColor: hex }}
                className="h-5 w-5 rounded-md hover:scale-110 active:scale-95 transition-transform shadow-sm cursor-pointer"
                title={`Click to copy ${hex}`}
              />
            ))}
          </div>
          {copiedHex && (
            <span className="text-[9px] font-mono text-emerald-400 pt-0.5">
              Copied {copiedHex}!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// 6. API Spec & Architecture Blueprint Component
const ApiBlueprintWidget: React.FC = () => {
  const [method, setMethod] = useState<"IPC" | "POST" | "GET">("IPC");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const endpoint = "ipc://stash/toggle_window_shade";

  const handleCopy = () => {
    navigator.clipboard.writeText(endpoint);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-3.5 text-xs font-mono">
      {/* Endpoint URL Bar */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <span className="rounded bg-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
          {method}
        </span>
        <span className="text-zinc-300 text-xs truncate flex-1">{endpoint}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Copy Endpoint"
        >
          {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Security Shield & Schema Preview */}
      <div className="rounded-xl border border-white/10 bg-[#0c0c0f] p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="h-3 w-3" />
            <span>AES-256 GCM Secure Enclave</span>
          </div>
          <span className="text-zinc-500">Payload Schema</span>
        </div>

        <div className="text-[11px] leading-relaxed text-zinc-300">
          <div><span className="text-purple-400">interface</span> <span className="text-cyan-300">ShadePayload</span> {'{'}</div>
          <div className="pl-4 text-zinc-400">noteId: <span className="text-amber-300">string</span>;</div>
          <div className="pl-4 text-zinc-400">shaded: <span className="text-amber-300">boolean</span>;</div>
          <div className="pl-4 text-zinc-400">targetHeight: <span className="text-amber-300">36.0</span>;</div>
          <div>{'}'}</div>
        </div>
      </div>
    </div>
  );
};

// 7. Weekly Reflection & Retrospective Component
const WeeklyRetroWidget: React.FC = () => {
  const [streakDays, setStreakDays] = useState([
    { day: "M", done: true },
    { day: "T", done: true },
    { day: "W", done: true },
    { day: "T", done: true },
    { day: "F", done: true },
    { day: "S", done: false },
    { day: "S", done: false },
  ]);
  const [energyRating, setEnergyRating] = useState(5);

  const toggleDay = (idx: number) => {
    setStreakDays(
      streakDays.map((d, i) => (i === idx ? { ...d, done: !d.done } : d))
    );
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* 7-Day Consistency Grid */}
      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white text-xs">7-Day Habit Consistency</span>
          <span className="font-mono text-[10px] text-cyan-300">
            {streakDays.filter((d) => d.done).length}/7 Days Active
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1">
          {streakDays.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`flex h-7 w-7 flex-col items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer ${
                item.done
                  ? "bg-cyan-400 text-black shadow-sm scale-105"
                  : "bg-black/40 text-zinc-500 border border-white/10 hover:border-cyan-400/40"
              }`}
            >
              <span>{item.day}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy & Wins Card */}
      <div className="p-2.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-white block">Weekly Focus Energy</span>
          <span className="text-[10px] text-zinc-400">Peak flow state attained</span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setEnergyRating(star)}
              className="text-amber-400 hover:scale-125 transition-transform cursor-pointer"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  star <= energyRating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 8. Book & Literature Digest Component
const BookDigestWidget: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [readingPage, setReadingPage] = useState(184);

  return (
    <div className="space-y-3.5 text-xs">
      {/* Book Headline & Rating */}
      <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white text-xs">Deep Work — Cal Newport</h4>
          <span className="text-[10px] text-pink-300 block -mt-0.5">
            Rules for Focused Success in a Distracted World
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-pink-400 hover:scale-125 transition-transform cursor-pointer"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  star <= rating ? "fill-pink-400 text-pink-400" : "text-zinc-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Standout Quote Card */}
      <div className="p-3 rounded-xl border border-white/10 bg-black/40 border-l-4 border-l-pink-400 space-y-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-pink-300 font-bold">
          CORE MENTAL MODEL
        </span>
        <p className="text-zinc-300 italic text-[11px] leading-relaxed">
          "High Quality Work Produced = (Time Spent) x (Intensity of Focus)"
        </p>
      </div>

      {/* Reading Progress Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>Reading Progress</span>
          <span className="text-pink-300">{readingPage} / 280 Pages (66%)</span>
        </div>
        <input
          type="range"
          min="1"
          max="280"
          value={readingPage}
          onChange={(e) => setReadingPage(Number(e.target.value))}
          className="w-full accent-pink-400 h-1.5 rounded-full bg-white/10 cursor-pointer"
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Templates Data                               */
/* -------------------------------------------------------------------------- */

interface TemplateItem {
  id: string;
  name: string;
  category: "productivity" | "engineering" | "meetings" | "reflection";
  description: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  paper: "lines" | "dots" | "grid" | "plain";
  tags: string[];
  widgetName: string;
  component: React.ReactNode;
  markdown: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "scratchpad",
    name: "Daily Scratchpad",
    category: "productivity",
    description: "Priorities, rolling daily log, focus pomodoro timer, and unfinished task carryover.",
    emoji: "☀️",
    icon: Sun,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    paper: "lines",
    tags: ["daily", "focus", "pomodoro"],
    widgetName: "Focus HUD & Pomodoro",
    component: <DailyScratchpadWidget />,
    markdown: `## 🎯 Top Priorities
- [x] Deep focus sprint (90 min)
- [ ] Review pending PR #42 & merge
- [ ] Daily architecture sync

## 💭 Fleeting Thoughts
- Explore GPU acceleration for blur effect
- Check Tauri v2.2 window shadow API

## 📝 Daily Log
- 09:30 AM — Opened new stash note for sprint plan
- 11:15 AM — Merged image export studio
- 02:45 PM — Optimized local SQLite query latency`,
  },
  {
    id: "bug_report",
    name: "Bug Blitz & Issue Triage",
    category: "engineering",
    description: "Repro steps, severity selector, repro run counter, and environment matrix.",
    emoji: "🐛",
    icon: Bug,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
    paper: "grid",
    tags: ["dev", "debugging", "triage"],
    widgetName: "Issue Triage & Counter",
    component: <BugTriageWidget />,
    markdown: `### 🐛 Issue Description
Window shade rollup animation stutters when dragging on high-DPI displays.

### 🔁 Steps to Reproduce
1. Open Stash on a 4K display (200% scale)
2. Press Ctrl+D or double click outer header to collapse shade
3. Observe micro-stutter before blur transition settles

### 💡 Expected vs Actual
- **Expected:** Seamless 300ms cubic-bezier transition to 36px bar
- **Actual:** 1-frame drop during scale-[0.98] blur handoff

### 🔧 Fix Notes
- Enable hardware acceleration on background backdrop filter
- Set will-change: transform on floating container`,
  },
  {
    id: "meeting",
    name: "Meeting Minutes & 1-on-1 Sync",
    category: "meetings",
    description: "Live meeting slot countdown, attendee attendance pills, and action items matrix.",
    emoji: "🤝",
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    paper: "dots",
    tags: ["meetings", "team", "sync"],
    widgetName: "Meeting Slot & Attendees",
    component: <MeetingSyncWidget />,
    markdown: `**Date:** 2026-09-24  
**Attendees:** Alex, Sarah, David

### 📌 Agenda & Discussion
- Review v0.4 release timeline & desktop installers
- Discuss local-first SQLite schema migrations
- Finalize retina export gradient color palettes

### ⚡ Action Items
- [ ] Sarah: Publish macOS Universal DMG build
- [ ] David: Benchmark speech recognition latency
- [ ] Alex: Update developer documentation and release notes`,
  },
  {
    id: "project_plan",
    name: "Project Sprint Kanban",
    category: "engineering",
    description: "Visual 3-column micro Kanban board with To Do, In Flight, and Done swimlanes.",
    emoji: "🎯",
    icon: Target,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    paper: "grid",
    tags: ["sprint", "kanban", "tasks"],
    widgetName: "Interactive Kanban Board",
    component: <ProjectSprintWidget />,
    markdown: `## 🚀 Sprint Goal
Deliver high-fidelity note export studio and speech dictation before v0.4 release.

### 📋 In-Flight Deliverables
- [x] Radix UI tooltips across all 15 header controls
- [x] Frosted glass window shade transition blur
- [ ] Audio waveform pulse animation during dictation

### ⚠️ Potential Blockers
- Windows SpeechRecognition permissions in enterprise environments
- Clipboard write permissions for 2.5x retina canvas blob`,
  },
  {
    id: "idea_dump",
    name: "Idea Incubator & Validation Lab",
    category: "productivity",
    description: "Hypothesis confidence meter, user test counters, and dynamic palette swatches.",
    emoji: "💡",
    icon: Lightbulb,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
    paper: "plain",
    tags: ["brainstorm", "creativity", "palette"],
    widgetName: "Hypothesis Lab & Swatches",
    component: <IdeaLabWidget />,
    markdown: `### 💡 Core Idea
Add a HUD widget that estimates reading time and checklist completion in real time.

### ❓ Problem Statement
Users writing long scratchpads don't know their task progress or note length without opening full editors.

### 🧪 24-Hour Experiment
- Mount a lightweight HUD bar above the status footer
- Compute word count and reading speed (200 wpm)
- Count checked vs total Markdown checkboxes in TipTap AST`,
  },
  {
    id: "code_snippet",
    name: "API Spec & Architecture Blueprint",
    category: "engineering",
    description: "IPC route explorer, 1-click endpoint copy, security enclave, and JSON schema.",
    emoji: "⚡",
    icon: Code2,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    paper: "grid",
    tags: ["rust", "tauri", "api"],
    widgetName: "IPC Route & Schema Inspector",
    component: <ApiBlueprintWidget />,
    markdown: `### 📡 IPC Command Signature
\`\`\`rust
#[tauri::command]
pub fn export_note_image(
  window: tauri::WebviewWindow,
  note_id: String,
  pixel_ratio: f32,
) -> Result<String, String> {
  // Dispatches 2.5x retina rasterization
}
\`\`\`

### 🔒 Security Protocol
- Vault payload encrypted using AES-256 GCM
- Key derived using Argon2id (memory: 64MB, iterations: 3)
- Zero external network transmission guaranteed`,
  },
  {
    id: "weekly_review",
    name: "Weekly Reflection & Retrospective",
    category: "reflection",
    description: "7-day habit streak grid, 5-star energy rating meter, and milestone wins.",
    emoji: "📈",
    icon: TrendingUp,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
    paper: "lines",
    tags: ["reflection", "habits", "weekly"],
    widgetName: "Habit Grid & Energy Meter",
    component: <WeeklyRetroWidget />,
    markdown: `## 🏆 Highlights & Wins
- Completed full Tauri 2.0 Rust backend integration
- Shipped 8 custom template personas and paper textures
- Zero memory leaks detected across 24h background stress test

## 🔍 Friction Points & Learnings
- Framer motion layout transitions need explicit width constraints
- Windows borderless windows require custom titlebar drag regions

## 🎯 Next Week's Single Focus
Launch official release page and developer documentation portal.`,
  },
  {
    id: "reading_notes",
    name: "Book & Literature Digest",
    category: "reflection",
    description: "5-star rating widget, standout quotation callout, and reading progress slider.",
    emoji: "📖",
    icon: BookOpen,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-400/10",
    borderColor: "border-pink-400/20",
    paper: "dots",
    tags: ["books", "learning", "quotes"],
    widgetName: "Book Rating & Quotes HUD",
    component: <BookDigestWidget />,
    markdown: `**Title:** Deep Work  
**Author:** Cal Newport  
**Rating:** 5/5 ⭐

### 🧠 Core Thesis
The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.

### 💡 Top Mental Models
1. **The Law of Focused Success:** High Quality Work Produced = (Time Spent) x (Intensity of Focus)
2. **The 4 Disciplines of Execution:** Focus on the wildly important, act on lead measures, keep a compelling scoreboard.

### 🛠️ Practical Action
Schedule 2 non-negotiable 90-minute Stash focus blocks every workday with Ghost Mode active.`,
  },
];

/* -------------------------------------------------------------------------- */
/*                               Main Page View                               */
/* -------------------------------------------------------------------------- */

export const TemplatesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Record<string, "component" | "markdown">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "productivity", label: "Productivity" },
    { id: "engineering", label: "Engineering" },
    { id: "meetings", label: "Meetings & Syncs" },
    { id: "reflection", label: "Reflection & Learning" },
  ];

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory =
      selectedCategory === "all" || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#121215] text-white pt-24 pb-20 selection:bg-white/20 selection:text-white">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[550px] w-[950px] rounded-full bg-gradient-to-tr from-amber-500/10 via-purple-500/10 to-cyan-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs text-amber-300 font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Component-Driven Templates</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white"
          >
            Tactile, widget-powered templates for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">deep work</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-400 leading-relaxed"
          >
            Not just plain text dumps. Every template in Stash is engineered as an interactive, component-driven micro-app with live timers, Kanban swimlanes, habit streak trackers, and tactile checklists.
          </motion.p>
        </div>

        {/* Controls: Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-white text-black shadow-lg shadow-white/10"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className="h-8 w-full rounded-full border border-white/[0.08] bg-[#161619] pl-8 pr-4 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/40"
            />
          </div>
        </div>

        {/* Template Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((tpl) => {
              const Icon = tpl.icon;
              const view = activeTab[tpl.id] || "component";

              return (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl border ${tpl.borderColor} bg-gradient-to-b from-[#18181d] to-[#141417] p-5 shadow-2xl flex flex-col justify-between hover:border-white/20 transition-all`}
                >
                  <div>
                    {/* Top Row: Icon, Title, Paper Pattern Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tpl.iconBg} ${tpl.iconColor} border border-white/5 shadow-inner`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-base tracking-tight">
                              {tpl.name}
                            </h3>
                            <span className="text-base select-none">{tpl.emoji}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400 capitalize">
                          {tpl.paper}
                        </span>
                      </div>
                    </div>

                    {/* Tag Pills & Attached Widget Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {tpl.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/[0.04]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <span className="shrink-0 flex items-center gap-1 rounded bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>{tpl.widgetName}</span>
                      </span>
                    </div>

                    {/* Interactive Component Container with Switcher */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#0d0d10] overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#141418]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab((prev) => ({ ...prev, [tpl.id]: "component" }))
                            }
                            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              view === "component"
                                ? "bg-white/15 text-white shadow-xs"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <Sliders className="h-3 w-3 text-amber-400" />
                            <span>Interactive Component</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab((prev) => ({ ...prev, [tpl.id]: "markdown" }))
                            }
                            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              view === "markdown"
                                ? "bg-white/15 text-white shadow-xs"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <FileText className="h-3 w-3 text-cyan-400" />
                            <span>Markdown</span>
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500">
                          {view === "component" ? "Live Interactive" : "Raw Template"}
                        </span>
                      </div>

                      {/* Content Area */}
                      <div className="p-3.5 min-h-[190px] flex flex-col justify-center">
                        {view === "component" ? (
                          <div className="w-full">{tpl.component}</div>
                        ) : (
                          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap selection:bg-amber-500/20 max-h-48 overflow-y-auto scrollbar-thin">
                            {tpl.markdown}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Footer: Quick Hotkey & 1-Click Copy */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                      <span>Hotkey:</span>
                      <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                        Ctrl+Shift+T
                      </kbd>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(tpl.id, tpl.markdown)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        copiedId === tpl.id
                          ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                          : "bg-white/[0.08] text-zinc-200 hover:bg-white hover:text-black shadow-sm active:scale-95"
                      }`}
                    >
                      {copiedId === tpl.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-black" />
                          <span>Copied Markdown</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
