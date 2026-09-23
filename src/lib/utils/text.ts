/**
 * Derives a display title for a note.
 * If user explicitly set a title, use it.
 * Otherwise, inspect the first non-empty line of plain text.
 * Fallback to "Untitled Stash" if completely blank.
 */
export function deriveNoteTitle(title?: string | null, plainText?: string | null): string {
  if (title && title.trim().length > 0) {
    return title.trim();
  }

  if (plainText && plainText.trim().length > 0) {
    const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Limit to 50 chars for title
      return firstLine.length > 50 ? firstLine.slice(0, 47) + "..." : firstLine;
    }
  }

  return "Untitled Stash";
}

/**
 * Returns a preview text snippet (up to 120 chars) excluding any first line used as the derived title.
 */
export function getNotePreview(title?: string | null, plainText?: string | null): string {
  if (!plainText || plainText.trim().length === 0) return "";

  const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";

  // If there's no explicit title, line 0 is the derived title, so preview starts from line 1
  const startIdx = !title || title.trim().length === 0 ? 1 : 0;
  const remaining = lines.slice(startIdx).join(" ");

  if (remaining.length > 140) {
    return remaining.slice(0, 137) + "...";
  }
  return remaining;
}
