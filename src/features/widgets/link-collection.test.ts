import { describe, expect, it } from "vitest";
import {
  LinkItem,
  filterItems,
  githubOwner,
  groupByCategory,
  normalizeUrl,
  prettyUrl,
  sortItems,
  toMarkdown,
} from "./link-collection";

const items: LinkItem[] = [
  { id: "1", title: "Repomix", url: "https://github.com/yamadashy/repomix", category: "GitHub repos", status: "ready" },
  { id: "2", title: "Motion", url: "https://motion.dev", category: "Animation", status: "ready", starred: true },
  { id: "3", title: "UI kits", category: "Design", status: "ask", keyword: "UI", source: { label: "@sahni.ai" } },
  { id: "4", title: "Mystery tool", category: "", status: "video", visited: true },
  { id: "5", title: "Anime.js", url: "https://animejs.com", category: "Animation", status: "ready" },
];

describe("link collection helpers", () => {
  it("filters by status, starred, unvisited, category and query", () => {
    expect(filterItems(items, { filter: "ask" }).map((i) => i.id)).toEqual(["3"]);
    expect(filterItems(items, { filter: "starred" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterItems(items, { filter: "unvisited" })).toHaveLength(4);
    expect(filterItems(items, { category: "Animation" })).toHaveLength(2);
    expect(filterItems(items, { query: "sahni ui" }).map((i) => i.id)).toEqual(["3"]);
    expect(filterItems(items, { query: "github repomix" }).map((i) => i.id)).toEqual(["1"]);
  });

  it("sorts starred first then ready before ask/video then by title", () => {
    expect(sortItems(items).map((i) => i.id)).toEqual(["2", "5", "1", "3", "4"]);
  });

  it("groups by category with Uncategorized last", () => {
    const groups = groupByCategory(items);
    expect(groups[0].category).toBe("Animation");
    expect(groups[groups.length - 1].category).toBe("Uncategorized");
  });

  it("puts groups with real links before larger ask-only groups", () => {
    const asks: LinkItem[] = ["a", "b", "c"].map((id) => ({ id, title: id, category: "Ask", status: "ask" }));
    const groups = groupByCategory([...asks, items[0]]);
    expect(groups.map((g) => g.category)).toEqual(["GitHub repos", "Ask"]);
  });

  it("normalizes and prettifies urls", () => {
    expect(normalizeUrl("motion.dev")).toBe("https://motion.dev/");
    expect(normalizeUrl("not a url")).toBeNull();
    expect(prettyUrl("https://www.github.com/a/b/")).toBe("github.com/a/b");
    expect(githubOwner("https://github.com/yamadashy/repomix")).toBe("yamadashy");
    expect(githubOwner("https://motion.dev")).toBeNull();
  });

  it("exports markdown with links and sources", () => {
    const md = toMarkdown(items);
    expect(md).toContain("- [Repomix](https://github.com/yamadashy/repomix)");
    expect(md).toContain("_(via @sahni.ai)_");
  });
});
