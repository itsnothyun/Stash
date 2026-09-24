import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  PinOff,
  Minimize2,
  Maximize2,
  Check,
  Code2,
  Copy,
  Layers,
  Palette,
  FileDown,
  Trash2,
  ExternalLink,
} from "lucide-react";

export const FeatureFloating: React.FC = () => {
  const [isShaded, setIsShaded] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Build custom drag titlebar & 36px shade", done: true },
    { id: 2, text: "Attach Currency Swap & Pomodoro widgets", done: true },
    { id: 3, text: "Local SQLite position autosave & checkpoints", done: true },
    { id: 4, text: "Download Windows .exe and macOS .dmg", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((doneCount / tasks.length) * 100);

  return (
    <section id="floating" className="py-20 sm:py-28 border-t border-white/[0.06] relative">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left Column */}
          <div className="text-left">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-rose-500/20 text-rose-400 text-[10px]">
                  ●
                </div>
                <span>Always-On-Top</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-cyan-500/20 text-cyan-400 text-[10px]">
                  ▲
                </div>
                <span>Window Shade (36px)</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-purple-500/20 text-purple-400 text-[10px]">
                  ■
                </div>
                <span>Focus Recede</span>
              </div>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-[450] tracking-tight text-white leading-tight">
              Notes that stay in your peripheral vision
            </h2>

            <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-normal max-w-sm">
              Pin reference notes above VS Code, Figma, or your browser. Double-click the header to collapse it into a sleek 36px micro-bar that never blocks your deep work.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsShaded(!isShaded)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800 hover:border-white/20 active:scale-95 shadow-xs cursor-pointer"
              >
                <span>{isShaded ? "Expand Window" : "Click to Test 36px Shade"}</span>
                {isShaded ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Stash Window & Window Shade Simulator */}
          <div className="relative">
            {/* The Main Stash Window */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={`rounded-2xl border transition-colors shadow-2xl bg-[#0e0f13] overflow-hidden ${
                isShaded
                  ? "border-cyan-500/40 shadow-cyan-500/10"
                  : "border-white/[0.1] shadow-black/80"
              }`}
            >
              {/* Window Titlebar (36px high when shaded) */}
              <div
                onDoubleClick={() => setIsShaded(!isShaded)}
                className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3.5 text-xs bg-black/40 select-none cursor-pointer"
                title="Double-click to toggle Window Shade"
              >
                {/* Traffic lights & Title */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-medium text-zinc-200 text-xs truncate">
                    Sprint Architecture Notes
                  </span>
                  {isShaded && (
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[9px] text-cyan-300 border border-cyan-500/30">
                      SHADE (36px) • {doneCount}/{tasks.length}
                    </span>
                  )}
                </div>

                {/* Window Actions: Pin & Shade */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned(!isPinned);
                    }}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isPinned
                        ? "text-amber-400 bg-amber-400/10"
                        : "text-zinc-500 hover:text-white"
                    }`}
                    title={isPinned ? "Unpin window" : "Pin Always-On-Top"}
                  >
                    <Pin className="h-3.5 w-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShaded(!isShaded);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    title={isShaded ? "Expand" : "Collapse to shade"}
                  >
                    {isShaded ? (
                      <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
                    ) : (
                      <Minimize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Window Body (Animate height on shade toggle) */}
              <AnimatePresence>
                {!isShaded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="p-5 space-y-4"
                  >
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                        <span>Checklist progress</span>
                        <span className="text-emerald-400">{progressPercent}% done</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                          initial={false}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Interactive Tasks */}
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none group"
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              task.done
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "border-white/20 bg-white/5 group-hover:border-white/40"
                            }`}
                          >
                            {task.done && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className={task.done ? "line-through text-zinc-500" : ""}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Code Block Snippet */}
                    <div className="rounded-lg bg-black/50 border border-white/[0.08] p-3 text-[11px] font-mono text-cyan-300">
                      <div className="text-zinc-500 text-[10px] pb-1 border-b border-white/[0.06] mb-1.5 flex items-center justify-between">
                        <span>tauri::window::set_always_on_top</span>
                        <span className="text-emerald-400 font-bold">TRUE</span>
                      </div>
                      <code>await window.setAlwaysOnTop(true);</code>
                    </div>

                    {/* Footer tags */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500 font-mono">
                      <span>#architecture #tauri</span>
                      <span className="text-emerald-400">✓ Auto-saved to SQLite</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Overlaid Custom Right-Click Menu Card (Top Right) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:block absolute -top-8 -right-4 z-20 w-52 rounded-xl border border-white/[0.12] bg-[#14151a]/95 p-1.5 shadow-2xl backdrop-blur-xl text-xs"
            >
              <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Right-Click Card
              </div>
              <div className="space-y-0.5 text-zinc-300">
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
                  <span className="flex items-center gap-2">
                    <Pin className="h-3.5 w-3.5 text-amber-400" />
                    <span>Keep on Top</span>
                  </span>
                  <span className="font-mono text-[9px] text-zinc-500">Ctrl+P</span>
                </div>
                <div
                  onClick={() => setIsShaded(!isShaded)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Minimize2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Window Shade</span>
                  </span>
                  <span className="font-mono text-[9px] text-cyan-400">36px</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
                  <span className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-purple-400" />
                    <span>Color Swatches</span>
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors border-t border-white/[0.06] mt-1 pt-1.5">
                  <span className="flex items-center gap-2">
                    <FileDown className="h-3.5 w-3.5 text-blue-400" />
                    <span>Export (.md)</span>
                  </span>
                  <span className="font-mono text-[9px] text-zinc-500">Ctrl+E</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
