import React, { useState, useEffect } from "react";
import { Minus, Square, CopySimple, X } from "@phosphor-icons/react";
import {
  closeCurrentWindow,
  minimizeCurrentWindow,
  toggleMaximizeCurrentWindow,
  isWindowMaximized,
} from "@/lib/tauri/window-manager";
import { QuirkyExitModal } from "@/components/desktop/quirky-exit-modal";
import { cn } from "@/lib/utils/cn";

interface WindowControlsProps {
  allowMaximize?: boolean;
  confirmExit?: boolean;
  className?: string;
  onClose?: () => void;
}

/**
 * Windows/Linux-style controls for our undecorated windows: full-height hit
 * targets flush to the top-right corner, with minimize, maximize/restore,
 * and quirky exit confirmation.
 */
export const WindowControls: React.FC<WindowControlsProps> = ({
  allowMaximize = true,
  confirmExit = true,
  className,
  onClose,
}) => {
  const [maximized, setMaximized] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Poll/Check initial window states
  useEffect(() => {
    let mounted = true;
    const checkState = async () => {
      try {
        const isMax = await isWindowMaximized();
        if (mounted) {
          setMaximized(isMax);
        }
      } catch {
        // Ignore fallback
      }
    };

    checkState();
    const interval = setInterval(checkState, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMinimize = async () => {
    await minimizeCurrentWindow();
  };

  const handleToggleMaximize = async () => {
    const nextState = await toggleMaximizeCurrentWindow();
    setMaximized(nextState);
  };

  const handleCloseClick = () => {
    if (confirmExit) {
      setShowExitModal(true);
    } else {
      if (onClose) {
        onClose();
      } else {
        void closeCurrentWindow();
      }
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (onClose) {
      onClose();
    } else {
      void closeCurrentWindow();
    }
  };

  const buttonClass =
    "inline-flex h-11 w-10 sm:w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:bg-surface-hover select-none cursor-pointer";

  return (
    <>
      <div
        className={cn("no-drag-region flex select-none items-stretch", className)}
      >
        {/* Minimize Button */}
        <button
          type="button"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize"
          className={buttonClass}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Maximize / Restore Button */}
        {allowMaximize && (
          <button
            type="button"
            onClick={handleToggleMaximize}
            title={maximized ? "Restore Down" : "Maximize"}
            aria-label={maximized ? "Restore Down" : "Maximize"}
            className={buttonClass}
          >
            {maximized ? (
              <CopySimple className="h-3 w-3 -scale-y-100 rotate-90" />
            ) : (
              <Square className="h-2.5 w-2.5" />
            )}
          </button>
        )}

        {/* Close / Exit Button */}
        <button
          type="button"
          onClick={handleCloseClick}
          title="Close Stash"
          aria-label="Close"
          className={cn(
            buttonClass,
            "hover:bg-destructive hover:text-destructive-foreground focus-visible:bg-destructive focus-visible:text-destructive-foreground"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quirky Exit Confirmation Modal */}
      <QuirkyExitModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onConfirmExit={handleConfirmExit}
      />
    </>
  );
};
