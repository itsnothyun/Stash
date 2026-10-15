import { ReferenceLink, ReferenceStatus } from "./types";

export type ReferenceFilter = "all" | ReferenceStatus | "starred";

const STATUS_RANK: Record<ReferenceStatus, number> = { ready: 0, ask: 1, video: 2 };

export function matchesReference(link: ReferenceLink, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [link.title, link.url, link.description, link.category, link.sourceLabel, link.keyword, link.collection]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => hay.includes(term));
}

export function filterReferences(
  links: ReferenceLink[],
  opts: { query?: string; filter?: ReferenceFilter; category?: string | null }
): ReferenceLink[] {
  const filter = opts.filter ?? "all";
  return links.filter(
    (l) =>
      (filter === "all" || (filter === "starred" ? l.isStarred : l.status === filter)) &&
      (!opts.category || l.category === opts.category) &&
      matchesReference(l, opts.query ?? "")
  );
}

/** Starred first, then real links before ask/video leads, then A–Z. */
export function sortReferences(links: ReferenceLink[]): ReferenceLink[] {
  return [...links].sort(
    (a, b) =>
      Number(b.isStarred) - Number(a.isStarred) ||
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

/** Categories holding real links come first (biggest first); lead-only groups last. */
export function groupReferences(links: ReferenceLink[]): Array<{ category: string; links: ReferenceLink[] }> {
  const map = new Map<string, ReferenceLink[]>();
  for (const l of links) {
    const key = l.category?.trim() || "Uncategorized";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  const best = (list: ReferenceLink[]) => Math.min(...list.map((l) => STATUS_RANK[l.status]));
  return [...map.entries()]
    .map(([category, list]) => ({ category, links: sortReferences(list) }))
    .sort(
      (a, b) =>
        best(a.links) - best(b.links) || b.links.length - a.links.length || a.category.localeCompare(b.category)
    );
}

/** Best thumbnail we can derive without fetching: stored one, else GitHub's social card. */
export function thumbnailFor(link: ReferenceLink): string | null {
  if (link.thumbnail) return link.thumbnail;
  const m = link.url?.match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : null;
}
