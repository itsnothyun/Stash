import { Note } from "./types/note";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { toast } from "@/components/ui/toast";

export interface NoteBacklink {
  sourceNoteId: string;
  sourceNoteTitle: string;
  sourceUpdatedAt: string;
  previewSnippet: string;
}

/**
 * Extracts note titles referenced inside `[[Title]]` or `[[Title|Alias]]` syntax.
 */
export function extractNoteWikiLinks(text: string): string[] {
  if (!text) return [];
  const regex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawTitle = match[1].trim();
    if (rawTitle && !links.includes(rawTitle)) {
      links.push(rawTitle);
    }
  }
  return links;
}

/**
 * Finds all notes in the vault that link to or mention targetNote.
 */
export function findBacklinksForNote(targetNote: Note, allNotes: Note[]): NoteBacklink[] {
  if (!targetNote || !allNotes) return [];
  const targetTitleLower = targetNote.title.trim().toLowerCase();
  if (!targetTitleLower) return [];

  const results: NoteBacklink[] = [];

  for (const n of allNotes) {
    if (n.id === targetNote.id) continue;
    const text = n.plainText || "";
    if (!text) continue;

    // Check for [[Target Title]] or [[Target Title|Alias]]
    const links = extractNoteWikiLinks(text);
    const hasWikiLink = links.some((l) => l.toLowerCase() === targetTitleLower);

    if (hasWikiLink) {
      // Find surrounding snippet
      const idx = text.toLowerCase().indexOf(`[[${targetTitleLower}`);
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + targetTitleLower.length + 60);
      const snippet = (start > 0 ? "…" : "") + text.slice(start, end).replace(/\n/g, " ") + (end < text.length ? "…" : "");

      results.push({
        sourceNoteId: n.id,
        sourceNoteTitle: n.title || "Untitled note",
        sourceUpdatedAt: n.updatedAt,
        previewSnippet: snippet,
      });
    }
  }

  return results;
}

/**
 * Resolves a note title to an open note window. If found, opens floating stash.
 */
export async function openNoteByTitle(title: string, allNotes?: Note[]): Promise<boolean> {
  const clean = title.trim().toLowerCase();
  let notes = allNotes;
  if (!notes) {
    notes = await stashIpc.listNotes();
  }
  const match = notes.find((n) => n.title.trim().toLowerCase() === clean);
  if (match) {
    await stashIpc.openFloatingStash(match.id);
    toast.show({
      message: `Opened "${match.title || "Untitled"}"`,
      description: "Note opened in floating stash window",
    });
    return true;
  } else {
    toast.error(
      "Note not found",
      `No stash with title "${title}" exists yet.`
    );
    return false;
  }
}
