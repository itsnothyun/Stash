import React from "react";
import { ChevronDown, Clipboard, Plus, FileText } from "lucide-react";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { NOTE_TEMPLATES } from "@/features/stash/templates";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface NewStashMenuProps {
  onCreate: () => void;
  className?: string;
}

export const NewStashMenu: React.FC<NewStashMenuProps> = ({
  onCreate,
  className,
}) => {
  const handleClipboard = async () => {
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
  };

  const handleCreateFromTemplate = async (tmpl: (typeof NOTE_TEMPLATES)[number]) => {
    await createAndOpenStash({
      title: tmpl.title,
      color: tmpl.color,
      plainText: tmpl.plainText,
      tagNames: tmpl.tagNames,
    });
    toast.show({ message: `Created ${tmpl.name}` });
  };

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        onClick={onCreate}
        title={`New stash — ${formatShortcut(SHORTCUTS.quickCapture)}`}
        className="flex h-8 items-center gap-1.5 rounded-l bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 active:scale-[0.985]"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>New Stash</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-6 items-center justify-center rounded-r border-l border-primary-foreground/20 bg-primary text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 active:scale-[0.985]"
            aria-label="More capture options"
          >
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 text-xs">
          <DropdownMenuItem onClick={onCreate}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            <span>Blank Stash</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleClipboard()}>
            <Clipboard className="mr-2 h-3.5 w-3.5" />
            <span>Capture clipboard</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Templates
          </div>
          {NOTE_TEMPLATES.map((tmpl) => (
            <DropdownMenuItem
              key={tmpl.id}
              onClick={() => void handleCreateFromTemplate(tmpl)}
              className="flex flex-col items-start gap-0.5 cursor-pointer py-1.5"
            >
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <FileText className="h-3 w-3 text-primary shrink-0" />
                <span>{tmpl.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1 pl-4.5">
                {tmpl.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
