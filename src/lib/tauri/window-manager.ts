import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
};

/**
 * Closes the current window.
 * Uses native Rust command first, then Tauri Window API, and finally browser fallback.
 */
export async function closeCurrentWindow() {
  if (isTauri()) {
    try {
      await invoke("close_current_window_cmd");
      return;
    } catch {
      // Fallback to Window API
    }

    try {
      const win = getCurrentWebviewWindow();
      await win.close();
      return;
    } catch {
      try {
        const win = getCurrentWindow();
        await win.close();
        return;
      } catch (e) {
        console.error("Failed to close window via Tauri API", e);
      }
    }
  }

  try {
    window.close();
  } catch {
    // Ignore browser close restriction
  }
}

/**
 * Minimizes the current window.
 */
export async function minimizeCurrentWindow() {
  if (isTauri()) {
    try {
      await invoke("minimize_current_window");
      return;
    } catch {
      // Fallback
    }

    try {
      const win = getCurrentWebviewWindow();
      await win.minimize();
      return;
    } catch {
      try {
        const win = getCurrentWindow();
        await win.minimize();
      } catch (e) {
        console.error("Failed to minimize window", e);
      }
    }
  }
}

/**
 * Toggles maximize / restore on the current window.
 */
export async function toggleMaximizeCurrentWindow(): Promise<boolean> {
  if (isTauri()) {
    try {
      const result = await invoke<boolean>("toggle_maximize_current_window");
      return Boolean(result);
    } catch {
      // Fallback
    }

    try {
      const win = getCurrentWebviewWindow();
      const isMax = await win.isMaximized();
      if (isMax) {
        await win.unmaximize();
        return false;
      } else {
        await win.maximize();
        return true;
      }
    } catch {
      try {
        const win = getCurrentWindow();
        const isMax = await win.isMaximized();
        if (isMax) {
          await win.unmaximize();
          return false;
        } else {
          await win.maximize();
          return true;
        }
      } catch (e) {
        console.error("Failed to maximize/unmaximize window", e);
      }
    }
  }

  return false;
}

/**
 * Toggles fullscreen mode on the current window.
 * Supports native Tauri window fullscreen and HTML5 Fullscreen API fallback.
 */
export async function toggleFullscreenCurrentWindow(): Promise<boolean> {
  if (isTauri()) {
    try {
      const result = await invoke<boolean>("toggle_fullscreen_current_window");
      return Boolean(result);
    } catch {
      // Fallback
    }

    try {
      const win = getCurrentWindow();
      const isFull = await win.isFullscreen();
      await win.setFullscreen(!isFull);
      return !isFull;
    } catch {
      try {
        const win = getCurrentWebviewWindow();
        const isFull = await win.isFullscreen();
        await win.setFullscreen(!isFull);
        return !isFull;
      } catch (e) {
        console.error("Failed to toggle fullscreen", e);
      }
    }
  }

  // HTML5 Fullscreen fallback for web previews
  if (typeof document !== "undefined") {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        return true;
      } else {
        await document.exitFullscreen();
        return false;
      }
    } catch (e) {
      console.warn("Fullscreen request error", e);
    }
  }

  return false;
}

/**
 * Checks whether the current window is maximized.
 */
export async function isWindowMaximized(): Promise<boolean> {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      return await win.isMaximized();
    } catch {
      try {
        const win = getCurrentWindow();
        return await win.isMaximized();
      } catch {
        return false;
      }
    }
  }
  return false;
}

/**
 * Checks whether the current window is fullscreen.
 */
export async function isWindowFullscreen(): Promise<boolean> {
  if (isTauri()) {
    try {
      const win = getCurrentWindow();
      return await win.isFullscreen();
    } catch {
      try {
        const win = getCurrentWebviewWindow();
        return await win.isFullscreen();
      } catch {
        return false;
      }
    }
  }

  return typeof document !== "undefined" && Boolean(document.fullscreenElement);
}

/**
 * Sets whether the current window stays on top of all other windows.
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean) {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      await win.setAlwaysOnTop(alwaysOnTop);
    } catch {
      try {
        const win = getCurrentWindow();
        await win.setAlwaysOnTop(alwaysOnTop);
      } catch (e) {
        console.error("Failed to set always on top", e);
      }
    }
  }
}

export type ResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

/**
 * Initiates native OS window resizing in the given direction.
 * This delegates resizing directly to Windows OS DWM loop for 60-144fps responsiveness.
 */
export async function startWindowResize(direction: ResizeDirection) {
  if (isTauri()) {
    try {
      const win = getCurrentWindow();
      await win.startResizeDragging(direction);
      return;
    } catch {
      try {
        const win = getCurrentWebviewWindow();
        await win.startResizeDragging(direction);
      } catch (e) {
        console.error("Failed to start native resize dragging", e);
      }
    }
  }
}

