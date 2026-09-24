import React from "react";

export const ProofRibbon: React.FC = () => {
  const logos = [
    { name: "Olwen", font: "font-serif tracking-widest uppercase text-xs" },
    { name: "MOTIM", font: "font-mono font-black tracking-tight text-sm" },
    { name: "Option", font: "font-sans font-light tracking-wide text-xs" },
    { name: "LKPR", font: "font-mono font-bold tracking-widest text-xs" },
    { name: "mainline", font: "font-mono font-normal tracking-tighter text-xs lowercase" },
    { name: "KA'A", font: "font-sans font-extrabold tracking-widest text-xs uppercase" },
    { name: "LVARGAS", font: "font-serif tracking-wider text-xs uppercase" },
  ];

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 sm:gap-10 text-zinc-500">
          {logos.map((logo, idx) => (
            <div
              key={idx}
              className={`select-none opacity-40 hover:opacity-80 transition-opacity duration-300 ${logo.font}`}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
