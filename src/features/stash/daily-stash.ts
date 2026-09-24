import { Note } from "./types/note";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { setNoteEmoji, setNotePaper } from "./note-meta";

/**
 * Format a Date object to the standard Daily Stash title:
 * e.g. "Wednesday, Sep 23, 2026"
 */
export function formatDailyTitle(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if a title corresponds to today's daily stash
 */
export function isTodayTitle(title?: string | null): boolean {
  if (!title) return false;
  const today = formatDailyTitle();
  return title.trim().toLowerCase() === today.toLowerCase();
}

/**
 * Find today's daily note from an array of notes
 */
export function findTodayNote(notes: Note[]): Note | undefined {
  const today = formatDailyTitle();
  return notes.find(
    (n) => !n.isArchived && !n.deletedAt && n.title.trim().toLowerCase() === today.toLowerCase()
  );
}

/**
 * Find yesterday's daily note or the most recent previous daily note
 */
export function findPreviousDailyNote(notes: Note[]): Note | undefined {
  const todayStr = formatDailyTitle();
  const todayDateOnly = new Date().toDateString();

  // Filter notes that match date format and are older than today
  const dailyNotes = notes.filter((n) => {
    if (n.isArchived || n.deletedAt) return false;
    if (n.title.trim().toLowerCase() === todayStr.toLowerCase()) return false;
    // Check if title parses as a valid date
    const parsed = Date.parse(n.title);
    return !isNaN(parsed) && new Date(parsed).toDateString() !== todayDateOnly;
  });

  // Sort by updatedAt descending to get the most recent one
  dailyNotes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return dailyNotes[0];
}

/**
 * Extract incomplete task items from a note's plain text content
 */
export function extractUnfinishedTasks(plainText?: string | null): string[] {
  if (!plainText) return [];
  const lines = plainText.split("\n");
  const unfinished: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Matches `- [ ] Task`, `* [ ] Task`, or `[ ] Task`
    if (/^([-*]\s*)?\[\s*\]\s+/.test(line)) {
      const taskText = line.replace(/^([-*]\s*)?\[\s*\]\s+/, "").trim();
      if (taskText) {
        unfinished.push(taskText);
      }
    }
  }

  return unfinished;
}

/**
 * Build initial template content for Today's Stash
 */
export function buildTodayStashContent(
  carriedTasks: string[] = []
): { title: string; plainText: string } {
  const title = formatDailyTitle();
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  let plainText = `# ${title} · ${dayName}\n\n`;
  plainText += `### 🎯 Today's Focus\n- [ ] \n\n`;

  if (carriedTasks.length > 0) {
    plainText += `### ↩ Carried Over from Yesterday\n`;
    for (const task of carriedTasks) {
      plainText += `- [ ] ${task}\n`;
    }
    plainText += `\n`;
  }

  plainText += `### 📝 Quick Notes & Logs\n- \n`;

  return { title, plainText };
}

/**
 * Open or create today's daily stash note, with automatic emoji and paper formatting
 */
export async function openOrCreateTodayStash(
  existingNotes: Note[],
  onOpenFloating: (noteId: string) => Promise<void>
): Promise<Note> {
  const existing = findTodayNote(existingNotes);
  if (existing) {
    await onOpenFloating(existing.id);
    return existing;
  }

  // Check for unfinished tasks from previous daily note
  const prevNote = findPreviousDailyNote(existingNotes);
  const prevTasks = prevNote ? extractUnfinishedTasks(prevNote.plainText) : [];

  const { title, plainText } = buildTodayStashContent(prevTasks);

  // Create new note
  const created = await stashIpc.createNote({
    title,
    plainText,
    color: "Sand",
  });

  // Set default calendar emoji and ruled notebook paper
  setNoteEmoji(created.id, "📅");
  setNotePaper(created.id, "lines");

  // Open detached window
  await onOpenFloating(created.id);
  return created;
}
