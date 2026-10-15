/**
 * Data model + pure helpers for the Link Collection widget. Kept free of React
 * so filtering/grouping can be unit-tested and reused (e.g. by importers).
 */

/** ready = we have the real link; ask = creator DMs it if you comment; video = only shown inside the video. */
export type LinkStatus = "ready" | "ask" | "video";

export interface LinkSource {
  /** e.g. "@rananjay.ai" */
  label: string;
  url?: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url?: string;
  description?: string;
  category: string;
  status: LinkStatus;
  /** Comment keyword for `ask` items ("UI", "REPO"...). */
  keyword?: string;
  source?: LinkSource;
  starred?: boolean;
  visited?: boolean;
  addedAt?: string;
}

export interface LinkCollectionConfig {
  items: LinkItem[];
}

export type LinkFilter = "all" | LinkStatus | "starred" | "unvisited";

export const UNCATEGORIZED = "Uncategorized";

export function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** "github.com/owner/repo" style label without protocol or trailing slash. */
export function prettyUrl(url?: string): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function githubOwner(url?: string): string | null {
  const m = url?.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)(?:\/|$)/);
  return m ? m[1] : null;
}

export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function matchesQuery(item: LinkItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [item.title, item.url, item.description, item.category, item.source?.label, item.keyword]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => hay.includes(term));
}

export function matchesFilter(item: LinkItem, filter: LinkFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "starred":
      return !!item.starred;
    case "unvisited":
      return !item.visited;
    default:
      return item.status === filter;
  }
}

export function filterItems(
  items: LinkItem[],
  opts: { query?: string; filter?: LinkFilter; category?: string | null }
): LinkItem[] {
  return items.filter(
    (it) =>
      matchesFilter(it, opts.filter ?? "all") &&
      (!opts.category || it.category === opts.category) &&
      matchesQuery(it, opts.query ?? "")
  );
}

const STATUS_RANK: Record<LinkStatus, number> = { ready: 0, ask: 1, video: 2 };

/** Starred first, then ready links before ask/video, then alphabetical. */
export function sortItems(items: LinkItem[]): LinkItem[] {
  return [...items].sort(
    (a, b) =>
      Number(!!b.starred) - Number(!!a.starred) ||
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

/**
 * Groups by category. Groups that contain real links come before groups that
 * only hold "ask"/"video" leads, then biggest first; Uncategorized goes last.
 */
export function groupByCategory(items: LinkItem[]): Array<{ category: string; items: LinkItem[] }> {
  const map = new Map<string, LinkItem[]>();
  for (const it of items) {
    const key = it.category?.trim() || UNCATEGORIZED;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  const bestRank = (list: LinkItem[]) => Math.min(...list.map((i) => STATUS_RANK[i.status]));
  return [...map.entries()]
    .map(([category, list]) => ({ category, items: sortItems(list) }))
    .sort(
      (a, b) =>
        Number(a.category === UNCATEGORIZED) - Number(b.category === UNCATEGORIZED) ||
        bestRank(a.items) - bestRank(b.items) ||
        b.items.length - a.items.length ||
        a.category.localeCompare(b.category)
    );
}

export function countBy<T extends string>(items: LinkItem[], key: (it: LinkItem) => T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = key(it);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function toMarkdown(items: LinkItem[]): string {
  const lines: string[] = [];
  for (const group of groupByCategory(items)) {
    lines.push(`\n### ${group.category}`);
    for (const it of group.items) {
      const target = it.url ? `[${it.title}](${it.url})` : it.title;
      const desc = it.description ? ` — ${it.description}` : "";
      const via = it.source ? ` _(via ${it.source.label})_` : "";
      lines.push(`- ${target}${desc}${via}`);
    }
  }
  return lines.join("\n") + "\n";
}
