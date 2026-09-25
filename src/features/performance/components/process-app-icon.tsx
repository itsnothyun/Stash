import React from "react";
import { Gear, Terminal, HardDrive } from "@phosphor-icons/react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";

interface ProcessAppIconProps {
  processName: string;
  isStash?: boolean;
  iconData?: string | null;
  size?: number;
  className?: string;
}

export const ProcessAppIcon: React.FC<ProcessAppIconProps> = ({
  processName,
  isStash = false,
  iconData,
  size = 20,
  className,
}) => {
  const { iconSet } = useUIStore();
  const isColorful = iconSet === "colorful";

  // Priority 1: Actual Windows Native Executable Icon extracted directly from the system binary
  if (iconData) {
    return (
      <img
        src={iconData}
        alt={processName}
        width={size}
        height={size}
        className={cn(
          "object-contain select-none shrink-0 pointer-events-none bg-transparent",
          className
        )}
        style={{ width: size, height: size }}
        loading="lazy"
        onError={(e) => {
          // If the extracted icon PNG has an issue rendering, hide it and fall back
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
    );
  }

  const lower = processName.toLowerCase().trim();

  // Priority 2: Stash Application
  if (isStash || lower.startsWith("stash")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Stash"
      >
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path
            d="M10 6.5C8.6 6.5 7.5 7.6 7.5 9v14c0 1.4 1.1 2.5 2.5 2.5h12c1.4 0 2.5-1.1 2.5-2.5V13l-6.5-6.5H10z"
            fill="currentColor"
            className="text-primary"
          />
          <path d="M18 6.5V13h6.5" fill="currentColor" className="text-primary/50" />
        </svg>
      </div>
    );
  }

  // Priority 3: Orca Slicer / Orca 3D
  if (lower.startsWith("orca") || lower.includes("orcaslicer") || lower.includes("orca_slicer")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Orca Slicer"
      >
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path
            d="M26 9c-2.5 0-5.8 2.2-8.5 5.5-2.4-3.5-5.5-5-8.5-5C4.5 9.5 2 13 2 17.5c0 6.5 6.5 10 14 10s14-3.5 14-10c0-4.5-2-8.5-4-8.5z"
            fill={isColorful ? "#0284c7" : "currentColor"}
          />
          <path
            d="M16 4c-1.5 3-3 7-2 10.5 1.5-1 3.5-1.5 5.5-1.5 1 0 1.5-.2 2-.5C20.5 8 18 5 16 4z"
            fill={isColorful ? "#38bdf8" : "currentColor"}
          />
          <ellipse
            cx="21.5"
            cy="15"
            rx="3"
            ry="1.5"
            transform="rotate(-20 21.5 15)"
            fill={isColorful ? "#ffffff" : "currentColor"}
            fillOpacity={isColorful ? 0.95 : 0.4}
          />
          <path
            d="M5 24c3.5 1.5 7.5 2 11 1.5 4-.6 8-2.6 11-5.5"
            stroke={isColorful ? "#90e0ef" : "currentColor"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Priority 4: AGY / Google Antigravity CLI
  if (lower.startsWith("agy") || lower.includes("antigravity")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Antigravity (AGY)"
      >
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="5.5"
            transform="rotate(-25 16 16)"
            stroke={isColorful ? "#c084fc" : "currentColor"}
            strokeWidth="1.6"
            strokeDasharray="4 2"
          />
          <circle
            cx="16"
            cy="16"
            r="6"
            fill={isColorful ? "url(#agy-grad-proc)" : "currentColor"}
            fillOpacity={isColorful ? 1 : 0.8}
          />
          <path
            d="M16 9.5l3.5 4h-2.2v4.5h-2.6v-4.5h-2.2l3.5-4z"
            fill={isColorful ? "#ffffff" : "currentColor"}
          />
          {isColorful && (
            <defs>
              <linearGradient id="agy-grad-proc" x1="10" y1="10" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9333ea" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
    );
  }

  // Priority 5: Google Chrome
  if (lower.includes("chrome")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Google Chrome"
      >
        {isColorful ? (
          <svg viewBox="0 0 48 48" width={size} height={size}>
            <circle cx="24" cy="24" r="20" fill="#fbc02d" />
            <path
              d="M24 14a10 10 0 0 0-8.66 5L7 7.08A20 20 0 0 1 40.92 14H24z"
              fill="#e53935"
            />
            <path
              d="M24 34a10 10 0 0 0 8.66-5H40.92A20 20 0 0 1 15.34 40.92L24 25.92A10 10 0 0 0 24 34z"
              fill="#43a047"
            />
            <circle cx="24" cy="24" r="8" fill="#1e88e5" />
            <circle cx="24" cy="24" r="10" fill="none" stroke="#fff" strokeWidth="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="21.17" y1="8" x2="12" y2="8" />
            <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
            <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
          </svg>
        )}
      </div>
    );
  }

  // Priority 6: Visual Studio Code
  if (lower.includes("code") || lower === "code.exe") {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Visual Studio Code"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#007ACC" : "currentColor"}>
          <path d="M17.65 2.15a1.5 1.5 0 0 0-1.63.33L8.6 9.4 4.54 6.32a1 1 0 0 0-1.42.23l-1.8 2.4a1 1 0 0 0 .15 1.37L5.7 13.5l-4.23 3.18a1 1 0 0 0-.15 1.37l1.8 2.4a1 1 0 0 0 1.42.23l4.06-3.08 7.42 6.92a1.5 1.5 0 0 0 2.53-1.07V3.45a1.5 1.5 0 0 0-.9-1.3zM16.5 18.2l-6-5.2 6-5.2v10.4z" />
        </svg>
      </div>
    );
  }

  // Priority 7: Discord
  if (lower.includes("discord")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Discord"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#5865F2" : "currentColor"}>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </div>
    );
  }

  // Priority 8: Spotify
  if (lower.includes("spotify")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Spotify"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#1DB954" : "currentColor"}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      </div>
    );
  }

  // Priority 9: Steam
  if (lower.includes("steam")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Steam"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#66c0f4" : "currentColor"}>
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.707L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm-3.613 14.776l-1.39-.575c.234-.413.621-.73 1.089-.868.918-.27 1.884.254 2.155 1.172.27 1.018-.328 1.983-1.346 2.253-.468.125-.953.053-1.354-.153l1.43.59c.708.293 1.516-.046 1.809-.753.292-.708-.046-1.516-.754-1.809-.344-.143-.71-.144-.989.143zm7.575-8.084c1.378 0 2.495 1.117 2.495 2.495 0 1.378-1.117 2.495-2.495 2.495-1.378 0-2.495-1.117-2.495-2.495 0-1.378 1.117-2.495 2.495-2.495zm0 .749c-.965 0-1.747.782-1.747 1.746 0 .965.782 1.747 1.747 1.747.964 0 1.746-.782 1.746-1.747 0-.964-.782-1.746-1.746-1.746z" />
        </svg>
      </div>
    );
  }

  // Priority 10: Blender 3D
  if (lower.startsWith("blender")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Blender"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#e87d0d" : "currentColor"}>
          <path d="M12.016 11.016a5 5 0 1 0 5 5 5.006 5.006 0 0 0-5-5zm0 8.016a3.016 3.016 0 1 1 3.016-3.016 3.02 3.02 0 0 1-3.016 3.016zM9.54 8.788L4.62 1.636a1 1 0 0 0-1.64 1.144L6.96 8.52A7.95 7.95 0 0 0 4 15.016a8.016 8.016 0 1 0 14.156-5.148l2.67-4.11a1 1 0 1 0-1.68-1.092l-3.328 5.12a7.973 7.973 0 0 0-6.278-.998z" />
        </svg>
      </div>
    );
  }

  // Priority 11: Figma
  if (lower.startsWith("figma")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Figma"
      >
        {isColorful ? (
          <svg viewBox="0 0 38 57" width={size * 0.85} height={size} fill="none">
            <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
            <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
            <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
            <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
            <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
          </svg>
        ) : (
          <span className="font-bold text-xs text-foreground font-mono">F</span>
        )}
      </div>
    );
  }

  // Priority 12: OBS Studio
  if (lower.startsWith("obs") || lower.includes("obs64")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="OBS Studio"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6a6 6 0 0 1 5.2 3 6 6 0 0 1-2.2 7.8 6 6 0 0 1-8-1.8A6 6 0 0 1 12 6z" />
        </svg>
      </div>
    );
  }

  // Priority 13: Microsoft Edge
  if (lower.includes("msedge") || lower.includes("edge")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Microsoft Edge"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#0078D7" : "currentColor"}>
          <path d="M23.01 16.48c-.28 3.86-3.48 6.94-7.53 7.02-4.5.09-8.4-3.08-9.25-7.51-.18-.94-.23-1.9-.15-2.85.12-1.4.52-2.75 1.17-3.99-1.25.99-2.22 2.3-2.79 3.79-.57 1.49-.69 3.1-.35 4.67.68 3.14 2.8 5.76 5.72 7.07 2.92 1.31 6.3 1.31 9.22 0 1.54-.69 2.88-1.73 3.96-3.04.47-.57.85-1.21 1.14-1.9.11-.27-.08-.54-.35-.54-.34 0-.68-.11-1.04-.28zM12.16.5c-3.1.04-6.05 1.35-8.17 3.63-2.12 2.28-3.19 5.35-2.95 8.44.1.28.43.38.65.19 1.48-1.28 3.25-2.19 5.16-2.65 1.91-.46 3.9-.45 5.8.04 2.45.63 4.54 2.15 5.86 4.25 1.32 2.1 1.77 4.62 1.25 7.05-.05.23.16.43.39.38 1.83-.43 3.48-1.42 4.72-2.84 1.24-1.42 1.99-3.21 2.14-5.11.23-2.91-.79-5.8-2.81-7.96C21.2 3.72 18.25 2.5 15.34 2.5c-.39 0-.78.02-1.18.06-1.03-.49-2.13-.77-3.25-.81-.25-.01-.5-.01-.75-.01z" />
        </svg>
      </div>
    );
  }

  // Priority 14: Mozilla Firefox
  if (lower.includes("firefox")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Mozilla Firefox"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#FF7139" : "currentColor"}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.92 6.46c-.22.61-.53 1.18-.91 1.7-.13.18-.32.32-.54.39-.23.07-.47.05-.68-.06-.5-.26-1.07-.4-1.65-.4-1.74 0-3.15 1.41-3.15 3.15 0 .28.04.56.11.83.07.28.04.57-.1.82-.14.25-.38.42-.66.47-.28.05-.57-.02-.8-.18-.84-.59-1.34-1.55-1.34-2.58 0-1.74 1.41-3.15 3.15-3.15.54 0 1.06.13 1.53.38.2.11.44.13.65.07.21-.06.39-.2.48-.4.36-.78.91-1.45 1.59-1.92.21-.15.48-.19.72-.11.24.08.42.26.49.5z" />
        </svg>
      </div>
    );
  }

  // Priority 15: Slack
  if (lower.includes("slack")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Slack"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#E01E5A" : "currentColor"}>
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
      </div>
    );
  }

  // Priority 16: Notion
  if (lower.includes("notion")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0 font-black font-serif", className)}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.8) }}
        title="Notion"
      >
        N
      </div>
    );
  }

  // Priority 17: Docker Desktop
  if (lower.startsWith("docker")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Docker"
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={isColorful ? "#2496ed" : "currentColor"}>
          <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.083.185.186.185M23.76 9.89a3.868 3.868 0 00-2.316-1.503l-.403-.082-.249.33a5.55 5.55 0 01-3.664 2.115H.982a.987.987 0 00-.982.99 8.016 8.016 0 002.348 5.688 12.39 12.39 0 008.826 3.566c7.098 0 11.956-4.52 12.632-10.744a3.82 3.82 0 00-.046-.36" />
        </svg>
      </div>
    );
  }

  // Priority 18: Windows Explorer
  if (lower.includes("explorer")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Windows File Explorer"
      >
        <HardDrive className={cn("shrink-0", isColorful ? "text-amber-500" : "text-foreground")} size={size} weight="bold" />
      </div>
    );
  }

  // Priority 19: Terminal / PowerShell / CMD
  if (lower.includes("cmd") || lower.includes("powershell") || lower.includes("terminal") || lower.includes("pwsh")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Terminal"
      >
        <Terminal className={cn("shrink-0", isColorful ? "text-emerald-400" : "text-foreground")} size={size} weight="bold" />
      </div>
    );
  }

  // Priority 20: System Process
  if (lower === "dwm.exe" || lower.includes("svchost") || lower.includes("system") || lower.includes("services")) {
    return (
      <div
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
        title="Windows System Process"
      >
        <Gear className="shrink-0 text-muted-foreground" size={size} weight="bold" />
      </div>
    );
  }

  // Fallback: Clean containerless Initial letter
  const initial = (processName.replace(/\.exe$/i, "").charAt(0) || "A").toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-bold font-mono uppercase shrink-0 text-muted-foreground/80",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.65) }}
      title={processName}
    >
      {initial}
    </div>
  );
};
