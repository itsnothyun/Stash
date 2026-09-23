import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

export async function closeCurrentWindow() {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      await win.close();
    } catch (e) {
      console.error("Failed to close window", e);
    }
  } else {
    window.close();
  }
}

export async function minimizeCurrentWindow() {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      await win.minimize();
    } catch (e) {
      console.error("Failed to minimize window", e);
    }
  }
}

export async function toggleMaximizeCurrentWindow() {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      const isMax = await win.isMaximized();
      if (isMax) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
    } catch (e) {
      console.error("Failed to maximize/unmaximize window", e);
    }
  }
}

export async function setAlwaysOnTop(alwaysOnTop: boolean) {
  if (isTauri()) {
    try {
      const win = getCurrentWebviewWindow();
      await win.setAlwaysOnTop(alwaysOnTop);
    } catch (e) {
      console.error("Failed to set always on top", e);
    }
  }
}
