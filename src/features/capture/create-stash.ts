import { stashIpc } from "@/lib/ipc/stash-ipc";
import { Note } from "@/features/stash/types/note";
import { NoteColor } from "@/features/stash/types/color";
import { NoteWidgetData } from "@/features/widgets/types";
import { emptyDoc, serializeStashContent, stashContentFromPlainText } from "@/features/editor/stash-content";
import {
  setNoteEmoji,
  setNotePaper,
  setNoteFont,
  setNoteFrame,
  setNoteOpacity,
  PaperPattern,
} from "@/features/stash/note-meta";
import {
  readDefaultPaper,
  readDefaultFontPersona,
  readDefaultFrame,
  readDefaultOpacity,
} from "@/stores/ui-store";

export interface CaptureRequest {
  /** Falls back to the user's default colour. */
  color?: NoteColor;
  title?: string;
  plainText?: string;
  tagNames?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  emoji?: string | null;
  paper?: PaperPattern;
  widgets?: NoteWidgetData[];
}

/**
 * The single path for "make me a new stash and put me in it".
 *
 * Everything that captures — the welcome screen, the toolbar button, the
 * command palette, the empty state — goes through here so a new stash always
 * behaves the same way: created, persisted, and opened as a focused floating
 * window.
 */
export async function createAndOpenStash(
  request: CaptureRequest = {}
): Promise<Note> {
  const seedText = request.plainText;

  // Seed text has to reach the editor too. Writing only `plainText` left the
  // library card showing content the note itself could never display.
  const contentJson =
    seedText && seedText.length > 0
      ? stashContentFromPlainText(seedText, request.widgets || [])
      : request.widgets && request.widgets.length > 0
      ? serializeStashContent(emptyDoc(), request.widgets)
      : undefined;

  const note = await stashIpc.createNote({
    color: request.color,
    title: request.title,
    plainText: seedText,
    contentJson,
    tagNames: request.tagNames,
    isPinned: request.isPinned,
    isFavorite: request.isFavorite,
  });

  if (request.emoji !== undefined) {
    setNoteEmoji(note.id, request.emoji);
  }
  if (request.paper !== undefined) {
    setNotePaper(note.id, request.paper);
  } else {
    const defaultPaper = readDefaultPaper();
    if (defaultPaper && defaultPaper !== "plain") {
      setNotePaper(note.id, defaultPaper);
    }
  }

  const defaultFont = readDefaultFontPersona();
  if (defaultFont && defaultFont !== "sans") {
    setNoteFont(note.id, defaultFont);
  }

  const defaultFrame = readDefaultFrame();
  if (defaultFrame && defaultFrame !== "default") {
    setNoteFrame(note.id, defaultFrame);
  }

  const defaultOpacity = readDefaultOpacity();
  if (defaultOpacity && defaultOpacity < 100) {
    setNoteOpacity(note.id, defaultOpacity);
  }

  await stashIpc.openFloatingStash(note.id);
  return note;
}

