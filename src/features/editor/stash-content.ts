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

/**
 * Maps plain text lines into a structured Tiptap doc.
 * Accurately parses markdown headings (#, ##, ###), task lists (- [ ] / - [x]),
 * and bullet lists into native Tiptap nodes instead of raw text strings.
 */
export function plainTextToDoc(plainText?: string | null): TiptapDoc {
  if (!plainText || plainText.length === 0) return emptyDoc();

  const content: TiptapNode[] = [];
  const lines = plainText.split("\n");
  let currentTaskList: TiptapNode | null = null;
  let currentBulletList: TiptapNode | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for task item: - [ ] or - [x]
    if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
      currentBulletList = null;
      const checked = trimmed.startsWith("- [x]");
      const text = trimmed.slice(5).replace(/^\s+/, "");
      const taskItem: TiptapNode = {
        type: "taskItem",
        attrs: { checked },
        content: [
          {
            type: "paragraph",
            ...(text.length > 0 ? { content: [{ type: "text", text }] } : {}),
          },
        ],
      };
      if (!currentTaskList) {
        currentTaskList = {
          type: "taskList",
          content: [taskItem],
        };
        content.push(currentTaskList);
      } else {
        currentTaskList.content?.push(taskItem);
      }
      continue;
    }

    // Check for bullet item: - or *
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      currentTaskList = null;
      const text = trimmed.slice(2);
      const listItem: TiptapNode = {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            ...(text.length > 0 ? { content: [{ type: "text", text }] } : {}),
          },
        ],
      };
      if (!currentBulletList) {
        currentBulletList = {
          type: "bulletList",
          content: [listItem],
        };
        content.push(currentBulletList);
      } else {
        currentBulletList.content?.push(listItem);
      }
      continue;
    }

    // Reset list grouping on non-list line
    currentTaskList = null;
    currentBulletList = null;

    // Check for heading: #, ##, ###
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4);
      content.push({
        type: "heading",
        attrs: { level: 3 },
        ...(text.length > 0 ? { content: [{ type: "text", text }] } : {}),
      });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3);
      content.push({
        type: "heading",
        attrs: { level: 2 },
        ...(text.length > 0 ? { content: [{ type: "text", text }] } : {}),
      });
      continue;
    }
    if (trimmed.startsWith("# ")) {
      const text = trimmed.slice(2);
      content.push({
        type: "heading",
        attrs: { level: 1 },
        ...(text.length > 0 ? { content: [{ type: "text", text }] } : {}),
      });
      continue;
    }

    // Standard paragraph
    content.push({
      type: "paragraph",
      ...(rawLine.length > 0 ? { content: [{ type: "text", text: rawLine }] } : {}),
    });
  }

  return {
    type: "doc",
    content,
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

    if (startsLine) {
      lines.push("");
      if (n.type === "taskItem") {
        const checked = (n.attrs as { checked?: boolean })?.checked === true;
        lines[lines.length - 1] += checked ? "- [x] " : "- [ ] ";
      } else if (n.type === "listItem") {
        lines[lines.length - 1] += "- ";
      } else if (n.type === "heading") {
        const level = (n.attrs as { level?: number })?.level || 1;
        lines[lines.length - 1] += `${"#".repeat(level)} `;
      }
    }
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
 * Widgets used to live in a separate array outside the doc, rendered in a
 * fixed shelf above the text. They're now real nodes inside the doc, so they
 * can sit anywhere in the note and let text wrap around them.
 */
export const WIDGET_NODE_TYPE = "stashWidget";

export type WidgetWrapSide = "left" | "right" | "none";

export interface StashWidgetAttrs {
  widgetId: string;
  widgetType: string;
  title: string;
  config: Record<string, any> | null;
  isCollapsed: boolean;
  width: number | string | null;
  side: WidgetWrapSide;
}

interface LegacyWidgetLike {
  id: string;
  type: string;
  title: string;
  config?: Record<string, any>;
  isCollapsed?: boolean;
  width?: number | string;
}

/** Builds the inline node JSON for one widget. New widgets default to a
 * full-width block (`side: "none"`) — the same look the old shelf card had. */
export function widgetToNodeJSON(widget: LegacyWidgetLike): TiptapNode {
  return {
    type: WIDGET_NODE_TYPE,
    attrs: {
      widgetId: widget.id,
      widgetType: widget.type,
      title: widget.title,
      config: widget.config ?? null,
      isCollapsed: widget.isCollapsed ?? false,
      width: widget.width ?? null,
      side: "none",
    },
  };
}

/**
 * Folds a legacy note's separate widget array into its doc, once, as real
 * nodes prepended at the top — preserving them exactly where they used to
 * render (above the text) while moving them onto the one widget model.
 */
export function migrateLegacyWidgetsIntoDoc(
  doc: TiptapDoc,
  legacyWidgets: LegacyWidgetLike[]
): TiptapDoc {
  if (!legacyWidgets || legacyWidgets.length === 0) return doc;
  return {
    type: "doc",
    content: [...legacyWidgets.map(widgetToNodeJSON), ...doc.content],
  };
}

/** Recursively collects widget nodes from a doc, e.g. to find an existing swap widget. */
export function findWidgetNodes(
  doc: TiptapDoc | null | undefined,
  predicate?: (attrs: StashWidgetAttrs) => boolean
): StashWidgetAttrs[] {
  const results: StashWidgetAttrs[] = [];
  const walk = (nodes: TiptapNode[] | undefined) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === WIDGET_NODE_TYPE && node.attrs) {
        const attrs = node.attrs as StashWidgetAttrs;
        if (!predicate || predicate(attrs)) results.push(attrs);
      }
      if (Array.isArray(node.content)) walk(node.content);
    }
  };
  walk(doc?.content);
  return results;
}

/**
 * The document a note should open with.
 *
 * When `contentJson` has no usable doc but `plainText` does, the text wins —
 * that repairs notes written by a plain-text-only path, on open, without a
 * migration. Returns `null` for a genuinely empty note so the placeholder shows.
 * Legacy shelf widgets are folded into the doc here too, so every caller that
 * opens a note through this function sees the current widget model.
 */
export function docForEditor(
  contentJson?: string | null,
  plainText?: string | null
): TiptapDoc | null {
  let doc = extractDoc(contentJson);
  const legacyWidgets = extractWidgets<LegacyWidgetLike>(contentJson);
  if (doc && legacyWidgets.length > 0) {
    doc = migrateLegacyWidgetsIntoDoc(doc, legacyWidgets);
  }

  if (doc && !isDocEmpty(doc)) return doc;

  if (plainText && plainText.trim().length > 0) {
    return plainTextToDoc(plainText);
  }

  return doc;
}

/**
 * Wrap a doc into the envelope notes are stored in. `widgets` is a legacy
 * parameter — new widgets live as nodes inside `doc` itself, so callers
 * writing fresh content can omit it (it defaults to empty).
 */
export function serializeStashContent(doc: unknown, widgets: unknown[] = []): string {
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
