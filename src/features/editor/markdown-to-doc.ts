/**
 * Converts the small Markdown subset that widgets, Copilot and imports produce into
 * Tiptap JSON blocks, so inserted content becomes real headings, lists and tables
 * instead of literal `| --- |` text.
 */

export interface JSONMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface JSONNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONNode[];
  marks?: JSONMark[];
  text?: string;
}

const INLINE_PATTERN =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*\s][^*]*)\*)/g;

/** Parses inline marks. Images are returned as separate image nodes. */
export function parseInline(text: string, marks: JSONMark[] = []): JSONNode[] {
  const nodes: JSONNode[] = [];
  const pushText = (value: string, extra: JSONMark[] = []) => {
    if (!value) return;
    const all = [...marks, ...extra];
    nodes.push(all.length ? { type: "text", text: value, marks: all } : { type: "text", text: value });
  };

  let last = 0;
  for (const m of text.matchAll(INLINE_PATTERN)) {
    const index = m.index ?? 0;
    pushText(text.slice(last, index));
    last = index + m[0].length;

    if (m[1]) nodes.push({ type: "image", attrs: { src: m[3], alt: m[2] || null } });
    else if (m[4]) nodes.push(...parseInline(m[5], [...marks, { type: "link", attrs: { href: m[6] } }]));
    else if (m[7]) pushText(m[8], [{ type: "code" }]);
    else if (m[9]) nodes.push(...parseInline(m[10], [...marks, { type: "bold" }]));
    else if (m[11]) nodes.push(...parseInline(m[12], [...marks, { type: "italic" }]));
  }
  pushText(text.slice(last));
  return nodes;
}

/** Wraps inline content in a paragraph, lifting image nodes out to block level. */
function textBlocks(text: string): JSONNode[] {
  const blocks: JSONNode[] = [];
  let inline: JSONNode[] = [];
  const flush = () => {
    if (inline.length) blocks.push({ type: "paragraph", content: inline });
    inline = [];
  };
  for (const node of parseInline(text)) {
    if (node.type === "image") {
      flush();
      blocks.push(node);
    } else {
      inline.push(node);
    }
  }
  flush();
  return blocks;
}

const paragraph = (text: string): JSONNode => {
  const content = parseInline(text).filter((n) => n.type !== "image");
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
};

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const TASK_ITEM = /^\s*[-*+]\s+\[([ xX])\]\s+/;

export function markdownToBlocks(markdown: string): JSONNode[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: JSONNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    const fence = trimmed.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i++]);
      i++; // closing fence
      const code = body.join("\n");
      blocks.push({
        type: "codeBlock",
        attrs: { language: fence[1] || null },
        ...(code ? { content: [{ type: "text", text: code }] } : {}),
      });
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const content = parseInline(heading[2]).filter((n) => n.type !== "image");
      blocks.push({
        type: "heading",
        attrs: { level: Math.min(3, heading[1].length) },
        ...(content.length ? { content } : {}),
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) {
      blocks.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // Table: header row followed by a separator row
    if (trimmed.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      const width = header.length;
      const row = (cells: string[], cellType: string): JSONNode => ({
        type: "tableRow",
        content: Array.from({ length: width }, (_, c) => ({
          type: cellType,
          content: [paragraph(cells[c] ?? "")],
        })),
      });
      blocks.push({
        type: "table",
        content: [row(header, "tableHeader"), ...rows.map((r) => row(r, "tableCell"))],
      });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(lines[i++].trim().replace(/^>\s?/, ""));
      }
      const inner = markdownToBlocks(quoted.join("\n"));
      blocks.push({ type: "blockquote", content: inner.length ? inner : [{ type: "paragraph" }] });
      continue;
    }

    // Task list
    if (TASK_ITEM.test(line)) {
      const items: JSONNode[] = [];
      while (i < lines.length && TASK_ITEM.test(lines[i])) {
        const checked = lines[i].match(TASK_ITEM)![1].toLowerCase() === "x";
        items.push({
          type: "taskItem",
          attrs: { checked },
          content: [paragraph(lines[i].replace(TASK_ITEM, ""))],
        });
        i++;
      }
      blocks.push({ type: "taskList", content: items });
      continue;
    }

    // Bullet / ordered list (nested items are flattened into the same list)
    if (LIST_ITEM.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: JSONNode[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i]) && !TASK_ITEM.test(lines[i])) {
        items.push({ type: "listItem", content: [paragraph(lines[i].replace(LIST_ITEM, ""))] });
        i++;
      }
      blocks.push({ type: ordered ? "orderedList" : "bulletList", content: items });
      continue;
    }

    // Paragraph: consecutive plain lines join with hard breaks
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) paraLines.push(lines[i++].trim());
    if (paraLines.length === 0) paraLines.push(lines[i++].trim());
    const para: JSONNode[] = [];
    paraLines.forEach((text, idx) => {
      for (const block of textBlocks(text)) {
        if (block.type === "paragraph" && para.length && para[para.length - 1].type === "paragraph" && idx > 0) {
          const prev = para[para.length - 1];
          prev.content = [...(prev.content ?? []), { type: "hardBreak" }, ...(block.content ?? [])];
        } else {
          para.push(block);
        }
      }
    });
    blocks.push(...para);
  }

  return blocks;
}

function startsBlock(lines: string[], i: number): boolean {
  const t = lines[i].trim();
  return (
    t.startsWith("```") ||
    /^#{1,6}\s/.test(t) ||
    /^([-*_])(\s*\1){2,}$/.test(t) ||
    t.startsWith(">") ||
    LIST_ITEM.test(lines[i]) ||
    (t.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
  );
}
