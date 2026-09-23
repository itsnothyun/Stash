import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTE_COLORS, NoteColor } from "@/features/stash/types/color";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface ColorPickerProps {
  currentColor: NoteColor;
  onSelectColor: (color: NoteColor) => void;
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onSelectColor,
  children,
  align = "start",
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <button
            className="h-6 w-6 rounded-full border border-border/80 p-0.5 hover:scale-105 transition-transform"
            title="Change color"
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                backgroundColor:
                  NOTE_COLORS.find((c) => c.id === currentColor)?.dotColor ||
                  "#e4e4e7",
              }}
            />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto p-2 grid grid-cols-3 gap-1.5 border-border bg-popover shadow-lg"
      >
        {NOTE_COLORS.map((c) => {
          const isSelected = c.id === currentColor;
          return (
            <button
              key={c.id}
              onClick={() => {
                onSelectColor(c.id);
                setOpen(false);
              }}
              className={cn(
                "group flex items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent text-left",
                isSelected && "font-medium"
              )}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: c.dotColor }}
              >
                {isSelected && <Check className="h-2.5 w-2.5 text-black/70 stroke-[3]" />}
              </span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
