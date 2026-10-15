import { describe, it, expect } from "vitest";
import {
  extractMatrixTasks,
  toggleTaskInDoc,
  addTaskToDoc,
  updateTaskTextInDoc,
  deleteTaskInDoc,
  newTaskNoteContent,
} from "./task-matrix";
import { Note } from "./types/note";

describe("Task Matrix & AST Synchronization", () => {
  const mockNotes: Note[] = [
    {
      id: "note-1",
      title: "Sprint Goals",
      color: "Mint",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Complete SQLite tests" }] }],
              },
              {
                type: "taskItem",
                attrs: { checked: true },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Ship desktop bundle" }] }],
              },
            ],
          },
        ],
      }),
      plainText: "- [ ] Complete SQLite tests\n- [x] Ship desktop bundle\n",
      isPinned: true,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      sortIndex: 0,
      version: 1,
      tags: [{ id: "tag-1", name: "dev", color: undefined, createdAt: "" }],
    },
    {
      id: "note-2",
      title: "Personal Scratchpad",
      color: "Rose",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Buy aeropress filters" }] }],
              },
            ],
          },
        ],
      }),
      plainText: "- [ ] Buy aeropress filters\n",
      isPinned: false,
      isFavorite: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      sortIndex: 1,
      version: 1,
      tags: [],
    },
  ];

  it("extracts all tasks across all notes into normalized matrix items", () => {
    const tasks = extractMatrixTasks(mockNotes);
    expect(tasks).toHaveLength(3);

    expect(tasks[0].noteTitle).toBe("Sprint Goals");
    expect(tasks[0].text).toBe("Complete SQLite tests");
    expect(tasks[0].checked).toBe(false);
    expect(tasks[0].isPinned).toBe(true);

    expect(tasks[1].text).toBe("Ship desktop bundle");
    expect(tasks[1].checked).toBe(true);

    expect(tasks[2].noteTitle).toBe("Personal Scratchpad");
    expect(tasks[2].text).toBe("Buy aeropress filters");
    expect(tasks[2].checked).toBe(false);
  });

  it("toggles task checked state in both AST and plainText", () => {
    const note = mockNotes[0];
    const { contentJson, plainText } = toggleTaskInDoc(
      note.contentJson,
      note.plainText,
      0,
      true
    );

    const parsed = JSON.parse(contentJson);
    expect(parsed.content[0].content[0].attrs.checked).toBe(true);
    expect(plainText).toContain("- [x] Complete SQLite tests");
  });

  it("appends new tasks to document task list and plain text", () => {
    const note = mockNotes[1];
    const { contentJson, plainText } = addTaskToDoc(
      note.contentJson,
      note.plainText,
      "Order Ethiopian beans"
    );

    const parsed = JSON.parse(contentJson);
    const taskList = parsed.content[0];
    expect(taskList.content).toHaveLength(2);
    expect(taskList.content[1].content[0].content[0].text).toBe("Order Ethiopian beans");
    expect(plainText).toContain("- [ ] Order Ethiopian beans");
  });
});

describe("task operations stay in sync with extraction", () => {
  const item = (text: string, checked = false, sub?: unknown[]) => ({
    type: "taskItem",
    attrs: { checked },
    content: [
      text ? { type: "paragraph", content: [{ type: "text", text }] } : { type: "paragraph" },
      ...(sub ? [{ type: "taskList", content: sub }] : []),
    ],
  });
  const stashNote = (doc: unknown): Note => ({
    id: "n1",
    title: "Groceries",
    color: "Paper",
    contentJson: JSON.stringify({ type: "stashDoc", doc, widgets: [{ id: "w" }] }),
    plainText: "",
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    sortIndex: 0,
    version: 1,
    tags: [],
  });
  // Empty item at index 1, nested sub-task at index 3.
  const doc = {
    type: "doc",
    content: [
      { type: "taskList", content: [item("Milk"), item(""), item("Bread", false, [item("Sourdough")]), item("Eggs", true)] },
    ],
  };

  it("indexes nested and empty items consistently", () => {
    const tasks = extractMatrixTasks([stashNote(doc)]);
    expect(tasks.map((t) => [t.text, t.indexInNote, t.depth])).toEqual([
      ["Milk", 0, 0],
      ["Bread", 2, 0],
      ["Sourdough", 3, 1],
      ["Eggs", 4, 0],
    ]);
  });

  it("toggles inside the stashDoc envelope and keeps widgets", () => {
    const note = stashNote(doc);
    const eggs = extractMatrixTasks([note]).find((t) => t.text === "Eggs")!;
    const out = toggleTaskInDoc(note.contentJson, note.plainText, eggs.indexInNote, false);
    const parsed = JSON.parse(out.contentJson);
    expect(parsed.type).toBe("stashDoc");
    expect(parsed.widgets).toEqual([{ id: "w" }]);
    const after = extractMatrixTasks([{ ...note, contentJson: out.contentJson }]);
    expect(after.find((t) => t.text === "Eggs")!.checked).toBe(false);
    expect(out.plainText).toContain("- [ ] Eggs");
  });

  it("toggles a nested sub-task without touching its parent", () => {
    const note = stashNote(doc);
    const out = toggleTaskInDoc(note.contentJson, "", 3, true);
    const after = extractMatrixTasks([{ ...note, contentJson: out.contentJson }]);
    expect(after.find((t) => t.text === "Sourdough")!.checked).toBe(true);
    expect(after.find((t) => t.text === "Bread")!.checked).toBe(false);
  });

  it("edits task text and keeps sub-tasks", () => {
    const note = stashNote(doc);
    const out = updateTaskTextInDoc(note.contentJson, "", 2, "  Rye   bread ");
    const after = extractMatrixTasks([{ ...note, contentJson: out.contentJson }]);
    expect(after.map((t) => t.text)).toEqual(["Milk", "Rye bread", "Sourdough", "Eggs"]);
  });

  it("deletes a task and prunes a list left empty", () => {
    const note = stashNote({ type: "doc", content: [{ type: "taskList", content: [item("Only")] }] });
    const out = deleteTaskInDoc(note.contentJson, "", 0);
    expect(JSON.parse(out.contentJson).doc.content).toEqual([]);
    expect(extractMatrixTasks([{ ...note, contentJson: out.contentJson }])).toHaveLength(0);
  });

  it("adds to a note with no checklist yet and to legacy checklists", () => {
    const plain = stashNote({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }] });
    const added = addTaskToDoc(plain.contentJson, "Hi", "Call mom");
    expect(added.plainText).toBe("Hi\n- [ ] Call mom");

    const legacy = JSON.stringify({ type: "todoList", items: [{ text: "Old", done: true }] });
    const upgraded = addTaskToDoc(legacy, "", "New");
    const tasks = extractMatrixTasks([{ ...plain, contentJson: upgraded.contentJson }]);
    expect(tasks.map((t) => [t.text, t.checked])).toEqual([["Old", true], ["New", false]]);
  });

  it("creates content for a brand-new task note", () => {
    const fresh = newTaskNoteContent("First task");
    expect(fresh.plainText).toBe("- [ ] First task");
  });
});
