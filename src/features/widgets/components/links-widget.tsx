import React, { useMemo, useState } from "react";
import {
  LinkSimple,
  MagnifyingGlass,
  ArrowSquareOut,
  Copy,
  Star,
  CheckCircle,
  Circle,
  ChatCircleDots,
  FilmSlate,
  Plus,
  Trash as Trash2,
  CaretRight,
  PictureInPicture,
  X,
} from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { cn } from "@/lib/utils/cn";
import { WidgetInsertButton } from "./widget-insert-button";
import {
  LinkCollectionConfig,
  LinkFilter,
  LinkItem,
  UNCATEGORIZED,
  countBy,
  filterItems,
  githubOwner,
  groupByCategory,
  hostOf,
  normalizeUrl,
  prettyUrl,
  toMarkdown,
} from "../link-collection";

interface LinksWidgetProps {
  config?: Partial<LinkCollectionConfig>;
  onConfigChange: (config: LinkCollectionConfig) => void;
  onInsertToNote?: (text: string) => void;
  className?: string;
}

const FILTERS: Array<{ id: LinkFilter; label: string; icon?: React.ReactNode }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Links", icon: <LinkSimple className="h-3 w-3" /> },
  { id: "ask", label: "Ask creator", icon: <ChatCircleDots className="h-3 w-3" /> },
  { id: "video", label: "In video", icon: <FilmSlate className="h-3 w-3" /> },
  { id: "starred", label: "Starred", icon: <Star className="h-3 w-3" /> },
  { id: "unvisited", label: "Not opened" },
];

/** Stable pastel hue per string, used for monogram avatars. */
function hueOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

const LinkAvatar: React.FC<{ item: LinkItem }> = ({ item }) => {
  const [failed, setFailed] = useState(false);
  const host = hostOf(item.url);
  const owner = githubOwner(item.url);
  const src = owner
    ? `https://github.com/${owner}.png?size=64`
    : host
    ? `https://${host}/favicon.ico`
    : null;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("h-8 w-8 shrink-0 bg-muted object-cover", owner ? "rounded-full" : "rounded-lg p-1.5")}
      />
    );
  }
  const letter = (item.title || host || "?").replace(/^@/, "").charAt(0).toUpperCase();
  const hue = hueOf(host || item.title);
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
      style={{ background: `hsl(${hue} 70% 50% / 0.15)`, color: `hsl(${hue} 60% 45%)` }}
    >
      {item.status === "video" ? <FilmSlate className="h-4 w-4" /> : item.status === "ask" ? <ChatCircleDots className="h-4 w-4" /> : letter}
    </div>
  );
};

export const LinksWidget: React.FC<LinksWidgetProps> = ({ config, onConfigChange, onInsertToNote, className }) => {
  const items = config?.items ?? [];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LinkFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ url: "", title: "", category: "" });

  const save = (next: LinkItem[]) => onConfigChange({ ...(config as LinkCollectionConfig), items: next });
  const patch = (id: string, p: Partial<LinkItem>) => save(items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const remove = (id: string) => {
    const before = items;
    save(items.filter((it) => it.id !== id));
    toast.undoable("Link removed", () => save(before));
  };

  const statusCounts = useMemo(() => countBy(items, (i) => i.status), [items]);
  // Same order as the grouped list below, so chips read top-to-bottom.
  const categories = useMemo(
    () => groupByCategory(filterItems(items, { filter, query })).map((g) => [g.category, g.items.length] as const),
    [items, filter, query]
  );
  const visible = useMemo(() => filterItems(items, { query, filter, category }), [items, query, filter, category]);
  const groups = useMemo(() => groupByCategory(visible), [visible]);
  const visitedCount = items.filter((i) => i.visited).length;
  const allCategories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items]);

  const filterCount = (f: LinkFilter) =>
    f === "all"
      ? items.length
      : f === "starred"
      ? items.filter((i) => i.starred).length
      : f === "unvisited"
      ? items.length - visitedCount
      : statusCounts[f] ?? 0;

  const openUrl = (item: LinkItem, url = item.url ?? item.source?.url) => {
    if (!url) return;
    void stashIpc.openExternalUrl(url);
    if (item.url && url === item.url && !item.visited) patch(item.id, { visited: true });
  };

  const copy = async (text: string, label = "Link copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Clipboard copy failed");
    }
  };

  const addLink = () => {
    const url = normalizeUrl(draft.url);
    if (!url) {
      toast.error("That doesn't look like a link");
      return;
    }
    const item: LinkItem = {
      id: crypto.randomUUID(),
      url,
      title: draft.title.trim() || prettyUrl(url),
      category: draft.category.trim() || UNCATEGORIZED,
      status: "ready",
      addedAt: new Date().toISOString(),
    };
    save([item, ...items]);
    setDraft({ url: "", title: "", category: draft.category });
    setAdding(false);
  };

  return (
    <div className={cn("flex flex-col text-xs", className)}>
      {/* Toolbar: search + add */}
      <div className="flex items-center gap-1.5 border-b border-border/40 p-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
              if (e.key === "Enter" && visible[0]) openUrl(visible[0]);
            }}
            placeholder={`Search ${items.length} links, creators, categories…`}
            className="h-7 w-full rounded-md border border-border bg-background/60 pl-7 pr-6 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className={cn(
            "flex h-7 items-center gap-1 rounded-md px-2 font-medium transition-colors",
            adding ? "bg-muted text-foreground" : "bg-foreground text-background hover:opacity-90"
          )}
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
          Add
        </button>
      </div>

      {adding && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 bg-muted/20 p-2">
          <input
            autoFocus
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="Paste a link…"
            className="h-7 min-w-[160px] flex-[2] rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="Name (optional)"
            className="h-7 min-w-[110px] flex-1 rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <input
            list="stash-link-categories"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="Category"
            className="h-7 min-w-[100px] flex-1 rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <datalist id="stash-link-categories">
            {allCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={addLink}
            disabled={!draft.url.trim()}
            className="h-7 rounded-md bg-foreground px-2.5 font-medium text-background disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-2 py-1.5 [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const n = filterCount(f.id);
          if (n === 0 && f.id !== "all") return null;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.icon}
              {f.label}
              <span className={cn("tabular-nums", active ? "opacity-70" : "opacity-60")}>{n}</span>
            </button>
          );
        })}
        <span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-muted-foreground" title="Links you've opened">
          {visitedCount}/{items.length} opened
        </span>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-border/40 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
              category === null ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All categories
          </button>
          {categories.map(([cat, n]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(category === cat ? null : cat)}
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
                category === cat ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grouped list */}
      <div className="max-h-[560px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
            <LinkSimple className="h-6 w-6" />
            <p>No links yet. Paste one with “Add”.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            Nothing matches.{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setCategory(null);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsed[group.category] && !query;
            return (
              <section key={group.category}>
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [group.category]: !c[group.category] }))}
                  className="sticky top-0 z-10 flex w-full items-center gap-1.5 border-b border-border/40 bg-card/95 px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur hover:text-foreground"
                >
                  <CaretRight className={cn("h-3 w-3 transition-transform", !isCollapsed && "rotate-90")} />
                  {group.category}
                  <span className="font-normal tabular-nums opacity-70">{group.items.length}</span>
                </button>
                {!isCollapsed && (
                  <ul className="divide-y divide-border/30">
                    {group.items.map((item) => (
                      <LinkRow
                        key={item.id}
                        item={item}
                        onOpen={openUrl}
                        onCopy={copy}
                        onPatch={patch}
                        onRemove={remove}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>

      {onInsertToNote && items.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground">
            Showing {visible.length} of {items.length}
          </span>
          <WidgetInsertButton
            onInsert={() => onInsertToNote(toMarkdown(visible))}
            label="Insert as list"
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};

interface LinkRowProps {
  item: LinkItem;
  onOpen: (item: LinkItem, url?: string) => void;
  onCopy: (text: string, label?: string) => void;
  onPatch: (id: string, p: Partial<LinkItem>) => void;
  onRemove: (id: string) => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ item, onOpen, onCopy, onPatch, onRemove }) => {
  const primaryUrl = item.url ?? item.source?.url;
  return (
    <li
      className={cn(
        "group flex items-start gap-2.5 px-2.5 py-2 transition-colors hover:bg-muted/40",
        item.visited && "opacity-70"
      )}
    >
      <button type="button" onClick={() => onOpen(item)} className="mt-0.5 shrink-0" tabIndex={-1}>
        <LinkAvatar item={item} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpen(item)}
            disabled={!primaryUrl}
            className="truncate text-left text-[12.5px] font-medium text-foreground hover:underline underline-offset-2"
            title={item.url ?? item.title}
          >
            {item.title}
          </button>
          {item.starred && <Star weight="fill" className="h-3 w-3 shrink-0 text-amber-500" />}
          {item.status === "ask" && (
            <button
              type="button"
              onClick={() => {
                if (item.keyword) onCopy(item.keyword, `Copied “${item.keyword}” — paste it as a comment`);
                if (item.source?.url) onOpen(item, item.source.url);
              }}
              className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-px text-[10px] font-medium text-sky-600 hover:bg-sky-500/20 dark:text-sky-400"
              title="Copy the keyword and open the reel so you can comment it"
            >
              {item.keyword ? `Comment “${item.keyword}”` : "Ask creator"}
            </button>
          )}
          {item.status === "video" && (
            <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-px text-[10px] font-medium text-violet-600 dark:text-violet-400">
              In the video
            </span>
          )}
        </div>

        {item.url && <div className="truncate font-mono text-[10.5px] text-muted-foreground">{prettyUrl(item.url)}</div>}
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground/90">{item.description}</p>
        )}
        {item.source && (
          <div className="mt-0.5 text-[10px] text-muted-foreground/80">
            via{" "}
            {item.source.url ? (
              <button
                type="button"
                onClick={() => onOpen(item, item.source!.url)}
                className="font-medium hover:text-foreground hover:underline underline-offset-2"
              >
                {item.source.label}
              </button>
            ) : (
              <span className="font-medium">{item.source.label}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions: always-visible state toggles + hover-revealed utilities */}
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {item.url && (
            <IconButton title="Copy link" onClick={() => onCopy(item.url!)}>
              <Copy className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {item.url && (
            <IconButton title="Preview in floating browser" onClick={() => void stashIpc.openPipBrowser({ url: item.url })}>
              <PictureInPicture className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <IconButton title="Remove" onClick={() => onRemove(item.id)} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
        <IconButton title={item.starred ? "Unstar" : "Star"} onClick={() => onPatch(item.id, { starred: !item.starred })}>
          <Star weight={item.starred ? "fill" : "regular"} className={cn("h-3.5 w-3.5", item.starred && "text-amber-500")} />
        </IconButton>
        <IconButton
          title={item.visited ? "Mark as not opened" : "Mark as opened"}
          onClick={() => onPatch(item.id, { visited: !item.visited })}
        >
          {item.visited ? (
            <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
        </IconButton>
        {primaryUrl && (
          <IconButton title={item.url ? "Open link" : "Open the reel"} onClick={() => onOpen(item)}>
            <ArrowSquareOut className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>
    </li>
  );
};

const IconButton: React.FC<{ title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }> = ({
  title,
  onClick,
  danger,
  children,
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={cn(
      "rounded p-1 text-muted-foreground transition-colors",
      danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground"
    )}
  >
    {children}
  </button>
);
