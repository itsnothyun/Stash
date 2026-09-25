import { Note } from "@/features/stash/types/note";
import { formatNoteDate } from "@/lib/utils/dates";

/**
 * Format a collection of notes into a clean, human-readable Markdown export.
 */
export function exportAllNotesAsMarkdown(notes: Note[]): string {
  const generatedAt = new Date().toLocaleString();
  const header = [
    `# Stash Library Archive`,
    `> Exported on ${generatedAt} · Total Notes: ${notes.length}`,
    `> Stash Local-First Desktop Memory`,
    `\n---\n`,
  ].join("\n");

  const noteSections = notes.map((note, index) => {
    const title = (note.title && note.title.trim()) || "Untitled Stash";
    const dateCreated = formatNoteDate(note.createdAt);
    const dateUpdated = formatNoteDate(note.updatedAt);
    const color = note.color || "Paper";
    const tags = note.tags && note.tags.length > 0 ? note.tags.map((t) => `#${t.name}`).join(" ") : "None";
    const statusBadges = [];
    if (note.isPinned) statusBadges.push("📌 Pinned");
    if (note.isFavorite) statusBadges.push("⭐ Favorite");
    if (note.isArchived) statusBadges.push("📦 Archived");

    const metaBlock = [
      `## ${index + 1}. ${title}`,
      `**Created:** ${dateCreated} | **Updated:** ${dateUpdated} | **Tone:** ${color} | **Tags:** ${tags}${
        statusBadges.length > 0 ? ` | **Status:** ${statusBadges.join(", ")}` : ""
      }`,
      "",
      (note.plainText && note.plainText.trim()) || "*(Empty note content)*",
      "",
      "---",
    ].join("\n");

    return metaBlock;
  });

  return `${header}\n${noteSections.join("\n\n")}\n`;
}

/**
 * Prompt browser / OS to download a Markdown export file.
 */
export function downloadMarkdownArchive(notes: Note[], customFilename?: string): void {
  const markdown = exportAllNotesAsMarkdown(notes);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = customFilename || `stash-archive-${dateStr}.md`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Copy all notes formatted as Markdown to the clipboard.
 */
export async function copyAllNotesAsMarkdown(notes: Note[]): Promise<boolean> {
  try {
    const markdown = exportAllNotesAsMarkdown(notes);
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (err) {
    console.error("Failed to copy markdown to clipboard:", err);
    return false;
  }
}
