import React from "react";

export const ProofRibbon: React.FC = () => {
  const techLogos = [
    { name: "TAURI 2.0", font: "font-mono font-bold tracking-widest text-xs" },
    { name: "RUST", font: "font-mono font-extrabold tracking-tight text-xs" },
    { name: "REACT 19", font: "font-sans font-medium tracking-wider text-xs" },
    { name: "SQLITE", font: "font-mono font-semibold tracking-widest text-xs" },
    { name: "TAILWIND", font: "font-sans font-normal tracking-wide text-xs" },
    { name: "TIPTAP", font: "font-mono font-medium tracking-tight text-xs" },
    { name: "TYPESCRIPT", font: "font-mono font-bold tracking-widest text-xs" },
  ];

  return (
    <div className="py-10 sm:py-14 border-t border-b border-white/[0.04]">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 sm:gap-8 text-zinc-500">
          {techLogos.map((logo, idx) => (
            <div
              key={idx}
              className={`select-none opacity-40 hover:opacity-90 hover:text-zinc-200 transition-all duration-300 ${logo.font}`}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
