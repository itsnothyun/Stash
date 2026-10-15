import type { Context, DirCheck, Options, Outcome, Progress, SetupError } from "./api";

export type Screen =
  | "loading"
  | "welcome"
  | "options"
  | "installing"
  | "done"
  | "error"
  | "remove"
  | "removing"
  | "removed";

export interface WizardState {
  screen: Screen;
  context: Context | null;
  options: Options | null;
  dirCheck: DirCheck | null;
  progress: Progress | null;
  warnings: string[];
  error: SetupError | null;
  deleteData: boolean;
  /** Screen the error came from, so "Try again" knows what to redo. */
  failedDuring: "installing" | "removing" | null;
}

export type Action =
  | { type: "loaded"; context: Context }
  | { type: "goTo"; screen: "welcome" | "options" | "remove" }
  | { type: "setOptions"; patch: Partial<Options> }
  | { type: "dirChecked"; dir: string; check: DirCheck }
  | { type: "setDeleteData"; value: boolean }
  | { type: "start"; screen: "installing" | "removing" }
  | { type: "progress"; progress: Progress }
  | { type: "finished"; outcome: Outcome }
  | { type: "failed"; error: SetupError };

export const initialState: WizardState = {
  screen: "loading",
  context: null,
  options: null,
  dirCheck: null,
  progress: null,
  warnings: [],
  error: null,
  deleteData: false,
  failedDuring: null,
};

export function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "loaded":
      return {
        ...state,
        context: action.context,
        options: action.context.defaults,
        screen: action.context.action === "uninstall" ? "remove" : "welcome",
      };
    case "goTo":
      return { ...state, screen: action.screen, error: null };
    case "setOptions":
      if (!state.options) return state;
      return {
        ...state,
        options: { ...state.options, ...action.patch },
        // A new folder invalidates the previous check until it comes back.
        dirCheck: action.patch.dir !== undefined ? null : state.dirCheck,
      };
    case "dirChecked":
      // Ignore answers for a folder the user has already moved away from.
      if (state.options?.dir !== action.dir) return state;
      return { ...state, dirCheck: action.check };
    case "setDeleteData":
      return { ...state, deleteData: action.value };
    case "start":
      return {
        ...state,
        screen: action.screen,
        progress: null,
        warnings: [],
        error: null,
        failedDuring: null,
      };
    case "progress":
      return { ...state, progress: action.progress };
    case "finished":
      return {
        ...state,
        screen: state.screen === "removing" ? "removed" : "done",
        warnings: action.outcome.warnings,
      };
    case "failed":
      return {
        ...state,
        screen: "error",
        error: action.error,
        failedDuring: state.screen === "removing" ? "removing" : "installing",
      };
  }
}

/** Step dots shown on the main install path; null hides them. */
export function stepIndex(screen: Screen): number | null {
  switch (screen) {
    case "welcome":
      return 0;
    case "options":
      return 1;
    case "installing":
      return 2;
    default:
      return null;
  }
}

/** Map per-stage progress onto one bar. Migration only appears for legacy installs. */
export function overallFraction(progress: Progress | null): number {
  if (!progress) return 0;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const f = clamp(progress.fraction);
  switch (progress.stage) {
    case "migrating":
      return 0.05;
    case "extracting":
      return 0.1 + f * 0.8;
    case "finishing":
      return 0.9 + f * 0.1;
    case "removing":
      return f;
  }
}

export function canInstall(state: WizardState): boolean {
  return Boolean(
    state.context &&
      !state.context.payloadMissing &&
      state.options &&
      state.dirCheck &&
      state.dirCheck.problem === null,
  );
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.max(1, Math.ceil(bytes / 1024 ** 2))} MB`;
}
