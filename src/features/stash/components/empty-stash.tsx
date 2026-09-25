import React from "react";
import { Plus } from "@phosphor-icons/react";
import { SidebarSection } from "@/features/stash/types/note";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";

interface EmptyStashProps {
  section: SidebarSection;
  isSearching: boolean;
  onCapture: () => void | Promise<void>;
}

interface EmptyCopy {
  title: string;
  description: string;
  /** Sections that hold discarded or parked notes offer no capture action. */
  offerCapture: boolean;
}

function copyFor(section: SidebarSection, isSearching: boolean): EmptyCopy {
  if (isSearching) {
    return {
      title: "Nothing matched that.",
      description: "Try fewer words, or reset the filters.",
      offerCapture: false,
    };
  }

  switch (section) {
    case "trash":
      return {
        title: "Trash is empty.",
        description: "Deleted notes wait here until you empty it.",
        offerCapture: false,
      };
    case "archive":
      return {
        title: "Archive is empty.",
        description: "Archived notes are kept out of the way but never lost.",
        offerCapture: false,
      };
    case "pinned":
      return {
        title: "Nothing pinned.",
        description: "Pin the notes you want at the top of the library.",
        offerCapture: false,
      };
    case "favorites":
      return {
        title: "No favorites yet.",
        description: "Star a note to keep it one click away.",
        offerCapture: false,
      };
    case "todos":
      return {
        title: "No tasks yet.",
        description: "Open a stash and drop a checklist into the note.",
        offerCapture: true,
      };
    case "tags":
      return {
        title: "Nothing tagged.",
        description: "Tags are optional — capture first, organise later.",
        offerCapture: true,
      };
    default:
      return {
        title: "Nothing stashed yet.",
        description: "Capture something worth keeping.",
        offerCapture: true,
      };
  }
}

/**
 * Small by design: a line, a sentence, and — where it makes sense — the one
 * action that fixes it. No illustrations, no onboarding surface.
 */
export const EmptyStash: React.FC<EmptyStashProps> = ({
  section,
  isSearching,
  onCapture,
}) => {
  const copy = copyFor(section, isSearching);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center animate-fade-in">
      <h3 className="text-sm font-semibold tracking-tight">{copy.title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {copy.description}
      </p>

      {copy.offerCapture && (
        <>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => onCapture()}
              className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New stash
            </button>
          </div>

          <p className="mt-4 text-2xs text-subtle">
            or press{" "}
            <kbd className="rounded-xs border border-border px-1 py-px font-mono text-[10px]">
              {formatShortcut(SHORTCUTS.quickCapture)}
            </kbd>{" "}
            from anywhere
          </p>
        </>
      )}
    </div>
  );
};
