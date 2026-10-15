import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinkSimple, WarningCircle } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { hostOf, normalizeUrl, prettyUrl } from "@/features/widgets/link-collection";
import { ReferenceLink } from "../types";
import { thumbnailFor } from "../reference-filters";

interface AddReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: ReferenceLink[];
  /** Category to start with (e.g. the one currently filtered). */
  defaultCategory?: string | null;
  onSave: (draft: { url: string; title: string; category: string; description: string }) => Promise<void>;
}

/** "github.com/owner/repo" → "repo", "www.motion.dev" → "Motion". */
function suggestTitle(url: string): string {
  const gh = url.match(/github\.com\/[\w.-]+\/([\w.-]+)/);
  if (gh) return gh[1];
  const host = hostOf(url).split(".")[0] ?? "";
  return host ? host.charAt(0).toUpperCase() + host.slice(1) : "";
}

export const AddReferenceDialog: React.FC<AddReferenceDialogProps> = ({
  open,
  onOpenChange,
  existing,
  defaultCategory,
  onSave,
}) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrl("");
    setTitle("");
    setDescription("");
    setTouched(false);
    setCategory(defaultCategory ?? "");
  }, [open, defaultCategory]);

  const normalized = useMemo(() => normalizeUrl(url), [url]);
  const duplicate = useMemo(() => {
    if (!normalized) return null;
    const key = normalized.toLowerCase().replace(/\/$/, "").replace("://www.", "://");
    return existing.find((l) => l.url && l.url.toLowerCase().replace(/\/$/, "").replace("://www.", "://") === key) ?? null;
  }, [normalized, existing]);
  const categories = useMemo(
    () => [...new Set(existing.filter((l) => l.status === "ready").map((l) => l.category))].sort(),
    [existing]
  );
  const shownTitle = title.trim() || (normalized ? suggestTitle(normalized) : "");
  const preview: ReferenceLink | null = normalized
    ? {
        id: "preview",
        title: shownTitle || prettyUrl(normalized),
        url: normalized,
        description: description.trim(),
        category: category.trim() || "Uncategorized",
        status: "ready",
        isStarred: false,
        isVisited: false,
        createdAt: "",
        updatedAt: "",
      }
    : null;
  const thumb = preview ? thumbnailFor(preview) : null;
  const invalid = touched && !normalized;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (saving) return;
    if (!normalized) {
      urlRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({
        url: normalized,
        title: shownTitle || prettyUrl(normalized),
        category: category.trim() || "Uncategorized",
        description: description.trim(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader>
          <DialogTitle>Add a reference</DialogTitle>
          <DialogDescription>Save a tool, repo or site to come back to.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Link</span>
            <div className="relative">
              <LinkSimple className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={urlRef}
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => url.trim() && setTouched(true)}
                placeholder="https://… or github.com/owner/repo"
                className={cn(field, "pl-9", invalid && "border-destructive/60 focus:ring-destructive/20")}
                inputMode="url"
              />
            </div>
            {invalid && (
              <span className="text-[11px] text-destructive">
                {url.trim() ? "That doesn't look like a link." : "Paste a link to save."}
              </span>
            )}
            {duplicate && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <WarningCircle className="h-3.5 w-3.5" /> Already saved as “{duplicate.title}”.
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Name</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={normalized ? suggestTitle(normalized) || "Name" : "Optional"}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Category</span>
              <input
                list="stash-reference-category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Pick or type new"
                className={field}
              />
              <datalist id="stash-reference-category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
              }}
              rows={2}
              placeholder="What is it, why did you save it?"
              className={cn(field, "h-auto resize-none py-2")}
            />
          </label>

          {/* Live preview of the card */}
          {preview && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-2">
              <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={`https://${hostOf(preview.url!)}/favicon.ico`}
                    alt=""
                    className="h-7 w-7"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{preview.title}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{prettyUrl(preview.url!)}</p>
                <p className="truncate text-[11px] text-muted-foreground">{preview.category}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save reference"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
