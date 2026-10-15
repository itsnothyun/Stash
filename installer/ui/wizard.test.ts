import { describe, expect, it } from "vitest";
import type { Context } from "./api";
import {
  canInstall,
  formatBytes,
  initialState,
  overallFraction,
  reducer,
  stepIndex,
  type WizardState,
} from "./wizard";

const context = (overrides: Partial<Context> = {}): Context => ({
  action: "install",
  mode: { kind: "fresh" },
  installed: null,
  version: "0.1.1",
  platform: "windows",
  defaults: {
    dir: "C:\\Users\\me\\AppData\\Local\\Programs\\Stash",
    desktopShortcut: true,
    startMenu: true,
    launchAtLogin: false,
  },
  requiredBytes: 15_000_000,
  payloadMissing: false,
  ...overrides,
});

const loaded = (overrides: Partial<Context> = {}): WizardState =>
  reducer(initialState, { type: "loaded", context: context(overrides) });

describe("wizard reducer", () => {
  it("opens on welcome for installs and on remove for --uninstall", () => {
    expect(loaded().screen).toBe("welcome");
    expect(loaded({ action: "uninstall" }).screen).toBe("remove");
  });

  it("seeds options from the backend defaults", () => {
    expect(loaded().options?.desktopShortcut).toBe(true);
  });

  it("clears the folder check when the folder changes", () => {
    let s = loaded();
    s = reducer(s, {
      type: "dirChecked",
      dir: s.options!.dir,
      check: { problem: null, freeBytes: 1e9, requiredBytes: 1 },
    });
    expect(s.dirCheck).not.toBeNull();
    s = reducer(s, { type: "setOptions", patch: { launchAtLogin: true } });
    expect(s.dirCheck).not.toBeNull();
    s = reducer(s, { type: "setOptions", patch: { dir: "D:\\Stash" } });
    expect(s.dirCheck).toBeNull();
  });

  it("ignores a stale folder check", () => {
    let s = reducer(loaded(), { type: "setOptions", patch: { dir: "D:\\Stash" } });
    s = reducer(s, {
      type: "dirChecked",
      dir: "C:\\old",
      check: { problem: null, freeBytes: 1, requiredBytes: 1 },
    });
    expect(s.dirCheck).toBeNull();
  });

  it("finishes installs on done and removals on removed", () => {
    let s = reducer(loaded(), { type: "start", screen: "installing" });
    s = reducer(s, { type: "finished", outcome: { warnings: ["no shortcut"] } });
    expect(s.screen).toBe("done");
    expect(s.warnings).toEqual(["no shortcut"]);

    s = reducer(loaded(), { type: "start", screen: "removing" });
    s = reducer(s, { type: "finished", outcome: { warnings: [] } });
    expect(s.screen).toBe("removed");
  });

  it("remembers which operation failed so retry can redo it", () => {
    let s = reducer(loaded(), { type: "start", screen: "removing" });
    s = reducer(s, { type: "failed", error: { code: "x", message: "nope" } });
    expect(s.screen).toBe("error");
    expect(s.failedDuring).toBe("removing");

    s = reducer(s, { type: "start", screen: "installing" });
    expect(s.error).toBeNull();
    expect(s.failedDuring).toBeNull();
  });
});

describe("canInstall", () => {
  const checked = (problem: string | null, overrides: Partial<Context> = {}) => {
    const s = loaded(overrides);
    return reducer(s, {
      type: "dirChecked",
      dir: s.options!.dir,
      check: { problem, freeBytes: 1e9, requiredBytes: 1 },
    });
  };

  it("needs a clean folder check", () => {
    expect(canInstall(loaded())).toBe(false);
    expect(canInstall(checked("No permission"))).toBe(false);
    expect(canInstall(checked(null))).toBe(true);
  });

  it("refuses when the setup has no payload", () => {
    expect(canInstall(checked(null, { payloadMissing: true }))).toBe(false);
  });
});

describe("helpers", () => {
  it("shows step dots only on the main path", () => {
    expect(stepIndex("welcome")).toBe(0);
    expect(stepIndex("options")).toBe(1);
    expect(stepIndex("installing")).toBe(2);
    expect(stepIndex("done")).toBeNull();
    expect(stepIndex("remove")).toBeNull();
  });

  it("maps stage progress onto one bar", () => {
    expect(overallFraction(null)).toBe(0);
    expect(overallFraction({ stage: "extracting", fraction: 0 })).toBeCloseTo(0.1);
    expect(overallFraction({ stage: "extracting", fraction: 1 })).toBeCloseTo(0.9);
    expect(overallFraction({ stage: "finishing", fraction: 1 })).toBe(1);
    expect(overallFraction({ stage: "removing", fraction: 2 })).toBe(1);
  });

  it("formats sizes", () => {
    expect(formatBytes(14_565_873)).toBe("14 MB");
    expect(formatBytes(500)).toBe("1 MB");
    expect(formatBytes(120 * 1024 ** 3)).toBe("120.0 GB");
  });
});
