/**
 * How many checklist tasks a stash holds.
 *
 * The To-dos section, the card progress bar, and the list count all read this.
 * A stash with no `taskItem` nodes reports zeros, which is how the library
 * drops a row the database prefilter only suspected.
 */

export interface TaskSummary {
  total: number;
  done: number;
  /** 0–1. An empty document reports 0. */
  ratio: number;
}

interface WalkNode {
  type?: string;
  text?: string;
  attrs?: { checked?: boolean };
  content?: WalkNode[];
  items?: { text?: string; done?: boolean }[];
}

export interface TaskPreviewItem {
  text: string;
  done: boolean;
}

function textOf(node: WalkNode | null | undefined, nested = false): string {
  if (!node || typeof node !== "object") return "";
  if (nested && (node.type === "taskItem" || node.type === "taskList")) return "";
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.content)) return "";
  return node.content.map((child) => textOf(child, true)).join("");
}

function summarise(node: WalkNode | null | undefined, into: { total: number; done: number }) {
  if (!node || typeof node !== "object") return;

  if (node.type === "todoList" && Array.isArray(node.items)) {
    for (const item of node.items) {
      into.total += 1;
      if (item?.done) into.done += 1;
    }
    return;
  }

  if (node.type === "taskItem") {
    into.total += 1;
    if (node.attrs?.checked) into.done += 1;
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) summarise(child, into);
  }

  if (node.type === "stashDoc" || node.type === "doc") {
    // content already walked; a stashDoc's doc lives on `doc`, not `content`.
  }
}

export function taskSummary(contentJson?: string | null): TaskSummary {
  const counts = { total: 0, done: 0 };
  if (!contentJson) return { ...counts, ratio: 0 };

  let parsed: WalkNode & { doc?: WalkNode };
  try {
    parsed = JSON.parse(contentJson) as WalkNode & { doc?: WalkNode };
  } catch {
    return { ...counts, ratio: 0 };
  }

  summarise(parsed, counts);
  if (parsed.doc) summarise(parsed.doc, counts);

  return {
    total: counts.total,
    done: counts.done,
    ratio: counts.total === 0 ? 0 : counts.done / counts.total,
  };
}

/** The checklist rows a card can draw without opening an editor. */
export function taskPreviewItems(contentJson?: string | null): TaskPreviewItem[] {
  const items: TaskPreviewItem[] = [];
  if (!contentJson) return items;

  const visit = (node: WalkNode | null | undefined) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "todoList" && Array.isArray(node.items)) {
      for (const item of node.items) {
        items.push({
          text: typeof item?.text === "string" ? item.text : "",
          done: item?.done === true,
        });
      }
      return;
    }

    if (node.type === "taskItem") {
      items.push({
        text: textOf(node).replace(/\s+/g, " ").trim(),
        done: node.attrs?.checked === true,
      });
    }

    if (node.type === "stashDoc" || node.type === "doc" || node.type === "taskList") {
      if (Array.isArray(node.content)) {
        for (const child of node.content) visit(child);
      }
      return;
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) visit(child);
    }
  };

  let parsed: WalkNode & { doc?: WalkNode };
  try {
    parsed = JSON.parse(contentJson) as WalkNode & { doc?: WalkNode };
  } catch {
    return items;
  }

  visit(parsed);
  if (parsed.doc && parsed.type === "stashDoc") visit(parsed.doc);
  return items;
}
