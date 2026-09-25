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
