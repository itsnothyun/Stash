import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type Platform = "windows" | "macos";

export type Mode =
  | { kind: "fresh" }
  | { kind: "update"; from: string }
  | { kind: "repair" }
  | { kind: "downgrade"; from: string };

export interface Options {
  dir: string;
  desktopShortcut: boolean;
  startMenu: boolean;
  launchAtLogin: boolean;
}

export interface Installed {
  dir: string;
  version: string;
  needsElevation: boolean;
}

export interface Context {
  action: "install" | "uninstall";
  mode: Mode;
  installed: Installed | null;
  version: string;
  platform: Platform;
  defaults: Options;
  requiredBytes: number;
  payloadMissing: boolean;
}

export interface DirCheck {
  problem: string | null;
  freeBytes: number | null;
  requiredBytes: number;
}

export type Stage = "migrating" | "extracting" | "finishing" | "removing";

export interface Progress {
  stage: Stage;
  fraction: number;
}

export interface Outcome {
  warnings: string[];
}

export interface SetupError {
  code: string;
  message: string;
}

/** Commands reject with `SetupError`; anything else is an unexpected failure. */
export function asSetupError(error: unknown): SetupError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return error as SetupError;
  }
  return { code: "internal", message: String(error) };
}

export const api = {
  getContext: () => invoke<Context>("get_context"),
  checkDir: (dir: string) => invoke<DirCheck>("check_dir", { dir }),
  pickFolder: (current: string) => invoke<string | null>("pick_folder", { current }),
  closeStash: (dir: string | null, force: boolean) => invoke<void>("close_stash", { dir, force }),
  install: (options: Options) => invoke<Outcome>("run_install", { options }),
  uninstall: (deleteData: boolean) => invoke<Outcome>("run_uninstall", { deleteData }),
  launchStash: (dir: string) => invoke<void>("launch_stash", { dir }),
  onProgress: (handler: (progress: Progress) => void): Promise<UnlistenFn> =>
    listen<Progress>("setup://progress", (event) => handler(event.payload)),
};
