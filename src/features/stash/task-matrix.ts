import { Note } from "./types/note";
import { getNoteDueDate } from "./note-meta";
import { STASH_DOC_TYPE, docToPlainText, extractDoc, emptyDoc } from "@/features/editor/stash-content";

export interface MatrixTask {
  /** Stable for the current content: `${noteId}:${indexInNote}`. */
  id: string;
  noteId: string;
  noteTitle: string;
  noteColor: string;
  text: string;
  checked: boolean;
  /** Pre-order position among *all* task items in the note (empty and nested ones included). */
  indexInNote: number;
  /** Nesting depth: 0 for a top-level task, 1 for a sub-task, … */
  depth: number;
  dueDate: string | null;
  tags: string[];
  isPinned: boolean;
  updatedAt: string;
}

interface DocNode {
  type?: string;
  text?: string;
  attrs?: { checked?: boolean; [key: string]: any };
  content?: DocNode[];
}

/** Text of a task item itself — not of the sub-tasks nested under it. */
function ownText(node: DocNode): string {
  const parts: string[] = [];
  const walk = (n: DocNode, top: boolean) => {
    if (!top && (n.type === "taskList" || n.type === "taskItem")) return;
    if (typeof n.text === "string") parts.push(n.text);
    n.content?.forEach((c) => walk(c, false));
  };
  walk(node, true);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/**
 * Visits every task item in document order (pre-order, so a parent comes before
 * its sub-tasks). Every reader and writer in this module uses this one walk, so
 * an index always points at the same task no matter which function computed it.
 */
function forEachTask(
  doc: DocNode,
  visit: (node: DocNode, parent: DocNode, indexInParent: number, taskIndex: number, depth: number) => boolean | void
): void {
  let taskIndex = 0;
  let stop = false;
  const walk = (node: DocNode, depth: number) => {
    if (!Array.isArray(node.content)) return;
    for (let i = 0; i < node.content.length && !stop; i++) {
      const child = node.content[i];
      if (!child || typeof child !== "object") continue;
      if (child.type === "taskItem") {
        if (visit(child, node, i, taskIndex++, depth) === true) {
          stop = true;
          return;
        }
        walk(child, depth + 1);
      } else {
        walk(child, depth);
      }
    }
  };
  walk(doc, 0);
}

/** Collects every task across notes (archived and trashed notes are skipped). */
export function extractMatrixTasks(notes: Note[]): MatrixTask[] {
  const result: MatrixTask[] = [];
  for (const note of notes) {
    if (note.isArchived || note.deletedAt) continue;
    const doc = extractDoc(note.contentJson);
    if (!doc) continue;
    const dueDate = getNoteDueDate(note.id);
    const tags = note.tags?.map((t) => t.name) ?? [];
    const noteTitle = note.title?.trim() || "Untitled Stash";
    forEachTask(doc, (node, _parent, _i, index, depth) => {
      const text = ownText(node);
      if (!text) return;
      result.push({
        id: `${note.id}:${index}`,
        noteId: note.id,
        noteTitle,
        noteColor: note.color || "Paper",
        text,
        checked: node.attrs?.checked === true,
        indexInNote: index,
        depth,
        dueDate,
        tags,
        isPinned: note.isPinned,
        updatedAt: note.updatedAt,
      });
    });
  }
  return result;
}

/**
 * Applies `mutate` to a copy of the note's doc and writes it back in the same
 * envelope it came in (stashDoc keeps its widgets), with plainText re-derived
 * from the doc so search and previews stay in step. Unchanged input is returned
 * as-is when `mutate` reports no change.
 */
function mutateNoteDoc(
  contentJson: string,
  plainText: string,
  mutate: (doc: DocNode) => boolean
): { contentJson: string; plainText: string; changed: boolean } {
  let envelope: any = null;
  try {
    envelope = JSON.parse(contentJson);
  } catch {
    envelope = null;
  }
  const source = extractDoc(contentJson);
  const doc: DocNode = source ? structuredClone(source) : emptyDoc();
  if (!mutate(doc)) return { contentJson, plainText, changed: false };

  let nextContent: string;
  if (envelope && typeof envelope === "object" && envelope.type === STASH_DOC_TYPE) {
    nextContent = JSON.stringify({ ...envelope, doc });
  } else if (envelope && typeof envelope === "object" && envelope.type === "doc") {
    nextContent = JSON.stringify(doc);
  } else {
    // Legacy checklist / raw text / empty: upgrade to the current envelope.
    nextContent = JSON.stringify({ type: STASH_DOC_TYPE, doc, widgets: [] });
  }
  return { contentJson: nextContent, plainText: docToPlainText(doc), changed: true };
}

function taskParagraph(text: string): DocNode {
  return text ? { type: "paragraph", content: [{ type: "text", text }] } : { type: "paragraph" };
}

/** Sets the checked state of the task at `targetTaskIndex`. */
export function toggleTaskInDoc(
  contentJson: string,
  plainText: string,
  targetTaskIndex: number,
  newChecked: boolean
): { contentJson: string; plainText: string } {
  const { contentJson: c, plainText: p } = mutateNoteDoc(contentJson, plainText, (doc) => {
    let hit = false;
    forEachTask(doc, (node, _parent, _i, index) => {
      if (index !== targetTaskIndex) return;
      node.attrs = { ...node.attrs, checked: newChecked };
      hit = true;
      return true;
    });
    return hit;
  });
  return { contentJson: c, plainText: p };
}

/** Replaces a task's own text, keeping any sub-tasks nested under it. */
export function updateTaskTextInDoc(
  contentJson: string,
  plainText: string,
  targetTaskIndex: number,
  text: string
): { contentJson: string; plainText: string } {
  const clean = text.replace(/\s+/g, " ").trim();
  const { contentJson: c, plainText: p } = mutateNoteDoc(contentJson, plainText, (doc) => {
    let hit = false;
    forEachTask(doc, (node, _parent, _i, index) => {
      if (index !== targetTaskIndex) return;
      const rest = (node.content ?? []).filter((n) => n.type === "taskList");
      node.content = [taskParagraph(clean), ...rest];
      hit = true;
      return true;
    });
    return hit;
  });
  return { contentJson: c, plainText: p };
}

/** Removes a task (and its sub-tasks); drops the list too if it ends up empty. */
export function deleteTaskInDoc(
  contentJson: string,
  plainText: string,
  targetTaskIndex: number
): { contentJson: string; plainText: string } {
  const { contentJson: c, plainText: p } = mutateNoteDoc(contentJson, plainText, (doc) => {
    let hit = false;
    let emptiedList: DocNode | null = null;
    forEachTask(doc, (_node, parent, i, index) => {
      if (index !== targetTaskIndex) return;
      parent.content!.splice(i, 1);
      if (parent.content!.length === 0) emptiedList = parent;
      hit = true;
      return true;
    });
    if (emptiedList) {
      const prune = (node: DocNode) => {
        if (!Array.isArray(node.content)) return;
        node.content = node.content.filter((child) => child !== emptiedList);
        node.content.forEach(prune);
      };
      prune(doc);
    }
    return hit;
  });
  return { contentJson: c, plainText: p };
}

/** Appends a task to the note's last top-level checklist, or starts one at the end. */
export function addTaskToDoc(
  contentJson: string,
  plainText: string,
  taskText: string
): { contentJson: string; plainText: string } {
  const clean = taskText.replace(/\s+/g, " ").trim();
  if (!clean) return { contentJson, plainText };
  const item: DocNode = { type: "taskItem", attrs: { checked: false }, content: [taskParagraph(clean)] };
  const { contentJson: c, plainText: p } = mutateNoteDoc(contentJson, plainText, (doc) => {
    doc.content = Array.isArray(doc.content) ? doc.content : [];
    let lastList = -1;
    doc.content.forEach((n, i) => {
      if (n?.type === "taskList") lastList = i;
    });
    if (lastList >= 0) {
      const list = doc.content[lastList];
      list.content = [...(list.content ?? []), item];
    } else {
      // A blank trailing paragraph is just the cursor's resting place — replace it.
      const last = doc.content[doc.content.length - 1];
      if (last?.type === "paragraph" && !last.content?.length) doc.content.pop();
      doc.content.push({ type: "taskList", content: [item] });
    }
    return true;
  });
  return { contentJson: c, plainText: p };
}

/** Content for a brand-new note that holds just this checklist. */
export function newTaskNoteContent(taskText: string): { contentJson: string; plainText: string } {
  return addTaskToDoc(JSON.stringify({ type: STASH_DOC_TYPE, doc: emptyDoc(), widgets: [] }), "", taskText);
}
