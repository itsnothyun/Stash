/**
 * Reproduces the "content shows in the library but not when the note opens"
 * bug and locks the repair in place.
 *
 *   node --experimental-strip-types scripts/stash-content.test.mjs
 *   (or: npx tsx scripts/stash-content.test.mjs)
 */
import assert from "node:assert/strict";
import {
  appendPlainTextToContent,
  docForEditor,
  docToPlainText,
  extractDoc,
  extractWidgets,
  isDocEmpty,
  plainTextToDoc,
  serializeStashContent,
  stashContentFromPlainText,
} from "../src/features/editor/stash-content.ts";
import { taskPreviewItems, taskSummary } from "../src/features/stash/task-summary.ts";

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
};

/* ------------------------------------------------------------------ */
/* The original bug                                                    */
/* ------------------------------------------------------------------ */

test("a note created with plainText only still opens with its text", () => {
  // Exactly what the command palette's "New swap note" produced: plain text
  // set, contentJson left at the backend default.
  const contentJson = '{"type":"doc","content":[]}';
  const plainText = "[swap-widget]\n\nSwap calculator attached to this note.\n";

  const before = extractDoc(contentJson);
  assert.ok(isDocEmpty(before), "precondition: stored doc is empty");

  const doc = docForEditor(contentJson, plainText);
  assert.ok(!isDocEmpty(doc), "editor must not open empty when plainText has content");
  assert.match(docToPlainText(doc), /Swap calculator attached to this note/);
});

test("widget text appended to a note lands in the doc, not just plainText", () => {
  const start = stashContentFromPlainText("Groceries", []);
  const { contentJson, plainText } = appendPlainTextToContent(start, [], "\n= 42");

  const doc = extractDoc(contentJson);
  assert.match(docToPlainText(doc), /42/, "appended text must exist in the doc");
  assert.match(plainText, /42/, "appended text must exist in plainText");
  assert.equal(
    docToPlainText(doc),
    plainText,
    "doc and plainText must agree after an append"
  );
});

/* ------------------------------------------------------------------ */
/* Envelope handling                                                   */
/* ------------------------------------------------------------------ */

test("reads a bare Tiptap doc", () => {
  const json = JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
  });
  assert.equal(docToPlainText(extractDoc(json)), "hello");
});

test("reads the stashDoc envelope and its widgets", () => {
  const json = serializeStashContent(plainTextToDoc("hello"), [{ id: "w1" }]);
  assert.equal(docToPlainText(extractDoc(json)), "hello");
  assert.deepEqual(extractWidgets(json), [{ id: "w1" }]);
});

test("serializing an already-wrapped doc does not double-wrap", () => {
  const once = serializeStashContent(plainTextToDoc("hi"), []);
  const twice = serializeStashContent(JSON.parse(once), []);
  assert.equal(docToPlainText(extractDoc(twice)), "hi");
});

test("a doc round-trips through the envelope unchanged", () => {
  const doc = plainTextToDoc("line one\nline two");
  const back = extractDoc(serializeStashContent(doc, []));
  assert.deepEqual(back, doc);
  assert.equal(docToPlainText(back), "line one\nline two");
});

test("legacy unparseable content is treated as text rather than lost", () => {
  assert.equal(docToPlainText(extractDoc("just some raw text")), "just some raw text");
});

test("a genuinely empty note still opens empty", () => {
  assert.ok(isDocEmpty(docForEditor('{"type":"doc","content":[]}', "")));
  assert.ok(isDocEmpty(docForEditor(null, null)));
});

test("a real doc is never clobbered by a stale plainText", () => {
  const json = serializeStashContent(plainTextToDoc("the real content"), []);
  const doc = docForEditor(json, "stale preview text");
  assert.equal(docToPlainText(doc), "the real content");
});

test("blank lines survive the text round-trip", () => {
  const text = "a\n\nb";
  assert.equal(docToPlainText(plainTextToDoc(text)), text);
});

test("a legacy todoList opens as a task list and keeps checked state", () => {
  const json = JSON.stringify({
    type: "todoList",
    version: 1,
    items: [
      { id: "a", text: "Ship it", done: true },
      { id: "b", text: "Write the note", done: false },
    ],
  });
  const doc = extractDoc(json);
  assert.equal(doc.type, "doc");
  assert.equal(doc.content[0].type, "taskList");
  assert.equal(doc.content[0].content[0].attrs.checked, true);
  assert.equal(docToPlainText(doc), "Ship it\nWrite the note");
  assert.deepEqual(taskSummary(json), { total: 2, done: 1, ratio: 0.5 });
});

test("checklist rows keep their text and checked state for cards", () => {
  const json = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Ship it" }] }],
          },
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Write the note" }] }],
          },
        ],
      },
    ],
  });
  assert.deepEqual(taskPreviewItems(json), [
    { text: "Ship it", done: true },
    { text: "Write the note", done: false },
  ]);
});

test("task counts ignore a stash that only mentions the word", () => {
  const json = serializeStashContent(plainTextToDoc("no tasks here"), []);
  assert.deepEqual(taskSummary(json), { total: 0, done: 0, ratio: 0 });
});

test("a taskList with title attribute preserves title and tasks", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "taskList",
        attrs: { title: "Sprint 42 Goals" },
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Feature A" }] }],
          },
        ],
      },
    ],
  };
  const json = serializeStashContent(doc, []);
  const recovered = extractDoc(json);
  assert.equal(recovered.content[0].attrs.title, "Sprint 42 Goals");
  assert.equal(docToPlainText(recovered), "Feature A");
  assert.deepEqual(taskSummary(json), { total: 1, done: 1, ratio: 1 });
});

console.log(`\n${passed} passed`);
