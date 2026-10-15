import { describe, it, expect } from "vitest";
import { markdownToBlocks, parseInline } from "./markdown-to-doc";

describe("markdownToBlocks", () => {
  it("turns a pipe table into table nodes with a header row", () => {
    const blocks = markdownToBlocks("| Item | Price |\n| --- | --- |\n| Keyboard | 85 |\n| Total | 325 |");
    expect(blocks).toHaveLength(1);
    const table = blocks[0];
    expect(table.type).toBe("table");
    expect(table.content).toHaveLength(3);
    expect(table.content![0].content![0].type).toBe("tableHeader");
    expect(table.content![1].content![1].type).toBe("tableCell");
    expect(table.content![2].content![1].content![0].content![0].text).toBe("325");
  });

  it("pads short table rows to the header width", () => {
    const [table] = markdownToBlocks("| A | B | C |\n|---|---|---|\n| 1 |");
    expect(table.content![1].content).toHaveLength(3);
  });

  it("parses fenced code with its language", () => {
    const [code] = markdownToBlocks("```javascript\nconst a = 1;\nconsole.log(a);\n```");
    expect(code).toEqual({
      type: "codeBlock",
      attrs: { language: "javascript" },
      content: [{ type: "text", text: "const a = 1;\nconsole.log(a);" }],
    });
  });

  it("parses headings, bullet lists and task lists", () => {
    const blocks = markdownToBlocks("### 🧾 Expense Log\n- **Coffee**: `$4.50`\n- Lunch\n\n- [x] Done\n- [ ] Todo");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "bulletList", "taskList"]);
    expect(blocks[0].attrs).toEqual({ level: 3 });
    expect(blocks[1].content).toHaveLength(2);
    expect(blocks[2].content!.map((t) => t.attrs!.checked)).toEqual([true, false]);
  });

  it("parses blockquotes and horizontal rules", () => {
    const blocks = markdownToBlocks("> *Recorded today*\n\n---\nAfter");
    expect(blocks.map((b) => b.type)).toEqual(["blockquote", "horizontalRule", "paragraph"]);
    expect(blocks[0].content![0].content![0].marks).toEqual([{ type: "italic" }]);
  });

  it("lifts images to block level", () => {
    const blocks = markdownToBlocks("![Sketch](data:image/png;base64,AAAA)");
    expect(blocks).toEqual([{ type: "image", attrs: { src: "data:image/png;base64,AAAA", alt: "Sketch" } }]);
  });

  it("joins consecutive plain lines with hard breaks", () => {
    const [para] = markdownToBlocks("line one\nline two");
    expect(para.type).toBe("paragraph");
    expect(para.content!.map((n) => n.type)).toEqual(["text", "hardBreak", "text"]);
  });

  it("ignores blank input", () => {
    expect(markdownToBlocks("\n\n  \n")).toEqual([]);
  });
});

describe("parseInline", () => {
  it("applies bold, code and links", () => {
    expect(parseInline("**Total:** `$30` see [docs](https://x.dev)")).toEqual([
      { type: "text", text: "Total:", marks: [{ type: "bold" }] },
      { type: "text", text: " " },
      { type: "text", text: "$30", marks: [{ type: "code" }] },
      { type: "text", text: " see " },
      { type: "text", text: "docs", marks: [{ type: "link", attrs: { href: "https://x.dev" } }] },
    ]);
  });

  it("leaves snake_case identifiers alone", () => {
    expect(parseInline("my_var_name")).toEqual([{ type: "text", text: "my_var_name" }]);
  });
});
