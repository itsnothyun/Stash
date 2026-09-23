import React from "react";
import { Minus, Square, X } from "lucide-react";
import {
  closeCurrentWindow,
  minimizeCurrentWindow,
  toggleMaximizeCurrentWindow,
} from "@/lib/tauri/window-manager";
import { cn } from "@/lib/utils/cn";

interface WindowControlsProps {
  allowMaximize?: boolean;
  className?: string;
  onClose?: () => void;
}

/**
 * Windows/Linux-style controls for our undecorated windows: full-height hit
 * targets flush to the top-right corner, with the destructive one reserving
 * its colour for hover.
 */
export const WindowControls: React.FC<WindowControlsProps> = ({
  allowMaximize = true,
  className,
  onClose,
}) => {
  const handleClose = () => (onClose ? onClose() : closeCurrentWindow());

  const buttonClass =
    "inline-flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:bg-surface-hover";

  return (
    <div
      className={cn("no-drag-region flex select-none items-stretch", className)}
    >
      <button
        onClick={() => minimizeCurrentWindow()}
        aria-label="Minimize"
        className={buttonClass}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {allowMaximize && (
        <button
          onClick={() => toggleMaximizeCurrentWindow()}
          aria-label="Maximize"
          className={buttonClass}
        >
          <Square className="h-2.5 w-2.5" />
        </button>
      )}

      <button
        onClick={handleClose}
        aria-label="Close"
        className={cn(
          buttonClass,
          "hover:bg-destructive hover:text-destructive-foreground focus-visible:bg-destructive focus-visible:text-destructive-foreground"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
