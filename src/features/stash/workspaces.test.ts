import { describe, it, expect, beforeEach } from "vitest";
import {
  loadWorkspaces,
  saveWorkspace,
  deleteWorkspace,
  setActiveWorkspaceId,
  getActiveWorkspaceId,
} from "./workspaces";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe("Desktop Spatial Workspaces", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads default presets when empty", () => {
    const list = loadWorkspaces();
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some((w) => w.name === "Deep Focus")).toBe(true);
  });

  it("creates and persists a new workspace preset", () => {
    const created = saveWorkspace(
      "Code Sprint",
      "⚡",
      "Focused 2-window dev setup",
      ["note-a", "note-b"]
    );

    expect(created.id).toContain("ws-");
    expect(created.name).toBe("Code Sprint");
    expect(created.noteIds).toEqual(["note-a", "note-b"]);

    const list = loadWorkspaces();
    expect(list.some((w) => w.id === created.id)).toBe(true);
  });

  it("deletes a workspace preset", () => {
    const created = saveWorkspace("Temporary", "🗑️", "Temp", []);
    deleteWorkspace(created.id);

    const list = loadWorkspaces();
    expect(list.some((w) => w.id === created.id)).toBe(false);
  });

  it("keeps the list empty after every preset is deleted", () => {
    for (const ws of loadWorkspaces()) deleteWorkspace(ws.id);
    expect(loadWorkspaces()).toEqual([]);
  });

  it("tracks active workspace ID in storage", () => {
    setActiveWorkspaceId("ws-test-123");
    expect(getActiveWorkspaceId()).toBe("ws-test-123");

    setActiveWorkspaceId(null);
    expect(getActiveWorkspaceId()).toBeNull();
  });
});
