import { invoke } from "@tauri-apps/api/core";
import { emit, listen, UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "@/lib/tauri/window-manager";
import {
  Note,
  NoteWindowState,
  Revision,
  Settings,
  Tag,
} from "@/features/stash/types/note";
import { NoteColor } from "@/features/stash/types/color";
import { ReferenceLink } from "@/features/references/types";

const MOCK_REFERENCES_KEY = "stash_mock_references_v1";

function loadMockReferences(): ReferenceLink[] {
  try {
    const raw = localStorage.getItem(MOCK_REFERENCES_KEY);
    return raw ? (JSON.parse(raw) as ReferenceLink[]) : [];
  } catch {
    return [];
  }
}

function saveMockReferences(links: ReferenceLink[]) {
  try {
    localStorage.setItem(MOCK_REFERENCES_KEY, JSON.stringify(links));
  } catch {
    /* storage full or unavailable — browser preview only */
  }
}

export interface CreateNoteInput {
  id?: string;
  title?: string;
  contentJson?: string;
  plainText?: string;
  color?: NoteColor;
  isPinned?: boolean;
  isFavorite?: boolean;
  tagNames?: string[];
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  contentJson?: string;
  plainText?: string;
  color?: NoteColor;
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  version?: number;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  notes: Note[];
  tags: Tag[];
  windowStates: NoteWindowState[];
}

export interface CpuCoreInfo {
  id: number;
  name: string;
  usage: number;
  frequency: number;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  is_removable: boolean;
  is_read_only: boolean;
  file_system: string;
  disk_type: string;
}

export interface ProcessStats {
  pid: number;
  memory_bytes: number;
  virtual_memory_bytes: number;
  cpu_usage: number;
  run_time_secs: number;
}

export interface AppProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
  virtual_memory_bytes: number;
  run_time_secs: number;
  is_stash: boolean;
  icon_data?: string | null;
}

export interface NetworkTelemetry {
  total_rx_bytes: number;
  total_tx_bytes: number;
  rx_rate_bytes_per_sec: number;
  tx_rate_bytes_per_sec: number;
  active_interfaces: number;
}

export interface ThermalTelemetry {
  package_temp_celsius: number | null;
  max_temp_celsius: number | null;
  sensor_count: number;
}

export interface SystemPerformanceSnapshot {
  os_name: string;
  os_version: string;
  kernel_version: string;
  hostname: string;
  uptime_secs: number;
  cpu_brand: string;
  cpu_vendor: string;
  physical_core_count: number;
  logical_core_count: number;
  global_cpu_usage: number;
  cpu_cores: CpuCoreInfo[];
  total_memory: number;
  used_memory: number;
  free_memory: number;
  available_memory: number;
  total_swap: number;
  used_swap: number;
  free_swap: number;
  disks: DiskInfo[];
  stash_process: ProcessStats | null;
  db_size_bytes: number;
  active_windows_count: number;
  processes: AppProcessInfo[];
  total_processes_count: number;
  top_cpu_consumer: AppProcessInfo | null;
  top_ram_consumer: AppProcessInfo | null;
  network: NetworkTelemetry;
  thermal: ThermalTelemetry;
}

export interface OptimizationResult {
  success: boolean;
  message: string;
  db_size_before: number;
  db_size_after: number;
  memory_freed_estimate_bytes: number;
}

const MOCK_NOTES_KEY = "stash_mock_notes_v2";

const DEFAULT_MOCK_NOTES: Note[] = [
  {
    id: "mock-1",
    title: "Welcome to Stash",
    contentJson: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Stash is your lightweight desktop memory layer. Capture thoughts with zero friction, keep them nearby, and retrieve them instantly.",
            },
          ],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Press Cmd/Ctrl+Shift+N to stash a thought anywhere" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Pin floating stashes above your desktop" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Press Cmd/Ctrl+K to open the command palette" }],
                },
              ],
            },
          ],
        },
      ],
    }),
    plainText:
      "Stash is your lightweight desktop memory layer. Capture thoughts with zero friction, keep them nearby, and retrieve them instantly.\n- Press Cmd/Ctrl+Shift+N to stash a thought anywhere\n- Pin floating stashes above your desktop\n- Press Cmd/Ctrl+K to open the command palette",
    color: "Sage",
    isPinned: true,
    isFavorite: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    sortIndex: 0,
    version: 1,
    tags: [{ id: "tag-1", name: "Ideas", color: "#34d399", createdAt: new Date().toISOString() }],
  },
  {
    id: "mock-2",
    title: "Today",
    contentJson: JSON.stringify({
      type: "todoList",
      version: 1,
      items: [
        {
          id: "mock-todo-1",
          text: "Press Ctrl+Shift+N to capture from anywhere",
          done: true,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        {
          id: "mock-todo-2",
          text: "Keep this list on top while you work",
          done: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
        },
        {
          id: "mock-todo-3",
          text: "Tick something off — it feels good",
          done: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
        },
      ],
    }),
    plainText:
      "☑ Press Ctrl+Shift+N to capture from anywhere\n☐ Keep this list on top while you work\n☐ Tick something off — it feels good",
    color: "Sky",
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    deletedAt: null,
    sortIndex: 1,
    version: 1,
    tags: [],
  },
];

function loadMockNotes(): Note[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(MOCK_NOTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [...DEFAULT_MOCK_NOTES];
}

let localMockNotes: Note[] = loadMockNotes();

function saveMockNotes() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MOCK_NOTES_KEY, JSON.stringify(localMockNotes));
    } catch {}
  }
}

// Keep localMockNotes synchronized if another tab writes to localStorage
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === MOCK_NOTES_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) localMockNotes = parsed;
      } catch {}
    }
  });
}

let localMockSettings: Settings = {
  theme: "system",
  defaultColor: "Paper",
  defaultAlwaysOnTop: false,
  launchAtStartup: false,
  closeToTray: true,
  restoreOpenNotes: true,
  globalShortcut: "CommandOrControl+Shift+N",
  hasCompletedOnboarding: true,
};

export const stashIpc = {
  async createNote(input: CreateNoteInput): Promise<Note> {
    if (isTauri()) {
      return await invoke<Note>("create_note", { input });
    }
    const newNote: Note = {
      id: input.id || "mock-" + Date.now(),
      title: input.title || "",
      contentJson: input.contentJson || '{"type":"doc","content":[]}',
      plainText: input.plainText || "",
      color: input.color || localMockSettings.defaultColor,
      isPinned: input.isPinned || false,
      isFavorite: input.isFavorite || false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      sortIndex: null,
      version: 1,
      tags: [],
    };
    localMockNotes.unshift(newNote);
    saveMockNotes();
    await this.emitEvent("stash://note-updated", newNote.id);
    return newNote;
  },

  async getNote(id: string): Promise<Note | null> {
    if (isTauri()) {
      return await invoke<Note | null>("get_note", { id });
    }
    // Re-check storage if note not yet in memory
    const existing = localMockNotes.find((n) => n.id === id);
    if (existing) return existing;
    localMockNotes = loadMockNotes();
    return localMockNotes.find((n) => n.id === id) || null;
  },

  async listNotes(
    section?: string,
    tagId?: string,
    color?: string
  ): Promise<Note[]> {
    if (isTauri()) {
      return await invoke<Note[]>("list_notes", { section, tagId, color });
    }
    return localMockNotes.filter((n) => {
      if (section === "trash") return n.deletedAt !== null;
      if (n.deletedAt !== null) return false;
      if (section === "archive") return n.isArchived;
      if (n.isArchived) return false;
      if (section === "pinned") return n.isPinned;
      if (section === "favorites") return n.isFavorite;
      if (section === "todos") {
        return (
          n.contentJson.includes('"type":"taskItem"') ||
          n.contentJson.includes('"type":"todoList"')
        );
      }
      if (tagId) return n.tags?.some((t) => t.id === tagId);
      if (color) return n.color === color;
      return true;
    });
  },

  async updateNote(input: UpdateNoteInput): Promise<Note> {
    if (isTauri()) {
      return await invoke<Note>("update_note", { input });
    }
    let idx = localMockNotes.findIndex((n) => n.id === input.id);
    if (idx === -1) {
      localMockNotes = loadMockNotes();
      idx = localMockNotes.findIndex((n) => n.id === input.id);
    }
    if (idx !== -1) {
      localMockNotes[idx] = {
        ...localMockNotes[idx],
        title: input.title !== undefined ? input.title : localMockNotes[idx].title,
        contentJson:
          input.contentJson !== undefined
            ? input.contentJson
            : localMockNotes[idx].contentJson,
        plainText:
          input.plainText !== undefined
            ? input.plainText
            : localMockNotes[idx].plainText,
        color: input.color || localMockNotes[idx].color,
        isPinned:
          input.isPinned !== undefined
            ? input.isPinned
            : localMockNotes[idx].isPinned,
        isFavorite:
          input.isFavorite !== undefined
            ? input.isFavorite
            : localMockNotes[idx].isFavorite,
        isArchived:
          input.isArchived !== undefined
            ? input.isArchived
            : localMockNotes[idx].isArchived,
        updatedAt: new Date().toISOString(),
        version: localMockNotes[idx].version + 1,
      };
      saveMockNotes();
      await this.emitEvent("stash://note-updated", input.id);
      return localMockNotes[idx];
    }
    throw new Error("Note not found");
  },

  async setNoteArchived(id: string, archived: boolean): Promise<void> {
    if (isTauri()) {
      await invoke("set_note_archived", { id, archived });
      return;
    }
    const n = localMockNotes.find((x) => x.id === id);
    if (n) {
      n.isArchived = archived;
      n.updatedAt = new Date().toISOString();
    }
  },

  async trashNote(id: string): Promise<void> {
    if (isTauri()) {
      await invoke("trash_note", { id });
      return;
    }
    const n = localMockNotes.find((x) => x.id === id);
    if (n) n.deletedAt = new Date().toISOString();
  },

  async restoreNote(id: string): Promise<void> {
    if (isTauri()) {
      await invoke("restore_note", { id });
      return;
    }
    const n = localMockNotes.find((x) => x.id === id);
    if (n) {
      n.deletedAt = null;
      n.updatedAt = new Date().toISOString();
    }
  },

  async deleteNotePermanently(id: string): Promise<void> {
    if (isTauri()) {
      await invoke("delete_note_permanently", { id });
      return;
    }
    const idx = localMockNotes.findIndex((x) => x.id === id);
    if (idx !== -1) localMockNotes.splice(idx, 1);
  },

  async emptyTrash(): Promise<void> {
    if (isTauri()) {
      await invoke("empty_trash");
      return;
    }
    const nonDeleted = localMockNotes.filter((x) => x.deletedAt === null);
    localMockNotes.length = 0;
    localMockNotes.push(...nonDeleted);
  },

  async duplicateNote(id: string): Promise<Note> {
    if (isTauri()) {
      return await invoke<Note>("duplicate_note", { id });
    }
    const original = localMockNotes.find((x) => x.id === id);
    if (!original) throw new Error("Note not found");
    const copy: Note = {
      ...original,
      id: "mock-" + Date.now(),
      title: original.title ? `${original.title} (Copy)` : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    localMockNotes.unshift(copy);
    return copy;
  },

  async searchNotes(query: string, includeArchived = false): Promise<Note[]> {
    if (isTauri()) {
      return await invoke<Note[]>("search_notes", { query, includeArchived });
    }
    const q = query.toLowerCase();
    return localMockNotes.filter((n) => {
      if (n.deletedAt !== null) return false;
      if (!includeArchived && n.isArchived) return false;
      return (
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q)
      );
    });
  },

  async listTags(): Promise<Tag[]> {
    if (isTauri()) {
      return await invoke<Tag[]>("list_tags");
    }
    return [{ id: "tag-1", name: "Ideas", color: "#34d399", createdAt: new Date().toISOString() }];
  },

  async createTag(name: string, color?: string): Promise<Tag> {
    if (isTauri()) {
      return await invoke<Tag>("create_tag", { name, color });
    }
    return { id: "tag-" + Date.now(), name, color, createdAt: new Date().toISOString() };
  },

  async deleteTag(id: string): Promise<void> {
    if (isTauri()) {
      await invoke("delete_tag", { id });
    }
  },

  async addTagToNote(noteId: string, tagId: string): Promise<void> {
    if (isTauri()) {
      await invoke("add_tag_to_note", { noteId, tagId });
    }
  },

  async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
    if (isTauri()) {
      await invoke("remove_tag_from_note", { noteId, tagId });
    }
  },

  async createRevisionCheckpoint(noteId: string): Promise<void> {
    if (isTauri()) {
      await invoke("create_revision_checkpoint", { noteId });
    }
  },

  async listRevisions(noteId: string): Promise<Revision[]> {
    if (isTauri()) {
      return await invoke<Revision[]>("list_revisions", { noteId });
    }
    return [];
  },

  async restoreRevision(noteId: string, revisionId: string): Promise<Note> {
    if (isTauri()) {
      return await invoke<Note>("restore_revision", { noteId, revisionId });
    }
    return localMockNotes[0];
  },

  async getWindowState(noteId: string): Promise<NoteWindowState | null> {
    if (isTauri()) {
      return await invoke<NoteWindowState | null>("get_window_state", { noteId });
    }
    return null;
  },

  async persistWindowState(windowState: NoteWindowState): Promise<void> {
    if (isTauri()) {
      await invoke("persist_window_state", { windowState });
    }
  },

  async openFloatingStash(noteId: string): Promise<void> {
    if (isTauri()) {
      await invoke("open_floating_stash", { noteId });
    } else {
      window.open(`/?window=stash&noteId=${noteId}`, `stash-${noteId}`, "width=580,height=640");
    }
  },

  async closeFloatingStash(noteId: string): Promise<void> {
    if (isTauri()) {
      await invoke("close_floating_stash", { noteId });
    }
  },

  async setNoteAlwaysOnTop(noteId: string, alwaysOnTop: boolean): Promise<void> {
    if (isTauri()) {
      await invoke("set_note_always_on_top", { noteId, alwaysOnTop });
    }
  },

  async listReferences(): Promise<ReferenceLink[]> {
    if (isTauri()) return await invoke<ReferenceLink[]>("list_references");
    return loadMockReferences();
  },

  async saveReference(link: ReferenceLink): Promise<ReferenceLink> {
    if (isTauri()) return await invoke<ReferenceLink>("save_reference", { link });
    const now = new Date().toISOString();
    const saved = { ...link, id: link.id || crypto.randomUUID(), createdAt: link.createdAt || now, updatedAt: now };
    const list = loadMockReferences().filter((l) => l.id !== saved.id);
    saveMockReferences([saved, ...list]);
    return saved;
  },

  async importReferences(links: ReferenceLink[]): Promise<number> {
    if (isTauri()) return await invoke<number>("import_references", { links });
    const ids = new Set(links.map((l) => l.id));
    saveMockReferences([...links, ...loadMockReferences().filter((l) => !ids.has(l.id))]);
    return links.length;
  },

  async setReferenceFlags(id: string, flags: { starred?: boolean; visited?: boolean }): Promise<void> {
    if (isTauri()) {
      await invoke("set_reference_flags", { id, starred: flags.starred, visited: flags.visited });
      return;
    }
    saveMockReferences(
      loadMockReferences().map((l) =>
        l.id === id
          ? { ...l, isStarred: flags.starred ?? l.isStarred, isVisited: flags.visited ?? l.isVisited }
          : l
      )
    );
  },

  async deleteReference(id: string): Promise<void> {
    if (isTauri()) {
      await invoke("delete_reference", { id });
      return;
    }
    saveMockReferences(loadMockReferences().filter((l) => l.id !== id));
  },

  /** Opens an http(s) URL in the user's default browser. */
  async openExternalUrl(url: string): Promise<void> {
    if (isTauri()) {
      await invoke("open_external_url", { url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  },

  async openPipBrowser(options: {
    url?: string;
    noteId?: string;
    widgetId?: string;
  } = {}): Promise<void> {
    if (isTauri()) {
      await invoke("open_pip_browser_window", {
        url: options.url,
        noteId: options.noteId,
        widgetId: options.widgetId,
      });
    } else {
      const q = new URLSearchParams();
      q.set("window", "pip-browser");
      if (options.url) q.set("url", options.url);
      if (options.noteId) q.set("noteId", options.noteId);
      if (options.widgetId) q.set("widgetId", options.widgetId);
      window.open(`/?${q.toString()}`, "stash-pip-browser", "width=580,height=380");
    }
  },

  async closePipBrowser(): Promise<void> {
    if (isTauri()) {
      await invoke("close_pip_browser_window");
    }
  },

  async dockBrowserWidget(data: {
    noteId: string;
    widgetId: string;
    url: string;
  }): Promise<void> {
    if (isTauri()) {
      await emit("stash://dock-browser-widget", data);
    } else {
      window.dispatchEvent(
        new CustomEvent("stash://dock-browser-widget", { detail: data })
      );
    }
  },

  async emitEvent<T>(event: string, payload: T): Promise<void> {
    if (isTauri()) {
      await emit(event, payload);
    } else {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(event, { detail: payload }));
        try {
          localStorage.setItem(
            "stash:ipc-event",
            JSON.stringify({ event, payload, ts: Date.now() })
          );
        } catch {}
      }
    }
  },

  async getSettings(): Promise<Settings> {
    if (isTauri()) {
      return await invoke<Settings>("get_settings");
    }
    return localMockSettings;
  },

  async updateSettings(settings: Settings): Promise<void> {
    if (isTauri()) {
      await invoke("update_settings", { settings });
    } else {
      localMockSettings = settings;
    }
  },

  async updateGlobalShortcut(shortcutStr: string): Promise<void> {
    if (isTauri()) {
      await invoke("update_global_shortcut", { shortcutStr });
    } else {
      localMockSettings.globalShortcut = shortcutStr;
    }
  },

  async exportData(): Promise<ExportData> {
    if (isTauri()) {
      return await invoke<ExportData>("export_data");
    }
    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      notes: localMockNotes,
      tags: [],
      windowStates: [],
    };
  },

  async importData(data: ExportData): Promise<void> {
    if (isTauri()) {
      await invoke("import_data", { data });
    } else {
      localMockNotes.push(...data.notes);
    }
  },

  async openMicrophoneSettings(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("open_microphone_settings");
      } catch (err) {
        console.error("Failed to open microphone settings via Tauri:", err);
      }
    } else {
      try {
        window.open("ms-settings:privacy-microphone", "_blank");
      } catch {
        // Ignore browser protocol navigation block
      }
    }
  },

  async getSystemPerformance(): Promise<SystemPerformanceSnapshot> {
    if (isTauri()) {
      return await invoke<SystemPerformanceSnapshot>("get_system_performance");
    }

    // Web mock / browser fallback
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
    const deviceMem = typeof navigator !== "undefined" ? (navigator as any).deviceMemory || 16 : 16;
    const totalBytes = deviceMem * 1024 * 1024 * 1024;
    const usedBytes = Math.round(totalBytes * 0.42);

    const perfMem = typeof performance !== "undefined" && (performance as any).memory
      ? (performance as any).memory
      : null;

    const stashMem = perfMem ? perfMem.usedJSHeapSize : 54 * 1024 * 1024;

    return {
      os_name: "Windows 11 Pro",
      os_version: "23H2",
      kernel_version: "10.0.22631",
      hostname: "DESKTOP-STASH",
      uptime_secs: 86400 * 2 + 14320,
      cpu_brand: "AMD Ryzen / Intel Core High-Performance Processor",
      cpu_vendor: "AuthenticAMD",
      physical_core_count: Math.max(1, Math.floor(cores / 2)),
      logical_core_count: cores,
      global_cpu_usage: 14.5 + Math.random() * 8,
      cpu_cores: Array.from({ length: cores }, (_, i) => ({
        id: i,
        name: `Core #${i}`,
        usage: Math.round((8 + Math.random() * 25) * 10) / 10,
        frequency: 3200 + Math.round(Math.random() * 800),
      })),
      total_memory: totalBytes,
      used_memory: usedBytes,
      free_memory: totalBytes - usedBytes,
      available_memory: totalBytes - usedBytes + Math.round(totalBytes * 0.1),
      total_swap: Math.round(totalBytes * 0.5),
      used_swap: Math.round(totalBytes * 0.08),
      free_swap: Math.round(totalBytes * 0.42),
      disks: [
        {
          name: "System Boot (C:)",
          mount_point: "C:\\",
          total_space: 1024 * 1024 * 1024 * 1024,
          available_space: 340 * 1024 * 1024 * 1024,
          is_removable: false,
          is_read_only: false,
          file_system: "NTFS",
          disk_type: "SSD",
        },
        {
          name: "High-Speed Storage (D:)",
          mount_point: "D:\\",
          total_space: 2048 * 1024 * 1024 * 1024,
          available_space: 1250 * 1024 * 1024 * 1024,
          is_removable: false,
          is_read_only: false,
          file_system: "NTFS",
          disk_type: "SSD",
        },
        {
          name: "Workspace & Media (E:)",
          mount_point: "E:\\",
          total_space: 2048 * 1024 * 1024 * 1024,
          available_space: 890 * 1024 * 1024 * 1024,
          is_removable: false,
          is_read_only: false,
          file_system: "NTFS",
          disk_type: "SSD",
        },
      ],
      stash_process: {
        pid: 14208,
        memory_bytes: stashMem,
        virtual_memory_bytes: stashMem * 3,
        cpu_usage: 0.2,
        run_time_secs: 3600,
      },
      db_size_bytes: 420 * 1024,
      active_windows_count: 1,
      processes: [
        {
          pid: 31840,
          name: "orca.exe",
          cpu_usage: 8.4,
          memory_bytes: 680 * 1024 * 1024,
          virtual_memory_bytes: 1800 * 1024 * 1024,
          run_time_secs: 7200,
          is_stash: false,
        },
        {
          pid: 29140,
          name: "agy.exe",
          cpu_usage: 1.2,
          memory_bytes: 110 * 1024 * 1024,
          virtual_memory_bytes: 340 * 1024 * 1024,
          run_time_secs: 12400,
          is_stash: false,
        },
        {
          pid: 22408,
          name: "chrome.exe",
          cpu_usage: 14.8,
          memory_bytes: 1480 * 1024 * 1024,
          virtual_memory_bytes: 3200 * 1024 * 1024,
          run_time_secs: 14200,
          is_stash: false,
        },
        {
          pid: 18920,
          name: "Code.exe",
          cpu_usage: 6.2,
          memory_bytes: 940 * 1024 * 1024,
          virtual_memory_bytes: 2100 * 1024 * 1024,
          run_time_secs: 18400,
          is_stash: false,
        },
        {
          pid: 15304,
          name: "discord.exe",
          cpu_usage: 2.1,
          memory_bytes: 520 * 1024 * 1024,
          virtual_memory_bytes: 1200 * 1024 * 1024,
          run_time_secs: 26000,
          is_stash: false,
        },
        {
          pid: 9284,
          name: "Spotify.exe",
          cpu_usage: 1.1,
          memory_bytes: 310 * 1024 * 1024,
          virtual_memory_bytes: 840 * 1024 * 1024,
          run_time_secs: 9400,
          is_stash: false,
        },
        {
          pid: 14208,
          name: "stash.exe",
          cpu_usage: 0.2,
          memory_bytes: stashMem,
          virtual_memory_bytes: stashMem * 3,
          run_time_secs: 3600,
          is_stash: true,
        },
        {
          pid: 3120,
          name: "dwm.exe",
          cpu_usage: 1.8,
          memory_bytes: 140 * 1024 * 1024,
          virtual_memory_bytes: 500 * 1024 * 1024,
          run_time_secs: 86400,
          is_stash: false,
        },
        {
          pid: 4892,
          name: "explorer.exe",
          cpu_usage: 0.6,
          memory_bytes: 195 * 1024 * 1024,
          virtual_memory_bytes: 620 * 1024 * 1024,
          run_time_secs: 86400,
          is_stash: false,
        },
        {
          pid: 11024,
          name: "steam.exe",
          cpu_usage: 0.3,
          memory_bytes: 240 * 1024 * 1024,
          virtual_memory_bytes: 750 * 1024 * 1024,
          run_time_secs: 34000,
          is_stash: false,
        },
      ],
      total_processes_count: 182,
      top_cpu_consumer: {
        pid: 22408,
        name: "chrome.exe",
        cpu_usage: 14.8,
        memory_bytes: 1480 * 1024 * 1024,
        virtual_memory_bytes: 3200 * 1024 * 1024,
        run_time_secs: 14200,
        is_stash: false,
      },
      top_ram_consumer: {
        pid: 22408,
        name: "chrome.exe",
        cpu_usage: 14.8,
        memory_bytes: 1480 * 1024 * 1024,
        virtual_memory_bytes: 3200 * 1024 * 1024,
        run_time_secs: 14200,
        is_stash: false,
      },
      network: {
        total_rx_bytes: 42 * 1024 * 1024 * 1024,
        total_tx_bytes: 8 * 1024 * 1024 * 1024,
        rx_rate_bytes_per_sec: 1420 * 1024, // 1.4 MB/s
        tx_rate_bytes_per_sec: 180 * 1024,  // 180 KB/s
        active_interfaces: 2,
      },
      thermal: {
        package_temp_celsius: 54.2,
        max_temp_celsius: 58.0,
        sensor_count: 4,
      },
    };
  },

  async killProcess(pid: number): Promise<boolean> {
    if (isTauri()) {
      return await invoke<boolean>("kill_process", { pid });
    }
    return true;
  },

  async optimizeStashSystem(): Promise<OptimizationResult> {
    if (isTauri()) {
      return await invoke<OptimizationResult>("optimize_stash_system");
    }
    return {
      success: true,
      message: "Browser cache synchronized & memory pruned successfully.",
      db_size_before: 480 * 1024,
      db_size_after: 420 * 1024,
      memory_freed_estimate_bytes: 60 * 1024,
    };
  },

  async openPathInExplorer(path: string): Promise<void> {
    if (isTauri()) {
      await invoke("open_path_in_explorer", { path });
    }
  },

  async openStorageSettings(): Promise<void> {
    if (isTauri()) {
      await invoke("open_storage_settings");
    }
  },

  async listenToEvent<T>(
    event: string,
    handler: (payload: T) => void
  ): Promise<UnlistenFn> {
    if (isTauri()) {
      return await listen<T>(event, (e) => handler(e.payload));
    }
    if (typeof window === "undefined") return () => {};

    const customListener = (e: Event) => {
      const custom = e as CustomEvent<T>;
      handler(custom.detail);
    };
    window.addEventListener(event, customListener);

    const storageListener = (e: StorageEvent) => {
      if (e.key === "stash:ipc-event" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.event === event) {
            handler(parsed.payload);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", storageListener);

    return () => {
      window.removeEventListener(event, customListener);
      window.removeEventListener("storage", storageListener);
    };
  },
};
