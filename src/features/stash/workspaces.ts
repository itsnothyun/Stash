export interface WorkspacePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  noteIds: string[];
  createdAt: string;
}

const STORAGE_KEY = "stash_workspace_presets";
const ACTIVE_WORKSPACE_KEY = "stash_active_workspace";

export const DEFAULT_WORKSPACES: WorkspacePreset[] = [
  {
    id: "ws-focus",
    name: "Deep Focus",
    icon: "🎯",
    description: "Distraction-free setup for single-task deep work",
    noteIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ws-dev",
    name: "Dev Workbench",
    icon: "💻",
    description: "Code sandbox, API blueprints & sprint tasks",
    noteIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ws-finance",
    name: "Market & Finance",
    icon: "📊",
    description: "Live crypto tickers, currency swaps & expense logs",
    noteIds: [],
    createdAt: new Date().toISOString(),
  },
];

export function loadWorkspaces(): WorkspacePreset[] {
  if (typeof localStorage === "undefined") return DEFAULT_WORKSPACES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WORKSPACES));
      return DEFAULT_WORKSPACES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
}

export function saveWorkspace(
  name: string,
  icon: string,
  description: string,
  noteIds: string[]
): WorkspacePreset {
  const current = loadWorkspaces();
  const newPreset: WorkspacePreset = {
    id: `ws-${Date.now()}`,
    name: name.trim() || "Custom Workspace",
    icon: icon || "📁",
    description: description.trim() || "Saved spatial arrangement",
    noteIds,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newPreset];
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newPreset;
}

export function deleteWorkspace(id: string): void {
  const current = loadWorkspaces();
  const updated = current.filter((w) => w.id !== id);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function getActiveWorkspaceId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setActiveWorkspaceId(id: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  }
}
