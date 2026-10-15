import { NoteColor } from "./color";
import { AppTheme } from "@/lib/themes/theme-definitions";

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  contentJson: string;
  plainText: string;
  color: NoteColor;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sortIndex: number | null;
  version: number;
  tags?: Tag[];
}

export interface NoteWindowState {
  noteId: string;
  x: number | null;
  y: number | null;
  width: number;
  height: number;
  alwaysOnTop: boolean;
  isOpen: boolean;
  monitorId: string | null;
  updatedAt: string;
}

export interface Revision {
  id: string;
  noteId: string;
  title: string;
  contentJson: string;
  plainText: string;
  version: number;
  createdAt: string;
}

export interface Settings {
  theme: AppTheme;
  defaultColor: NoteColor;
  defaultAlwaysOnTop: boolean;
  launchAtStartup: boolean;
  closeToTray: boolean;
  restoreOpenNotes: boolean;
  globalShortcut: string;
  /** The welcome carousel has been dismissed. */
  hasCompletedOnboarding: boolean;
  /** Global application zoom level percentage (e.g. 100 for 100%). */
  zoomLevel?: number;
}

export type SidebarSection =
  | "all"
  | "todos"
  | "pinned"
  | "favorites"
  | "references"
  | "tags"
  | "performance"
  | "archive"
  | "trash";
