import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlass,
  Plus,
  Star,
  ArrowSquareOut,
  Copy,
  Trash as Trash2,
  PictureInPicture,
  ChatCircleDots,
  FilmSlate,
  LinkSimple,
  CheckCircle,
  CaretDown,
  X,
  BookmarksSimple,
} from "@phosphor-icons/react";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import {
  SimpleDropdown,
  SimpleDropdownItem,
  SimpleDropdownSeparator,
} from "@/components/ui/simple-dropdown";
import { hostOf, prettyUrl } from "@/features/widgets/link-collection";
import { AddReferenceDialog } from "./add-reference-dialog";
import { ReferenceLink } from "../types";
import { ReferenceFilter, filterReferences, groupReferences, thumbnailFor } from "../reference-filters";

const FILTERS: Array<{ id: ReferenceFilter; label: string; icon?: React.ReactNode }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Links", icon: <LinkSimple className="h-3.5 w-3.5" /> },
  { id: "ask", label: "Ask creator", icon: <ChatCircleDots className="h-3.5 w-3.5" /> },
  { id: "video", label: "In video", icon: <FilmSlate className="h-3.5 w-3.5" /> },
  { id: "starred", label: "Starred", icon: <Star className="h-3.5 w-3.5" /> },
];

function hueOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/** Thumbnail with a graceful generated cover when there's no image (or it fails). */
const Thumbnail: React.FC<{ link: ReferenceLink }> = ({ link }) => {
  const src = thumbnailFor(link);
  const [failed, setFailed] = useState(false);
  const host = hostOf(link.url ?? undefined);
  const hue = hueOf(host || link.title);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55% / 0.22), hsl(${(hue + 40) % 360} 70% 55% / 0.08))`,
      }}
    >
      {host ? (
        <img
          src={`https://${host}/favicon.ico`}
          alt=""
          className="h-8 w-8 rounded-lg bg-background/70 p-1 shadow-xs"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      ) : link.status === "ask" ? (
        <ChatCircleDots className="h-8 w-8 opacity-60" style={{ color: `hsl(${hue} 60% 40%)` }} />
      ) : (
        <FilmSlate className="h-8 w-8 opacity-60" style={{ color: `hsl(${hue} 60% 40%)` }} />
      )}
      <span className="max-w-[85%] truncate font-mono text-[11px]" style={{ color: `hsl(${hue} 45% 35%)` }}>
        {host || link.sourceLabel}
      </span>
    </div>
  );
};

interface CardProps {
  link: ReferenceLink;
  onOpen: (link: ReferenceLink, url?: string | null) => void;
  onToggleStar: (link: ReferenceLink) => void;
  onCopy: (text: string, label?: string) => void;
  onDelete: (link: ReferenceLink) => void;
}

const ReferenceCard: React.FC<CardProps> = ({ link, onOpen, onToggleStar, onCopy, onDelete }) => {
  const target = link.url ?? link.sourceUrl;
  const host = hostOf(link.url ?? undefined);
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-md",
        link.isVisited && "opacity-80"
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(link)}
        disabled={!target}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-muted text-left"
        aria-label={`Open ${link.title}`}
      >
        <Thumbnail link={link} />
        {link.status !== "ready" && (
          <span
            className={cn(
              "absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur",
              link.status === "ask" ? "bg-sky-500/90 text-white" : "bg-violet-500/90 text-white"
            )}
          >
            {link.status === "ask" ? <ChatCircleDots className="h-3 w-3" /> : <FilmSlate className="h-3 w-3" />}
            {link.status === "ask" ? (link.keyword ? `Comment “${link.keyword}”` : "Ask creator") : "In the video"}
          </span>
        )}
        {link.isVisited && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-xs backdrop-blur">
            <CheckCircle weight="fill" className="h-3 w-3 text-emerald-500" /> Opened
          </span>
        )}
      </button>

      {/* Star stays visible when on; hover reveals the rest */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {link.url && (
            <OverlayButton title="Copy link" onClick={() => onCopy(link.url!)}>
              <Copy className="h-3.5 w-3.5" />
            </OverlayButton>
          )}
          {link.url && (
            <OverlayButton title="Preview in floating browser" onClick={() => void stashIpc.openPipBrowser({ url: link.url! })}>
              <PictureInPicture className="h-3.5 w-3.5" />
            </OverlayButton>
          )}
          <OverlayButton title="Remove from library" onClick={() => onDelete(link)} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </OverlayButton>
        </div>
        <OverlayButton
          title={link.isStarred ? "Unstar" : "Star"}
          onClick={() => onToggleStar(link)}
          className={cn(!link.isStarred && "opacity-0 group-hover:opacity-100")}
        >
          <Star weight={link.isStarred ? "fill" : "regular"} className={cn("h-3.5 w-3.5", link.isStarred && "text-amber-500")} />
        </OverlayButton>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground" title={link.title}>
            {link.title}
          </h3>
          {target && (
            <button
              type="button"
              onClick={() => onOpen(link)}
              className="mt-0.5 shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
              title={link.url ? "Open link" : "Open the reel"}
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {host && <span className="truncate font-mono text-[10.5px] text-muted-foreground">{prettyUrl(link.url ?? undefined)}</span>}
        {link.description && (
          <p className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">{link.description}</p>
        )}
        {/* Category is already the section heading, so the footer only credits the source. */}
        <div className="mt-auto flex items-center gap-2 pt-2 text-[10.5px] text-muted-foreground/80">
          {link.sourceLabel &&
            (link.sourceUrl ? (
              <button
                type="button"
                onClick={() => onOpen(link, link.sourceUrl)}
                className="truncate hover:text-foreground hover:underline underline-offset-2"
                title="Open the reel this came from"
              >
                via {link.sourceLabel}
              </button>
            ) : (
              <span className="truncate">via {link.sourceLabel}</span>
            ))}
        </div>
      </div>
    </article>
  );
};

const OverlayButton: React.FC<{
  title: string;
  onClick: () => void;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ title, onClick, danger, className, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition-all",
      danger ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-background",
      className
    )}
  >
    {children}
  </button>
);

export const ReferenceLibrary: React.FC = () => {
  const [links, setLinks] = useState<ReferenceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReferenceFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLinks(await stashIpc.listReferences());
    } catch (e) {
      toast.error("Couldn't load references", String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = (id: string, patch: Partial<ReferenceLink>) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const openLink = (link: ReferenceLink, url = link.url ?? link.sourceUrl) => {
    if (!url) return;
    void stashIpc.openExternalUrl(url);
    if (link.url && url === link.url && !link.isVisited) {
      update(link.id, { isVisited: true });
      void stashIpc.setReferenceFlags(link.id, { visited: true });
    }
  };

  const toggleStar = (link: ReferenceLink) => {
    update(link.id, { isStarred: !link.isStarred });
    void stashIpc.setReferenceFlags(link.id, { starred: !link.isStarred });
  };

  const copy = async (text: string, label = "Link copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Clipboard copy failed");
    }
  };

  const remove = (link: ReferenceLink) => {
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    void stashIpc.deleteReference(link.id);
    toast.undoable(`Removed “${link.title}”`, async () => {
      await stashIpc.saveReference(link);
      void reload();
    });
  };

  const addLink = async (draft: { url: string; title: string; category: string; description: string }) => {
    try {
      const saved = await stashIpc.saveReference({
        id: "",
        ...draft,
        status: "ready",
        isStarred: false,
        isVisited: false,
        createdAt: "",
        updatedAt: "",
      });
      setLinks((prev) => [saved, ...prev]);
      toast.success("Added to References", saved.title);
    } catch (e) {
      toast.error("Couldn't save the link", String(e));
      throw e;
    }
  };

  const counts = useMemo(
    () => ({
      all: links.length,
      ready: links.filter((l) => l.status === "ready").length,
      ask: links.filter((l) => l.status === "ask").length,
      video: links.filter((l) => l.status === "video").length,
      starred: links.filter((l) => l.isStarred).length,
    }),
    [links]
  );
  const categoryOptions = useMemo(
    () => groupReferences(filterReferences(links, { filter, query })).map((g) => [g.category, g.links.length] as const),
    [links, filter, query]
  );
  const visible = useMemo(() => filterReferences(links, { query, filter, category }), [links, query, filter, category]);
  const groups = useMemo(() => groupReferences(visible), [visible]);
  const opened = links.filter((l) => l.isVisited).length;

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-[1.375rem] font-semibold tracking-tight text-foreground">
              References
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `${counts.ready} tools & links · ${counts.ask + counts.video} leads still to track down · ${opened} opened`}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
              <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                placeholder="Search tools, creators, categories…"
                className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              Add link
            </button>
          </div>
        </div>

        {/* Status tabs + category picker */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {FILTERS.map((f) => {
              const n = counts[f.id];
              if (n === 0 && f.id !== "all") return null;
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {f.icon}
                  {f.label}
                  <span className="tabular-nums opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto shrink-0">
            <SimpleDropdown
              align="end"
              contentClassName="w-64 max-h-[60vh] overflow-y-auto text-xs"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors",
                    category ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="max-w-[160px] truncate">{category ?? "All categories"}</span>
                  <CaretDown className="h-3 w-3" />
                </button>
              )}
            >
              <SimpleDropdownItem onSelect={() => setCategory(null)}>
                <span className="flex w-full justify-between">
                  All categories <span className="text-muted-foreground">{visible.length}</span>
                </span>
              </SimpleDropdownItem>
              <SimpleDropdownSeparator />
              {categoryOptions.map(([cat, n]) => (
                <SimpleDropdownItem key={cat} onSelect={() => setCategory(cat)}>
                  <span className={cn("flex w-full justify-between gap-2", category === cat && "font-semibold")}>
                    <span className="truncate">{cat}</span>
                    <span className="text-muted-foreground">{n}</span>
                  </span>
                </SimpleDropdownItem>
              ))}
            </SimpleDropdown>
          </div>
        </div>
      </div>

      <AddReferenceDialog
        open={adding}
        onOpenChange={setAdding}
        existing={links}
        defaultCategory={category}
        onSave={addLink}
      />

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-6">
        {!loading && links.length === 0 ? (
          <div className="mx-auto mt-20 flex max-w-sm flex-col items-center gap-3 text-center text-muted-foreground">
            <BookmarksSimple className="h-10 w-10" />
            <p className="text-sm font-medium text-foreground">No references yet</p>
            <p className="text-xs">Save tools, repos and sites you want to come back to. Paste one with “Add link”.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-16 text-center text-xs text-muted-foreground">
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
          groups.map((group) => (
            <section key={group.category} className="mb-8">
              <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-foreground">
                {group.category}
                <span className="text-xs font-normal text-muted-foreground">{group.links.length}</span>
              </h2>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {group.links.map((link) => (
                  <ReferenceCard
                    key={link.id}
                    link={link}
                    onOpen={openLink}
                    onToggleStar={toggleStar}
                    onCopy={copy}
                    onDelete={remove}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
