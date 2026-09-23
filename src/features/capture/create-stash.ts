import { stashIpc } from "@/lib/ipc/stash-ipc";
import { Note } from "@/features/stash/types/note";
import { NoteColor } from "@/features/stash/types/color";
import { stashContentFromPlainText } from "@/features/editor/stash-content";

export interface CaptureRequest {
  /** Falls back to the user's default colour. */
  color?: NoteColor;
  title?: string;
  plainText?: string;
  tagNames?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
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
      ? stashContentFromPlainText(seedText)
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

  await stashIpc.openFloatingStash(note.id);
  return note;
}
