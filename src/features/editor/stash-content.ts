/**
 * The one place that knows how a stash's `contentJson` maps to a Tiptap doc.
 *
 * A note carries its content twice: `contentJson` is what the editor renders,
 * `plainText` is what search and the library cards read. Those two drifted
 * apart whenever something wrote only `plainText` — the card showed the text
 * while opening the note showed an empty editor. Everything that writes or
 * reads stash content goes through here so the pair can never disagree again.
 */

/** Structurally compatible with Tiptap's own `JSONContent`. */
export interface TiptapNode {
  [key: string]: unknown;
  type: string;
  text?: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: { [key: string]: any; type: string; attrs?: Record<string, any> }[];
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

/** The envelope a note is stored in: the doc plus its pinned widgets. */
export const STASH_DOC_TYPE = "stashDoc";

export function emptyDoc(): TiptapDoc {
  return { type: "doc", content: [] };
}

/** One paragraph per line. Blank lines stay as empty paragraphs. */
export function plainTextToDoc(plainText?: string | null): TiptapDoc {
  if (!plainText || plainText.length === 0) return emptyDoc();

  return {
    type: "doc",
    content: plainText.split("\n").map((line) => ({
      type: "paragraph",
      ...(line.length > 0
        ? { content: [{ type: "text", text: line }] }
        : {}),
    })),
  };
}

/** Flatten a doc back to text, one line per block. Mirrors `editor.getText()`. */
export function docToPlainText(doc: unknown): string {
  const lines: string[] = [];

  const walk = (node: unknown, parentType: string | null) => {
    if (!node || typeof node !== "object") return;
    const n = node as TiptapNode;

    if (n.type === "text" && typeof n.text === "string") {
      if (lines.length === 0) lines.push("");
      lines[lines.length - 1] += n.text;
      return;
    }

    // A task or list item is one line. Its inner paragraph is that line,
    // not a second one.
    const insideItem = parentType === "taskItem" || parentType === "listItem";
    const startsLine =
      n.type === "listItem" ||
      n.type === "taskItem" ||
      n.type === "codeBlock" ||
      (!insideItem && (n.type === "paragraph" || n.type === "heading"));

    if (startsLine) lines.push("");
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child, n.type);
    }
  };

  walk(doc, null);
  return lines.join("\n").replace(/^\n+|\n+$/g, "");
}

/** True when a doc holds no visible text. */
export function isDocEmpty(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return true;
  return docToPlainText(doc).trim().length === 0;
}

/**
 * Pull the Tiptap doc out of whatever wrapper a note happens to use.
 *
 * Accepts the `stashDoc` envelope, a bare Tiptap doc, and legacy raw strings.
 * Returns `null` when the content carries no doc at all.
 */
export function extractDoc(contentJson?: string | null): any | null {
  if (!contentJson || contentJson.trim().length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(contentJson);
  } catch {
    // Legacy notes stored raw text or HTML before the envelope existed.
    return plainTextToDoc(contentJson);
  }

  if (!parsed || typeof parsed !== "object") return null;

  const wrapper = parsed as { doc?: unknown; type?: string; widgets?: unknown };
  const candidate = wrapper.type === STASH_DOC_TYPE ? wrapper.doc : parsed;

  if (!candidate || typeof candidate !== "object") return null;
  const cType = (candidate as { type?: string }).type;
  if (cType === "todoList") return todoListToDoc(candidate);
  if (cType !== "doc") return null;

  return candidate;
}

/**
 * A legacy checklist document, opened as a Tiptap task list.
 *
 * Restored revisions and imports taken before the kind was removed still
 * arrive in this shape. Reading them here means the editor never opens blank.
 */
function todoListToDoc(list: unknown): TiptapDoc {
  const items = (list as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return emptyDoc();

  const content = items.map((item) => {
    const record = item && typeof item === "object" ? (item as { text?: unknown; done?: unknown }) : {};
    const text = typeof record.text === "string" ? record.text : "";
    const checked = record.done === true;
    return {
      type: "taskItem",
      attrs: { checked },
      content: [
        text.length > 0
          ? { type: "paragraph", content: [{ type: "text", text }] }
          : { type: "paragraph" },
      ],
    };
  });

  return {
    type: "doc",
    content: [{ type: "taskList", content }],
  };
}

/** Widgets pinned to a note, read back out of the envelope. */
export function extractWidgets<T>(contentJson?: string | null): T[] {
  if (!contentJson) return [];
  try {
    const parsed = JSON.parse(contentJson) as { widgets?: unknown };
    return Array.isArray(parsed.widgets) ? (parsed.widgets as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * The document a note should open with.
 *
 * When `contentJson` has no usable doc but `plainText` does, the text wins —
 * that repairs notes written by a plain-text-only path, on open, without a
 * migration. Returns `null` for a genuinely empty note so the placeholder shows.
 */
export function docForEditor(
  contentJson?: string | null,
  plainText?: string | null
): TiptapDoc | null {
  const doc = extractDoc(contentJson);
  if (doc && !isDocEmpty(doc)) return doc;

  if (plainText && plainText.trim().length > 0) {
    return plainTextToDoc(plainText);
  }

  return doc;
}

/** Wrap a doc and its widgets into the envelope notes are stored in. */
export function serializeStashContent(doc: unknown, widgets: unknown[]): string {
  const wrapper = doc && typeof doc === "object" ? (doc as { doc?: unknown }) : null;
  return JSON.stringify({
    type: STASH_DOC_TYPE,
    doc: wrapper?.doc ?? doc ?? emptyDoc(),
    widgets,
  });
}

/**
 * Content for a brand-new note seeded with text, so the editor and the
 * library card start out saying the same thing.
 */
export function stashContentFromPlainText(
  plainText?: string | null,
  widgets: unknown[] = []
): string {
  return serializeStashContent(plainTextToDoc(plainText), widgets);
}

/** Append text to a note's doc as new paragraphs, keeping both fields in step. */
export function appendPlainTextToContent(
  contentJson: string | null | undefined,
  widgets: unknown[],
  text: string
): { contentJson: string; plainText: string } {
  const doc = extractDoc(contentJson) ?? emptyDoc();
  const appended = plainTextToDoc(text);

  const merged: TiptapDoc = {
    type: "doc",
    content: [...doc.content, ...appended.content],
  };

  return {
    contentJson: serializeStashContent(merged, widgets),
    plainText: docToPlainText(merged),
  };
}
