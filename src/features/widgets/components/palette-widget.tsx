import React, { useState } from "react";
import { Plus, X, CopySimple as Copy, Check, Sparkle as Sparkles } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { toast } from "@/components/ui/toast";

interface PaletteColor {
  id: string;
  hex: string;
  name?: string;
}

interface PaletteWidgetProps {
  initialColors?: PaletteColor[];
  onInsertToNote?: (text: string) => void;
}

const DEFAULT_PALETTE: PaletteColor[] = [
  { id: "1", hex: "#6366f1", name: "Indigo" },
  { id: "2", hex: "#3b82f6", name: "Blue" },
  { id: "3", hex: "#10b981", name: "Emerald" },
  { id: "4", hex: "#f59e0b", name: "Amber" },
  { id: "5", hex: "#ec4899", name: "Pink" },
];

export const PaletteWidget: React.FC<PaletteWidgetProps> = ({
  initialColors = DEFAULT_PALETTE,
  onInsertToNote,
}) => {
  const [colors, setColors] = useState<PaletteColor[]>(initialColors);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newHex, setNewHex] = useState("#6366f1");

  const copyHex = async (color: PaletteColor) => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopiedId(color.id);
      setTimeout(() => setCopiedId(null), 1200);
      toast.show({ message: `Copied ${color.hex}` });
    } catch {
      // ignore
    }
  };

  const addColor = () => {
    const hex = newHex.startsWith("#") ? newHex : `#${newHex}`;
    setColors([...colors, { id: Date.now().toString(), hex }]);
  };

  const removeColor = (id: string) => {
    setColors(colors.filter((c) => c.id !== id));
  };

  const generateRandom = () => {
    const randomHex = () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    const fresh: PaletteColor[] = [
      { id: "1", hex: randomHex() },
      { id: "2", hex: randomHex() },
      { id: "3", hex: randomHex() },
      { id: "4", hex: randomHex() },
      { id: "5", hex: randomHex() },
    ];
    setColors(fresh);
  };

  const handleCopySummary = () => {
    if (!onInsertToNote || colors.length === 0) return;
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const swatches = colors
      .map((c) => `- 🎨 **\`${c.hex.toUpperCase()}\`**${c.name ? ` — *${c.name}*` : ""}`)
      .join("\n");

    const summary = `\n### 🎨 Color Palette Swatches
> *${colors.length} swatches • Captured on ${dateStr} at ${timeStr}*

${swatches}\n`;

    onInsertToNote(summary);
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 text-xs">
      {/* Top Swatch Preview Strip */}
      <div className="flex h-10 w-full overflow-hidden rounded-md border border-border shadow-2xs">
        {colors.map((c) => (
          <div
            key={c.id}
            onClick={() => copyHex(c)}
            style={{ backgroundColor: c.hex }}
            title={`Click to copy ${c.hex}`}
            className="flex-1 cursor-pointer transition-transform hover:scale-105"
          />
        ))}
      </div>

      {/* Color Hex Chips */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {colors.map((c) => (
          <div
            key={c.id}
            className="group flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 shadow-2xs"
          >
            <span
              className="h-3 w-3 rounded-full border border-black/10 dark:border-white/10 shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            <button
              onClick={() => copyHex(c)}
              className="font-mono text-2xs text-foreground hover:text-primary transition-colors flex items-center gap-1"
              title="Copy hex code"
            >
              <span>{c.hex}</span>
              {copiedId === c.id ? (
                <Check className="h-2.5 w-2.5 text-foreground" weight="bold" />
              ) : (
                <Copy className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            <button
              onClick={() => removeColor(c.id)}
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              title="Remove swatch"
              aria-label="Remove swatch"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Controls: Pick color & Generate */}
      <div className="flex items-center justify-between gap-2 mt-1 pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            title="Choose color"
          />
          <button
            onClick={addColor}
            className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-2xs font-medium hover:bg-muted/80 text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateRandom}
            className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground transition-colors"
            title="Generate random palette"
          >
            <Sparkles className="h-3 w-3 text-foreground" />
            Shuffle
          </button>

          {onInsertToNote && (
            <WidgetInsertButton
              onInsert={handleCopySummary}
              label="Insert to note"
              insertedLabel="Inserted to note!"
              variant="compact"
            />
          )}
        </div>
      </div>
    </div>
  );
};
