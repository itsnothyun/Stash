import React, { useEffect, useState } from "react";
import {
  isTauri,
  startWindowResize,
  ResizeDirection,
  isWindowMaximized,
  isWindowFullscreen,
} from "@/lib/tauri/window-manager";

/**
 * Native Window Resize Borders for frameless / undecorated Tauri windows.
 *
 * Provides:
 * 1. 8-direction native OS DWM resize handles (edges & corners).
 * 2. Instant cursor switching (ns-resize, ew-resize, nwse-resize, nesw-resize).
 * 3. Resize animation stopper: temporarily freezes CSS transitions during resize
 *    to eliminate layout thrashing, jitter, and frame drops.
 */
export const WindowResizeBorders: React.FC = () => {
  const [disabled, setDisabled] = useState(false);

  // 1. Temporarily freeze transitions & animations while resizing
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onResize = () => {
      document.body.classList.add("resize-animation-stopper");
      clearTimeout(timer);
      timer = setTimeout(() => {
        document.body.classList.remove("resize-animation-stopper");
      }, 150);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
      document.body.classList.remove("resize-animation-stopper");
    };
  }, []);

  // 2. Hide resize handles when window is maximized or fullscreen
  useEffect(() => {
    if (!isTauri()) return;

    let mounted = true;
    const checkState = async () => {
      try {
        const [isMax, isFull] = await Promise.all([
          isWindowMaximized(),
          isWindowFullscreen(),
        ]);
        if (mounted) {
          setDisabled(isMax || isFull);
        }
      } catch {
        // Ignore fallback
      }
    };

    checkState();
    const interval = setInterval(checkState, 1500);
    window.addEventListener("resize", checkState, { passive: true });

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("resize", checkState);
    };
  }, []);

  // If not running in Tauri or window is maximized/fullscreen, don't render handles
  if (!isTauri() || disabled) {
    return null;
  }

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    void startWindowResize(direction);
  };

  return (
    <>
      {/* Edges */}
      <div
        className="window-resize-border top-0 left-3 right-3 h-1.5 cursor-ns-resize"
        onPointerDown={(e) => handlePointerDown(e, "North")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border bottom-0 left-3 right-3 h-1.5 cursor-ns-resize"
        onPointerDown={(e) => handlePointerDown(e, "South")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border left-0 top-3 bottom-3 w-1.5 cursor-ew-resize"
        onPointerDown={(e) => handlePointerDown(e, "West")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border right-0 top-3 bottom-3 w-1.5 cursor-ew-resize"
        onPointerDown={(e) => handlePointerDown(e, "East")}
        aria-hidden="true"
      />

      {/* Corners */}
      <div
        className="window-resize-border top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize"
        onPointerDown={(e) => handlePointerDown(e, "NorthWest")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize"
        onPointerDown={(e) => handlePointerDown(e, "NorthEast")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize"
        onPointerDown={(e) => handlePointerDown(e, "SouthWest")}
        aria-hidden="true"
      />
      <div
        className="window-resize-border bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize"
        onPointerDown={(e) => handlePointerDown(e, "SouthEast")}
        aria-hidden="true"
      />
    </>
  );
};
