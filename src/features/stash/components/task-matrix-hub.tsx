import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquareOffset,
  Check,
  Plus,
  MagnifyingGlass,
  ArrowSquareOut,
  CalendarBlank,
  CaretDown,
  CaretRight,
  Trash as Trash2,
  PencilSimple,
  ListBullets,
  SquaresFour,
  Broom,
  X,
  NotePencil,
} from "@phosphor-icons/react";
import { Note } from "../types/note";
import { NoteColor, getColorDot } from "../types/color";
import {
  MatrixTask,
  addTaskToDoc,
  deleteTaskInDoc,
  extractMatrixTasks,
  newTaskNoteContent,
  toggleTaskInDoc,
  updateTaskTextInDoc,
} from "../task-matrix";
import { organizeDocTasks } from "../task-organizer";
import { getNoteEmoji } from "../note-meta";
import { extractDoc, docToPlainText, STASH_DOC_TYPE } from "@/features/editor/stash-content";
import { stashIpc } from "@/lib/ipc/stash-ipc";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";
import {
  SimpleDropdown,
  SimpleDropdownItem,
  SimpleDropdownSeparator,
} from "@/components/ui/simple-dropdown";

interface TaskMatrixHubProps {
  /** Notes that contain tasks (what the To-dos section loads). */
  notes: Note[];
  onNoteUpdated?: (note: Note) => void;
  onOpenStash: (noteId: string) => void;
}

type Tab = "active" | "done" | "all";
type Layout = "lists" | "flat";
type DocChange = { contentJson: string; plainText: string };

const NEW_LIST = "__new__";
const TARGET_KEY = "stash:todos:target";
const LAYOUT_KEY = "stash:todos:layout";
/** How long a just-ticked task lingers in the Active view before it leaves. */
const LINGER_MS = 1400;

function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* preference only */
  }
}

export const TaskMatrixHub: React.FC<TaskMatrixHubProps> = ({ notes, onNoteUpdated, onOpenStash }) => {
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<Layout>(() => readPref<Layout>(LAYOUT_KEY, "lists"));
  const [draft, setDraft] = useState("");
  const [targetId, setTargetId] = useState<string>(() => readPref(TARGET_KEY, ""));
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  /** Optimistic copies of notes we've changed but the parent hasn't reloaded yet. */
  const [overrides, setOverrides] = useState<Record<string, Note>>({});
  const [lingering, setLingering] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [showDone, setShowDone] = useState<Record<string, boolean>>({});
  const composerRef = useRef<HTMLInputElement>(null);
  const queues = useRef(new Map<string, Promise<unknown>>());
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;

  // Every note is a valid destination for a new task, not just ones that have tasks.
  const refreshAllNotes = useCallback(async () => {
    try {
      setAllNotes((await stashIpc.listNotes("all")).filter((n) => !n.isArchived && !n.deletedAt));
    } catch {
      /* picker falls back to the notes we were given */
    }
  }, []);
  useEffect(() => {
    void refreshAllNotes();
  }, [refreshAllNotes]);

  // Keyboard: "n" or "/" jumps to the composer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "/") {
        e.preventDefault();
        composerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Parent data wins once it has caught up with (or passed) our optimistic copy.
  const mergedNotes = useMemo(() => {
    const byId = new Map(notes.map((n) => [n.id, n]));
    for (const o of Object.values(overrides)) {
      const base = byId.get(o.id);
      if (!base || base.version < o.version || base.contentJson !== o.contentJson) byId.set(o.id, o);
    }
    return [...byId.values()];
  }, [notes, overrides]);

  const allTasks = useMemo(() => extractMatrixTasks(mergedNotes), [mergedNotes]);
  const stats = useMemo(() => {
    const done = allTasks.filter((t) => t.checked).length;
    return { total: allTasks.length, done, active: allTasks.length - done };
  }, [allTasks]);

  const pickerNotes = useMemo(() => {
    const byId = new Map(allNotes.map((n) => [n.id, n]));
    mergedNotes.forEach((n) => byId.set(n.id, n));
    const withTasks = new Set(allTasks.map((t) => t.noteId));
    return [...byId.values()].sort(
      (a, b) =>
        Number(withTasks.has(b.id)) - Number(withTasks.has(a.id)) ||
        (b.updatedAt || "").localeCompare(a.updatedAt || "")
    );
  }, [allNotes, mergedNotes, allTasks]);

  // Remembered list if it still exists, else the most relevant one — never an empty "choose" state.
  const target =
    targetId === NEW_LIST ? null : pickerNotes.find((n) => n.id === targetId) ?? pickerNotes[0] ?? null;
  const targetLabel = target ? target.title?.trim() || "Untitled" : "New list";

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (tab === "active" && t.checked && !lingering.has(t.id)) return false;
      if (tab === "done" && !t.checked) return false;
      if (!q) return true;
      return [t.text, t.noteTitle, ...t.tags].some((s) => s.toLowerCase().includes(q));
    });
  }, [allTasks, tab, query, lingering]);

  const groups = useMemo(() => {
    const map = new Map<string, MatrixTask[]>();
    for (const t of visibleTasks) {
      if (!map.has(t.noteId)) map.set(t.noteId, []);
      map.get(t.noteId)!.push(t);
    }
    return [...map.entries()].map(([noteId, tasks]) => ({
      note: mergedNotes.find((n) => n.id === noteId),
      noteId,
      tasks,
      all: allTasks.filter((t) => t.noteId === noteId),
    }));
  }, [visibleTasks, mergedNotes, allTasks]);

  /* ----------------------------- persistence ----------------------------- */

  /** Applies a doc change optimistically, then saves it — one write at a time per note. */
  const commit = useCallback(
    (note: Note, change: (n: Note) => DocChange): Promise<Note | null> => {
      const current = overridesRef.current[note.id] ?? note;
      const next = change(current);
      const optimistic: Note = { ...current, ...next, version: current.version + 1 };
      setOverrides((o) => ({ ...o, [note.id]: optimistic }));

      const prev = queues.current.get(note.id) ?? Promise.resolve();
      const run = prev.then(async () => {
        try {
          const saved = await stashIpc.updateNote({ id: note.id, ...next, version: current.version });
          setOverrides((o) => ({ ...o, [note.id]: saved }));
          onNoteUpdated?.(saved);
          return saved;
        } catch {
          setOverrides((o) => ({ ...o, [note.id]: current }));
          toast.error("Couldn't save that change", "Your list is back to how it was.");
          return null;
        }
      });
      queues.current.set(note.id, run);
      return run;
    },
    [onNoteUpdated]
  );
  const noteFor = (id: string) => mergedNotes.find((n) => n.id === id) ?? pickerNotes.find((n) => n.id === id);

  const toggle = (task: MatrixTask) => {
    const note = noteFor(task.noteId);
    if (!note) return;
    playClickSound();
    const nextChecked = !task.checked;
    if (nextChecked) {
      setLingering((s) => new Set(s).add(task.id));
      window.setTimeout(
        () =>
          setLingering((s) => {
            const n = new Set(s);
            n.delete(task.id);
            return n;
          }),
        LINGER_MS
      );
    }
    void commit(note, (n) => toggleTaskInDoc(n.contentJson, n.plainText, task.indexInNote, nextChecked));
  };

  const saveEdit = () => {
    if (!editing) return;
    const task = allTasks.find((t) => t.id === editing.id);
    const text = editing.text.trim();
    setEditing(null);
    if (!task || !text || text === task.text) return;
    const note = noteFor(task.noteId);
    if (note) void commit(note, (n) => updateTaskTextInDoc(n.contentJson, n.plainText, task.indexInNote, text));
  };

  const remove = (task: MatrixTask) => {
    const note = noteFor(task.noteId);
    if (!note) return;
    const before = overridesRef.current[note.id] ?? note;
    void commit(note, (n) => deleteTaskInDoc(n.contentJson, n.plainText, task.indexInNote));
    toast.undoable(`Deleted “${task.text}”`, () => {
      void commit(note, () => ({ contentJson: before.contentJson, plainText: before.plainText }));
    });
  };

  const addTo = async (noteId: string, text: string): Promise<boolean> => {
    const clean = text.trim();
    if (!clean) return false;
    if (noteId === NEW_LIST || !noteFor(noteId)) {
      try {
        const created = await stashIpc.createNote({ title: "To-dos", ...newTaskNoteContent(clean) });
        setOverrides((o) => ({ ...o, [created.id]: created }));
        setAllNotes((a) => [created, ...a]);
        setTargetId(created.id);
        writePref(TARGET_KEY, created.id);
        onNoteUpdated?.(created);
        toast.success("Started a new list", "“To-dos” — rename it any time.");
        return true;
      } catch {
        toast.error("Couldn't create the list");
        return false;
      }
    }
    const note = noteFor(noteId)!;
    void commit(note, (n) => addTaskToDoc(n.contentJson, n.plainText, clean));
    return true;
  };

  const submitComposer = async (e: React.FormEvent) => {
    e.preventDefault();
    // Nothing typed yet: the button just takes you to the input.
    if (!draft.trim()) {
      composerRef.current?.focus();
      return;
    }
    const dest = target?.id ?? NEW_LIST;
    if (await addTo(dest, draft)) {
      setDraft("");
      if (tab === "done") setTab("active");
      composerRef.current?.focus();
    }
  };

  const chooseTarget = (id: string) => {
    setTargetId(id);
    writePref(TARGET_KEY, id);
    composerRef.current?.focus();
  };

  const tidyDone = async () => {
    let touched = 0;
    for (const note of mergedNotes) {
      const doc = extractDoc(note.contentJson);
      if (!doc || !allTasks.some((t) => t.noteId === note.id && t.checked)) continue;
      const res = organizeDocTasks(doc);
      if (JSON.stringify(res.updatedDoc) === JSON.stringify(doc)) continue;
      touched++;
      void commit(note, (n) => {
        let envelope: any = null;
        try {
          envelope = JSON.parse(n.contentJson);
        } catch {
          /* rewrapped below */
        }
        const contentJson =
          envelope?.type === STASH_DOC_TYPE
            ? JSON.stringify({ ...envelope, doc: res.updatedDoc })
            : JSON.stringify({ type: STASH_DOC_TYPE, doc: res.updatedDoc, widgets: [] });
        return { contentJson, plainText: docToPlainText(res.updatedDoc) };
      });
    }
    toast.success(touched ? `Moved done tasks to the bottom in ${touched} list${touched === 1 ? "" : "s"}` : "Already tidy");
  };

  /* -------------------------------- render -------------------------------- */

  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const renderRow = (task: MatrixTask, showNote: boolean) => {
    const isEditing = editing?.id === task.id;
    return (
      <li
        key={task.id}
        className={cn(
          "group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40",
          task.checked && lingering.has(task.id) && "bg-emerald-500/5"
        )}
        style={{ paddingLeft: `${12 + task.depth * 22}px` }}
      >
        <button
          type="button"
          onClick={() => toggle(task)}
          aria-label={task.checked ? `Mark “${task.text}” as not done` : `Mark “${task.text}” as done`}
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all active:scale-90",
            task.checked
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-emerald-500 hover:bg-emerald-500/10"
          )}
        >
          {task.checked && <Check className="h-3 w-3" weight="bold" />}
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={editing!.text}
            onChange={(e) => setEditing({ id: task.id, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setEditing(null);
            }}
            onBlur={saveEdit}
            className="min-w-0 flex-1 rounded-md border border-primary/40 bg-background px-2 py-0.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing({ id: task.id, text: task.text })}
            title="Click to edit"
            className={cn(
              "min-w-0 flex-1 truncate text-left text-[13px] transition-colors",
              task.checked ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
            )}
          >
            {task.text}
          </button>
        )}

        {showNote && !isEditing && (
          <button
            type="button"
            onClick={() => onOpenStash(task.noteId)}
            className="max-w-[140px] shrink-0 truncate rounded-md bg-muted/70 px-1.5 py-0.5 text-[10.5px] text-muted-foreground hover:text-foreground"
            title="Open this list"
          >
            {task.noteTitle}
          </button>
        )}
        {task.dueDate && !isEditing && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
            <CalendarBlank className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        )}
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <RowIcon title="Edit" onClick={() => setEditing({ id: task.id, text: task.text })}>
              <PencilSimple className="h-3.5 w-3.5" />
            </RowIcon>
            <RowIcon title="Delete" onClick={() => remove(task)} danger>
              <Trash2 className="h-3.5 w-3.5" />
            </RowIcon>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
      {/* Composer */}
      <form
        onSubmit={submitComposer}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-3 shadow-xs focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"
      >
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" weight="bold" />
        <input
          ref={composerRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…   (press N anywhere)"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        <SimpleDropdown
          align="end"
          contentClassName="w-64 max-h-[50vh] overflow-y-auto text-xs"
          trigger={({ toggle: toggleMenu }) => (
            <button
              type="button"
              onClick={() => {
                void refreshAllNotes();
                toggleMenu();
              }}
              className="flex h-8 max-w-[180px] shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Which list the task goes into"
            >
              <span className="text-muted-foreground/70">in</span>
              {target && <span className={cn("h-2 w-2 shrink-0 rounded-full", getColorDot(target.color as NoteColor))} />}
              <span className="truncate font-medium text-foreground">{targetLabel}</span>
              <CaretDown className="h-3 w-3 shrink-0" />
            </button>
          )}
        >
          <SimpleDropdownItem onSelect={() => chooseTarget(NEW_LIST)}>
            <NotePencil className="mr-2 h-3.5 w-3.5 text-primary" />
            <span className="font-medium">New list</span>
          </SimpleDropdownItem>
          <SimpleDropdownSeparator />
          {pickerNotes.map((n) => (
            <SimpleDropdownItem key={n.id} onSelect={() => chooseTarget(n.id)}>
              <span className={cn("mr-2 h-2 w-2 shrink-0 rounded-full", getColorDot(n.color as NoteColor))} />
              <span className={cn("truncate", n.id === target?.id && "font-semibold")}>
                {getNoteEmoji(n.id) ? `${getNoteEmoji(n.id)} ` : ""}
                {n.title?.trim() || "Untitled"}
              </span>
            </SimpleDropdownItem>
          ))}
        </SimpleDropdown>
        <button
          type="submit"
          className="h-8 shrink-0 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90 active:scale-95"
        >
          Add
        </button>
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
          {(
            [
              { id: "active", label: "Active", n: stats.active },
              { id: "done", label: "Done", n: stats.done },
              { id: "all", label: "All", n: stats.total },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                tab === t.id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              <span className="tabular-nums opacity-60">{t.n}</span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto min-w-[140px] flex-1 sm:max-w-[220px]">
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search tasks"
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40"
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

        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          <RowIcon
            title="Group by list"
            onClick={() => {
              setLayout("lists");
              writePref(LAYOUT_KEY, "lists");
            }}
            active={layout === "lists"}
          >
            <SquaresFour className="h-3.5 w-3.5" />
          </RowIcon>
          <RowIcon
            title="One flat list"
            onClick={() => {
              setLayout("flat");
              writePref(LAYOUT_KEY, "flat");
            }}
            active={layout === "flat"}
          >
            <ListBullets className="h-3.5 w-3.5" />
          </RowIcon>
        </div>
        <RowIcon title="Move done tasks to the bottom of each list" onClick={() => void tidyDone()}>
          <Broom className="h-4 w-4" />
        </RowIcon>
      </div>

      {/* Progress */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <span className="shrink-0 tabular-nums">
            {stats.done} of {stats.total} done
          </span>
        </div>
      )}

      {/* Lists */}
      {allTasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          body="Type your first task above and press Enter. It goes into the list you pick — or a new one."
          onAction={() => composerRef.current?.focus()}
          action="Add a task"
        />
      ) : visibleTasks.length === 0 ? (
        query ? (
          <EmptyState title="No matches" body={`Nothing matches “${query}”.`} onAction={() => setQuery("")} action="Clear search" />
        ) : tab === "active" ? (
          <EmptyState title="All done 🎉" body="Every task is ticked off. Add something new above." onAction={() => setTab("done")} action="See what you finished" />
        ) : (
          <EmptyState title="Nothing finished yet" body="Ticked tasks show up here." onAction={() => setTab("active")} action="Back to active" />
        )
      ) : layout === "flat" ? (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
          {visibleTasks.map((t) => renderRow(t, true))}
        </ul>
      ) : (
        groups.map(({ note, noteId, tasks, all }) => (
          <TaskGroup
            key={noteId}
            note={note}
            noteId={noteId}
            tasks={tasks}
            all={all}
            tab={tab}
            showDone={!!showDone[noteId]}
            onToggleShowDone={() => setShowDone((s) => ({ ...s, [noteId]: !s[noteId] }))}
            renderRow={(t) => renderRow(t, false)}
            onOpen={() => onOpenStash(noteId)}
            onAdd={(text) => addTo(noteId, text)}
          />
        ))
      )}
    </div>
  );
};

interface TaskGroupProps {
  note: Note | undefined;
  noteId: string;
  tasks: MatrixTask[];
  all: MatrixTask[];
  tab: Tab;
  showDone: boolean;
  onToggleShowDone: () => void;
  renderRow: (t: MatrixTask) => React.ReactNode;
  onOpen: () => void;
  onAdd: (text: string) => Promise<boolean>;
}

const TaskGroup: React.FC<TaskGroupProps> = ({
  note,
  noteId,
  tasks,
  all,
  tab,
  showDone,
  onToggleShowDone,
  renderRow,
  onOpen,
  onAdd,
}) => {
  const [adding, setAdding] = useState("");
  const done = all.filter((t) => t.checked).length;
  const title = note?.title?.trim() || all[0]?.noteTitle || "Untitled";
  const emoji = getNoteEmoji(noteId);
  // In "All", finished tasks fold away under their own toggle.
  const open = tab === "all" ? tasks.filter((t) => !t.checked) : tasks;
  const finished = tab === "all" ? tasks.filter((t) => t.checked) : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getColorDot((note?.color ?? "Paper") as NoteColor))} />
        {emoji && <span className="text-sm leading-none">{emoji}</span>}
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 truncate text-[13px] font-semibold text-foreground hover:underline underline-offset-2"
          title="Open this list"
        >
          {title}
        </button>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {done}/{all.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-muted sm:block">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }}
            />
          </div>
          <RowIcon title="Open list" onClick={onOpen}>
            <ArrowSquareOut className="h-3.5 w-3.5" />
          </RowIcon>
        </div>
      </header>

      <ul className="divide-y divide-border/40">{open.map(renderRow)}</ul>

      {finished.length > 0 && (
        <>
          <button
            type="button"
            onClick={onToggleShowDone}
            className="flex w-full items-center gap-1.5 border-t border-border/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showDone ? <CaretDown className="h-3 w-3" /> : <CaretRight className="h-3 w-3" />}
            Completed {finished.length}
          </button>
          {showDone && <ul className="divide-y divide-border/40 bg-muted/20">{finished.map(renderRow)}</ul>}
        </>
      )}

      {tab !== "done" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onAdd(adding)) setAdding("");
          }}
          className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5"
        >
          <Plus className="h-[18px] w-[18px] shrink-0 p-0.5 text-muted-foreground/60" />
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAdding("")}
            placeholder={`Add to ${title}…`}
            className="min-w-0 flex-1 bg-transparent py-0.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </form>
      )}
    </section>
  );
};

const RowIcon: React.FC<{
  title: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, danger, active, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
      danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      active && "bg-muted text-foreground"
    )}
  >
    {children}
  </button>
);

const EmptyState: React.FC<{ title: string; body: string; action: string; onAction: () => void }> = ({
  title,
  body,
  action,
  onAction,
}) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
    <CheckSquareOffset className="h-9 w-9 text-muted-foreground/40" weight="duotone" />
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="max-w-xs text-xs text-muted-foreground">{body}</p>
    <button type="button" onClick={onAction} className="mt-1 text-xs font-medium text-primary hover:underline">
      {action}
    </button>
  </div>
);
