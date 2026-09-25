import React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import { Note, Settings } from "@/features/stash/types/note";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";
import { toast } from "@/components/ui/toast";
import {
  Archive,
  ArrowsDownUp as ArrowUpDown,
  ClipboardText as Clipboard,
  CopySimple as Copy,
  ArrowUpRight as ExternalLink,
  Stack as Layers,
  Plus,
  SquaresFour as LayoutGrid,
  CheckSquareOffset as ListChecks,
  Moon,
  Desktop as Monitor,
  PushPin as Pin,
  ArrowCounterClockwise as RotateCcw,
  Gear as SettingsIcon,
  Star,
  Sun,
  Trash as Trash2,
  MagnifyingGlassPlus as ZoomIn,
  MagnifyingGlassMinus as ZoomOut,
  Globe,
} from "@phosphor-icons/react";
import { NOTE_TEMPLATES } from "@/features/stash/templates";
import { cn } from "@/lib/utils/cn";
import { stashIpc } from "@/lib/ipc/stash-ipc";

interface CommandPaletteProps {
  onCapture: () => void | Promise<void>;
  currentNote?: Note | null;
  onOpenNote?: (id: string) => void;
  onDuplicateNote?: (note: Note) => void;
  onArchiveNote?: (note: Note) => void;
  onTrashNote?: (note: Note) => void;
  onToggleViewMode?: () => void;
  onUpdateSettings?: (patch: Partial<Settings>) => void | Promise<void>;
}

/**
 * Everything reachable by keyboard, in one list.
 *
 * Note actions only appear when a note is actually selected — the palette
 * never offers something that would do nothing.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onCapture,
  currentNote,
  onOpenNote,
  onDuplicateNote,
  onArchiveNote,
  onTrashNote,
  onToggleViewMode,
  onUpdateSettings,
}) => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveSection,
    setSettingsOpen,
    requestSearchFocus,
    setTheme,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useUIStore();

  const run = (action: () => void) => {
    setCommandPaletteOpen(false);
    action();
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Capture">
          <CommandItem onSelect={() => run(() => void onCapture())}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New stash</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.quickCapture)}</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false);
              void (async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (!text.trim()) {
                    toast.show({ message: "Clipboard is empty" });
                    return;
                  }
                  await createAndOpenStash({ plainText: text.trim() });
                  toast.show({ message: "Created stash from clipboard" });
                } catch {
                  toast.error("Could not read clipboard", "Check clipboard permissions.");
                }
              })();
            }}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            <span>Capture clipboard</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              run(() => {
                void createAndOpenStash({
                  color: "Mint",
                  title: "ETH / USDC Swap",
                  plainText: "[swap-widget]\n\nSwap calculator attached to this note.\n",
                  tagNames: ["swap", "crypto"],
                });
              })
            }
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <span>New swap note</span>
          </CommandItem>

          <CommandItem onSelect={() => run(() => requestSearchFocus())}>
            <Layers className="mr-2 h-4 w-4" />
            <span>Search your stash</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.search)}</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              run(() => {
                void stashIpc.openPipBrowser();
              })
            }
          >
            <Globe className="mr-2 h-4 w-4 text-foreground" />
            <span>Open Picture-in-Picture Browser</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Templates">
          {NOTE_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <CommandItem
                key={tmpl.id}
                onSelect={() =>
                  run(() => {
                    void createAndOpenStash({
                      color: tmpl.color,
                      title: tmpl.title,
                      plainText: tmpl.plainText,
                      tagNames: tmpl.tagNames,
                      emoji: tmpl.emoji,
                      paper: tmpl.paper,
                      widgets: tmpl.widgets,
                    });
                  })
                }
              >
                <div
                  className={cn(
                    "mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded",
                    tmpl.iconBg
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", tmpl.iconColor)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tmpl.name}</span>
                  <span className="text-2xs text-muted-foreground">— {tmpl.description}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {(
            [
              { id: "all", label: "All Notes", icon: Layers },
              { id: "todos", label: "To-dos", icon: ListChecks },
              { id: "pinned", label: "Pinned", icon: Pin },
              { id: "favorites", label: "Favorites", icon: Star },
              { id: "archive", label: "Archive", icon: Archive },
              { id: "trash", label: "Trash", icon: Trash2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => run(() => setActiveSection(item.id))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {currentNote && (
          <>
            <CommandSeparator />
            <CommandGroup
              heading={currentNote.title?.trim() || "Selected note"}
            >
              {onOpenNote && (
                <CommandItem
                  onSelect={() => run(() => onOpenNote(currentNote.id))}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Open as floating stash</span>
                  <CommandShortcut>⏎</CommandShortcut>
                </CommandItem>
              )}
              {onDuplicateNote && (
                <CommandItem
                  onSelect={() => run(() => onDuplicateNote(currentNote))}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplicate</span>
                  <CommandShortcut>
                    {formatShortcut(SHORTCUTS.duplicate)}
                  </CommandShortcut>
                </CommandItem>
              )}
              {onArchiveNote && (
                <CommandItem
                  onSelect={() => run(() => onArchiveNote(currentNote))}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  <span>{currentNote.isArchived ? "Unarchive" : "Archive"}</span>
                  <CommandShortcut>
                    {formatShortcut(SHORTCUTS.archive)}
                  </CommandShortcut>
                </CommandItem>
              )}
              {onTrashNote && (
                <CommandItem onSelect={() => run(() => onTrashNote(currentNote))}>
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  <span className="text-destructive">Move to Trash</span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Preferences">
          {onToggleViewMode && (
            <CommandItem onSelect={() => run(onToggleViewMode)}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Toggle grid / list view</span>
            </CommandItem>
          )}

          {(
            [
              { id: "light", label: "Light theme", icon: Sun },
              { id: "dark", label: "Dark theme", icon: Moon },
              { id: "system", label: "Match system theme", icon: Monitor },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() =>
                  run(() => {
                    setTheme(item.id);
                    void onUpdateSettings?.({ theme: item.id });
                  })
                }
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}

          <CommandItem onSelect={() => run(() => setSettingsOpen(true))}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.settings)}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Zoom">
          <CommandItem onSelect={() => run(() => zoomIn())}>
            <ZoomIn className="mr-2 h-4 w-4" />
            <span>Zoom in</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.zoomIn)}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => zoomOut())}>
            <ZoomOut className="mr-2 h-4 w-4" />
            <span>Zoom out</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.zoomOut)}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => resetZoom())}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Reset zoom</span>
            <CommandShortcut>{formatShortcut(SHORTCUTS.resetZoom)}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
