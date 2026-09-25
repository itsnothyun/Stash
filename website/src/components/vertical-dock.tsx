import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import { ExternalLink, Github, Sparkles } from "lucide-react";
import novaLogo from "../assets/branding/nova-logo.png";
import coveLogo from "../assets/branding/cove.svg";
import crestLogo from "../assets/branding/crest.svg";
import stashLogo from "../assets/logo.png";

export interface DockAppItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  glowColor: string;
  url: string;
  isCurrent?: boolean;
  badge?: string;
}

export const DOCK_ITEMS: DockAppItem[] = [
  {
    id: "stash",
    name: "Stash",
    tagline: "Desktop Memory Layer",
    description: "Lightweight, tactile desktop scratchpad with zero telemetry & SQLite vault.",
    icon: stashLogo,
    glowColor: "rgba(244, 63, 94, 0.7)", // Rose
    url: "#",
    isCurrent: true,
    badge: "Current App",
  },
  {
    id: "nova",
    name: "Nova",
    tagline: "Personal AI Command Center",
    description: "Multi-model reasoning workspace & proactive agent workflow orchestrator.",
    icon: novaLogo,
    glowColor: "rgba(56, 189, 248, 0.75)", // Electric Cyan
    url: "https://github.com/itsnothyun/Nova",
    badge: "AI Command Center",
  },
  {
    id: "cove",
    name: "Cove",
    tagline: "Private Vault & Credentials",
    description: "End-to-end encrypted vault for subscriptions, documents, keys & reminders.",
    icon: coveLogo,
    glowColor: "rgba(45, 212, 191, 0.75)", // Emerald / Teal
    url: "https://github.com/itsnothyun/Cove",
    badge: "Private Vault",
  },
  {
    id: "crest",
    name: "Crest",
    tagline: "Multi-Client CRM Platform",
    description: "High-velocity revenue operations, client tracking & analytics engine.",
    icon: crestLogo,
    glowColor: "rgba(168, 85, 247, 0.75)", // Royal Violet
    url: "https://github.com/itsnothyun/Crest",
    badge: "Revenue CRM",
  },
];

interface DockIconProps {
  item: DockAppItem;
  mouseY: MotionValue<number>;
  onHover: (item: DockAppItem | null) => void;
  isHovered: boolean;
}

const DockIconItem: React.FC<DockIconProps> = ({
  item,
  mouseY,
  onHover,
  isHovered,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Measure distance from cursor Y coordinate
  const distance = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      height: 0,
    };
    return val - (bounds.y + bounds.height / 2);
  });

  // Compact dynamic magnification:
  // Base size: 40px, Hovered: up to 58px
  const sizeTransform = useTransform(distance, [-100, 0, 100], [40, 58, 40]);
  const size = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (item.isCurrent) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (item.url.startsWith("http")) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center select-none"
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Magnified Dock Icon Button — Compact, no container box */}
      <motion.button
        type="button"
        onClick={handleClick}
        style={{ width: size, height: size }}
        className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        whileTap={{ scale: 0.92 }}
        aria-label={`${item.name} - ${item.tagline}`}
      >
        {/* Glow backdrop on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-75 blur-lg pointer-events-none"
          style={{ backgroundColor: item.glowColor }}
        />

        {/* The Icon itself directly, no surrounding box or tile container */}
        <img
          src={item.icon}
          alt={`${item.name} Logo`}
          className="h-full w-full object-contain select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105"
          draggable={false}
        />
      </motion.button>

      {/* Floating Flyout Tooltip to the Right */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.25 }}
            className="absolute left-full ml-3 z-50 pointer-events-none min-w-[200px] max-w-[250px]"
          >
            {/* Luminous Glow Backdrop */}
            <div
              className="absolute inset-0 rounded-2xl blur-lg opacity-40 pointer-events-none"
              style={{ backgroundColor: item.glowColor }}
            />

            {/* Glass Tooltip Card */}
            <div
              className="relative rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl"
              style={{
                background:
                  "linear-gradient(150deg, rgba(24, 26, 32, 0.96) 0%, rgba(14, 15, 18, 0.94) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow:
                  "0 12px 32px rgba(0, 0, 0, 0.7), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)",
              }}
            >
              {/* Header: Name + Badge */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-xs text-white tracking-tight">
                  {item.name}
                </span>

                {item.badge && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-zinc-300">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Tagline */}
              <div className="text-[10px] font-medium text-zinc-300 mb-0.5 leading-snug">
                {item.tagline}
              </div>

              {/* Description */}
              <p className="text-[9.5px] text-zinc-400 leading-relaxed mb-1.5">
                {item.description}
              </p>

              {/* Action Hint */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[8.5px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-zinc-300" />
                  <span>itsnothyun suite</span>
                </span>
                <span className="inline-flex items-center gap-0.5 text-white/80 group-hover:text-white font-medium">
                  {item.isCurrent ? "Active App" : "Explore"}
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface VerticalDockProps {
  className?: string;
  position?: "fixed" | "inline";
}

export const VerticalDock: React.FC<VerticalDockProps> = ({
  className = "",
  position = "fixed",
}) => {
  const mouseY = useMotionValue(Infinity);
  const [hoveredItem, setHoveredItem] = useState<DockAppItem | null>(null);

  const containerStyle =
    position === "fixed"
      ? "fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 hidden sm:flex"
      : "relative flex";

  return (
    <div
      className={`${containerStyle} flex-col items-center select-none ${className}`}
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => {
        mouseY.set(Infinity);
        setHoveredItem(null);
      }}
    >
      {/* Outer Floating Liquid Glass Capsule — Compact sizing & tighter padding */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-all"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(160, 160, 160, 0.08) 20%, rgba(80, 80, 80, 0.05) 80%, rgba(255, 255, 255, 0.16) 100%)",
          boxShadow:
            "0 10px 32px -6px rgba(0, 0, 0, 0.65), 0 3px 12px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Inner Glass Core Background */}
        <div
          className="absolute inset-0 rounded-2xl backdrop-blur-2xl -z-10"
          style={{
            background:
              "linear-gradient(160deg, rgba(22, 24, 30, 0.94) 0%, rgba(14, 15, 18, 0.90) 50%, rgba(18, 20, 26, 0.95) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        />

        {/* Dock Items — Compact gap-1 (4px spacing) */}
        <div className="flex flex-col items-center gap-1">
          {DOCK_ITEMS.map((item) => (
            <DockIconItem
              key={item.id}
              item={item}
              mouseY={mouseY}
              onHover={setHoveredItem}
              isHovered={hoveredItem?.id === item.id}
            />
          ))}
        </div>

        {/* Subtle Divider — Compact */}
        <div
          className="w-5 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-0.5"
          aria-hidden="true"
        />

        {/* Bottom Actual GitHub Icon — Compact 32x32 */}
        <div
          className="relative flex items-center justify-center"
          onMouseEnter={() =>
            setHoveredItem({
              id: "github",
              name: "GitHub",
              tagline: "itsnothyun / repositories",
              description:
                "Browse open-source source code, releases, tools & documentation.",
              icon: "",
              glowColor: "rgba(255, 255, 255, 0.4)",
              url: "https://github.com/itsnothyun",
            })
          }
          onMouseLeave={() => setHoveredItem(null)}
        >
          <motion.a
            href="https://github.com/itsnothyun"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            className="group relative flex items-center justify-center h-8 w-8 rounded-xl hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
            title="GitHub • itsnothyun"
            aria-label="View itsnothyun on GitHub"
          >
            <Github className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors drop-shadow-md" />
          </motion.a>

          {/* GitHub Tooltip */}
          <AnimatePresence>
            {hoveredItem?.id === "github" && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.25 }}
                className="absolute left-full ml-3 z-50 pointer-events-none min-w-[200px] max-w-[250px]"
              >
                <div
                  className="relative rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl"
                  style={{
                    background:
                      "linear-gradient(150deg, rgba(24, 26, 32, 0.96) 0%, rgba(14, 15, 18, 0.94) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    boxShadow:
                      "0 12px 32px rgba(0, 0, 0, 0.7), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white tracking-tight flex items-center gap-1.5">
                      <Github className="h-3 w-3 text-zinc-300" />
                      <span>GitHub</span>
                    </span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-zinc-300">
                      itsnothyun
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-zinc-300 mb-0.5 leading-snug">
                    Open Source Suite & Repositories
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-relaxed mb-1.5">
                    Browse source code, releases, tools & documentation across all projects.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[8.5px] text-zinc-400">
                    <span>github.com/itsnothyun</span>
                    <span className="inline-flex items-center gap-0.5 text-white/80 font-medium">
                      Visit Profile
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
