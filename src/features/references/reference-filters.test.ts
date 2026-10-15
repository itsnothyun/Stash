import { describe, expect, it } from "vitest";
import { filterReferences, groupReferences, sortReferences, thumbnailFor } from "./reference-filters";
import { ReferenceLink } from "./types";

const base = { description: "", isStarred: false, isVisited: false, createdAt: "", updatedAt: "" };
const links: ReferenceLink[] = [
  { ...base, id: "1", title: "Repomix", url: "https://github.com/yamadashy/repomix", category: "Dev", status: "ready", sourceLabel: "@bitbyybit" },
  { ...base, id: "2", title: "Motion", url: "https://motion.dev", category: "Animation", status: "ready", isStarred: true },
  { ...base, id: "3", title: "UI kits", category: "Ask the creator", status: "ask", keyword: "UI" },
  { ...base, id: "4", title: "Anime.js", url: "https://animejs.com", category: "Animation", status: "ready" },
  { ...base, id: "5", title: "Mystery", category: "Only in video", status: "video" },
  { ...base, id: "6", title: "Kit two", category: "Ask the creator", status: "ask" },
];

describe("reference filters", () => {
  it("filters by status, starred, category and query", () => {
    expect(filterReferences(links, { filter: "ask" }).map((l) => l.id)).toEqual(["3", "6"]);
    expect(filterReferences(links, { filter: "starred" }).map((l) => l.id)).toEqual(["2"]);
    expect(filterReferences(links, { category: "Animation" })).toHaveLength(2);
    expect(filterReferences(links, { query: "bitbyybit repo" }).map((l) => l.id)).toEqual(["1"]);
  });

  it("sorts starred, then ready, then by title", () => {
    expect(sortReferences(links).map((l) => l.id)).toEqual(["2", "4", "1", "6", "3", "5"]);
  });

  it("groups real-link categories before larger lead-only groups", () => {
    expect(groupReferences(links).map((g) => g.category)).toEqual(["Animation", "Dev", "Ask the creator", "Only in video"]);
  });

  it("derives GitHub social cards when no thumbnail is stored", () => {
    expect(thumbnailFor(links[0])).toBe("https://opengraph.githubassets.com/1/yamadashy/repomix");
    expect(thumbnailFor(links[1])).toBeNull();
    expect(thumbnailFor({ ...links[1], thumbnail: "data:image/jpeg;base64,x" })).toBe("data:image/jpeg;base64,x");
  });
});
