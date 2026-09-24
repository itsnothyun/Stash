import React from "react";

interface TechItem {
  name: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}

const TECH_ITEMS: TechItem[] = [
  {
    name: "Tauri 2.0",
    sub: "Native IPC Core",
    accent: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 group-hover:border-cyan-500/40",
    icon: (
      <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="12" r="5" />
        <circle cx="16" cy="12" r="5" />
        <path d="M12 9.5a5 5 0 0 1 0 5" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    name: "Rust",
    sub: "Zero-Cost Memory Safety",
    accent: "text-orange-400 border-orange-500/20 bg-orange-500/5 group-hover:border-orange-500/40",
    icon: (
      <svg className="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a2 2 0 0 0-2 2c-.34.03-.67.1-1 .18l-.94-1.63a2 2 0 0 0-2.73-.73l-1.73 1a2 2 0 0 0-.73 2.73l.94 1.63c-.26.23-.5.48-.72.76l-1.84-.49a2 2 0 0 0-2.39 1.48l-.52 1.93a2 2 0 0 0 1.48 2.39l1.84.49c-.06.34-.09.68-.09 1.03s.03.69.09 1.03l-1.84.49a2 2 0 0 0-1.48 2.39l.52 1.93a2 2 0 0 0 2.39 1.48l1.84-.49c.22.28.46.53.72.76l-.94 1.63a2 2 0 0 0 .73 2.73l1.73 1a2 2 0 0 0 2.73-.73l.94-1.63c.33.08.66.15 1 .18a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2c.34-.03.67-.1 1-.18l.94 1.63a2 2 0 0 0 2.73.73l1.73-1a2 2 0 0 0 .73-2.73l-.94-1.63c.26-.23.5-.48.72-.76l1.84.49a2 2 0 0 0 2.39-1.48l.52-1.93a2 2 0 0 0-1.48-2.39l-1.84-.49c.06-.34.09-.68.09-1.03s-.03-.69-.09-1.03l1.84-.49a2 2 0 0 0 1.48-2.39l-.52-1.93a2 2 0 0 0-2.39-1.48l-1.84.49c-.22-.28-.46-.53-.72-.76l.94-1.63a2 2 0 0 0-.73-2.73l-1.73-1a2 2 0 0 0-2.73.73l-.94 1.63c-.33-.08-.66-.15-1-.18a2 2 0 0 0-2-2h-2zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
      </svg>
    ),
  },
  {
    name: "React 19",
    sub: "Concurrent UI Engine",
    accent: "text-cyan-300 border-cyan-400/20 bg-cyan-400/5 group-hover:border-cyan-400/40",
    icon: (
      <svg className="h-4 w-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "SQLite 3",
    sub: "100% Offline Encrypted",
    accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 group-hover:border-emerald-500/40",
    icon: (
      <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    sub: "Ultra-Lightweight UI",
    accent: "text-sky-400 border-sky-500/20 bg-sky-500/5 group-hover:border-sky-500/40",
    icon: (
      <svg className="h-4 w-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.335 13.382 8.974 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "Tiptap",
    sub: "ProseMirror Markdown",
    accent: "text-purple-400 border-purple-500/20 bg-purple-500/5 group-hover:border-purple-500/40",
    icon: (
      <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    name: "TypeScript",
    sub: "Strict Typed Core",
    accent: "text-blue-400 border-blue-500/20 bg-blue-500/5 group-hover:border-blue-500/40",
    icon: (
      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.5 0h21A1.5 1.5 0 0 1 24 1.5v21a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 22.5v-21A1.5 1.5 0 0 1 1.5 0zm10.74 13.78a5.2 5.2 0 0 0-1.89-.35c-1.32 0-2.07.64-2.07 1.57 0 .99.8 1.42 2.37 2.03 2.5.94 3.75 2.05 3.75 4.3 0 2.58-1.99 4.2-5.32 4.2a8.8 8.8 0 0 1-4.22-1.04l.87-2.61a7.4 7.4 0 0 0 3.32.88c1.39 0 2.21-.6 2.21-1.62 0-.96-.78-1.46-2.38-2.09-2.4-.92-3.74-2.02-3.74-4.22 0-2.44 1.87-4.14 4.96-4.14a8.1 8.1 0 0 1 3.74.83l-.6 2.26zm6.8 9.58h-3.07V9.74h-3.9V7.12h10.87v2.62h-3.9v13.62z" />
      </svg>
    ),
  },
  {
    name: "Framer Motion",
    sub: "Fluid Physics & Gestures",
    accent: "text-pink-400 border-pink-500/20 bg-pink-500/5 group-hover:border-pink-500/40",
    icon: (
      <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
      </svg>
    ),
  },
  {
    name: "Vite",
    sub: "Lightning Fast Bundler",
    accent: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5 group-hover:border-yellow-500/40",
    icon: (
      <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

export const ProofRibbon: React.FC = () => {
  // Duplicate array 3 times for a completely seamless, continuous infinite loop across all display widths
  const marqueeItems = [...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS];

  return (
    <div className="py-8 sm:py-10 border-t border-b border-white/[0.04] bg-[#08080a] relative overflow-hidden animate-marquee-hover-pause">
      {/* Section Eyebrow Header */}
      <div className="mx-auto max-w-5xl px-6 sm:px-8 mb-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-widest uppercase text-[10px]">ENGINEERED ON NEXT-GEN FOUNDATIONS</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] text-zinc-600">
            Hover to inspect tech stack
          </span>
        </div>
      </div>

      {/* Infinite Looping Marquee Track with Edge Gradient Fade Masks */}
      <div className="relative w-full overflow-hidden">
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-[#08080a] to-transparent z-10" />

        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-[#08080a] to-transparent z-10" />

        {/* Moving Marquee Strip */}
        <div className="flex w-max items-center gap-3.5 py-1 animate-marquee">
          {marqueeItems.map((tech, idx) => (
            <div
              key={idx}
              className={`group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-zinc-900/60 px-3.5 py-2 transition-all duration-200 hover:scale-[1.03] hover:bg-zinc-800/80 cursor-pointer select-none shadow-xs ${tech.accent}`}
            >
              <div className="shrink-0 transition-transform group-hover:scale-110">
                {tech.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs font-semibold tracking-tight text-zinc-200 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
                  {tech.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
