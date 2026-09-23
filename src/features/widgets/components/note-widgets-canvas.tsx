import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  Calculator as CalcIcon,
  Timer as TimerIcon,
  Globe,
  Ruler,
  Target,
  CalendarClock,
  MoveHorizontal,
  Check,
  Kanban,
  Sparkles,
  Palette,
  RotateCcw,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { NoteWidgetData, WidgetType } from "../types";
import { Swap } from "@/components/shared/swap";
import { TickerWidget } from "./ticker-widget";
import { CalculatorWidget } from "./calculator-widget";
import { TimerWidget } from "./timer-widget";
import { WorldClockWidget } from "./world-clock-widget";
import { UnitConverterWidget } from "./unit-converter-widget";
import { CounterWidget } from "./counter-widget";
import { CountdownWidget } from "./countdown-widget";
import { KanbanWidget } from "./kanban-widget";
import { HabitsWidget } from "./habits-widget";
import { PaletteWidget } from "./palette-widget";
import { BrowserWidget } from "./browser-widget";
import { cn } from "@/lib/utils/cn";

interface NoteWidgetsCanvasProps {
  widgets: NoteWidgetData[];
  noteId?: string;
  onUpdateWidgets: (widgets: NoteWidgetData[]) => void;
  onInsertToNote: (text: string) => void;
  className?: string;
}

const DEFAULT_WIDTHS: Record<WidgetType, number> = {
  swap: 320,
  ticker: 280,
  calculator: 250,
  timer: 260,
  worldclock: 270,
  unitconverter: 280,
  counter: 250,
  countdown: 280,
  kanban: 450,
  habits: 320,
  palette: 280,
  browser: 480,
};

const SIZE_PRESETS = [
  { label: "Compact", value: 260 },
  { label: "Standard", value: 320 },
  { label: "Wide", value: 440 },
  { label: "Full Width", value: "100%" },
] as const;

export const NoteWidgetsCanvas: React.FC<NoteWidgetsCanvasProps> = ({
  widgets,
  noteId = "",
  onUpdateWidgets,
  onInsertToNote,
  className,
}) => {
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [liveWidths, setLiveWidths] = useState<Record<string, number | string>>({});

  if (widgets.length === 0) return null;

  const allCollapsed = widgets.every((w) => w.isCollapsed);

  const handleToggleAllCollapse = () => {
    const next = !allCollapsed;
    onUpdateWidgets(widgets.map((w) => ({ ...w, isCollapsed: next })));
  };

  const handleRemoveWidget = (id: string) => {
    onUpdateWidgets(widgets.filter((w) => w.id !== id));
  };

  const handleToggleCollapse = (id: string) => {
    onUpdateWidgets(
      widgets.map((w) =>
        w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w
      )
    );
  };

  const handleSetSize = (id: string, width: number | string) => {
    setLiveWidths((prev) => ({ ...prev, [id]: width }));
    onUpdateWidgets(
      widgets.map((w) => (w.id === id ? { ...w, width } : w))
    );
  };

  const handleStartResize = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingId(id);

    const startX = e.clientX;
    const currentWidget = widgets.find((w) => w.id === id);
    const initialWidth =
      liveWidths[id] ??
      (typeof currentWidget?.width === "number"
        ? currentWidget.width
        : currentWidget?.width === "100%"
        ? (e.currentTarget.parentElement?.offsetWidth ?? 320)
        : DEFAULT_WIDTHS[currentWidget?.type ?? "swap"]);

    const startW = typeof initialWidth === "number" ? initialWidth : 320;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(240, Math.min(800, Math.round(startW + delta)));
      setLiveWidths((prev) => ({ ...prev, [id]: nextWidth }));
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setResizingId(null);
      const delta = upEvent.clientX - startX;
      const finalWidth = Math.max(240, Math.min(800, Math.round(startW + delta)));
      onUpdateWidgets(
        widgets.map((w) => (w.id === id ? { ...w, width: finalWidth } : w))
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMoveWidget = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= widgets.length) return;
    const reordered = [...widgets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onUpdateWidgets(reordered);
  };

  const getWidgetIcon = (type: NoteWidgetData["type"]) => {
    switch (type) {
      case "swap":
        return <ArrowUpDown className="h-3.5 w-3.5 text-emerald-500" />;
      case "ticker":
        return <TrendingUp className="h-3.5 w-3.5 text-blue-500" />;
      case "calculator":
        return <CalcIcon className="h-3.5 w-3.5 text-amber-500" />;
      case "timer":
        return <TimerIcon className="h-3.5 w-3.5 text-rose-500" />;
      case "worldclock":
        return <Globe className="h-3.5 w-3.5 text-cyan-500" />;
      case "unitconverter":
        return <Ruler className="h-3.5 w-3.5 text-indigo-500" />;
      case "counter":
        return <Target className="h-3.5 w-3.5 text-purple-500" />;
      case "countdown":
        return <CalendarClock className="h-3.5 w-3.5 text-orange-500" />;
      case "kanban":
        return <Kanban className="h-3.5 w-3.5 text-blue-500" />;
      case "habits":
        return <Sparkles className="h-3.5 w-3.5 text-emerald-500" />;
      case "palette":
        return <Palette className="h-3.5 w-3.5 text-pink-500" />;
      case "browser":
        return <Globe className="h-3.5 w-3.5 text-cyan-500" />;
    }
  };

  return (
    <div
      className={cn(
        "w-full mb-3 select-none transition-all",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-1 pb-1.5 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60 border-b border-border/30 mb-2.5">
        <span>Attached Widgets ({widgets.length})</span>
        <button
          type="button"
          onClick={handleToggleAllCollapse}
          className="text-2xs font-normal normal-case text-muted-foreground hover:text-foreground transition-colors hover:underline"
        >
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
      </div>

      {/* Widgets Flow Shelf - each widget is ONE clean unified window card */}
      <div className="flex flex-wrap items-start gap-3">
        {widgets.map((widget, index) => {
          const currentWidth =
            liveWidths[widget.id] ??
            widget.width ??
            DEFAULT_WIDTHS[widget.type];

          const widthStyle =
            typeof currentWidth === "number" ? `${currentWidth}px` : currentWidth;

          return (
            <ContextMenu key={widget.id}>
              <ContextMenuTrigger asChild>
                <motion.div
                  layout
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
              style={{
                width: widthStyle,
                minWidth: widget.isCollapsed ? "180px" : "250px",
                maxWidth: "100%",
              }}
              className={cn(
                "relative flex flex-col rounded-2xl shadow-sm border border-border/80 bg-card overflow-hidden",
                resizingId === widget.id ? "select-none ring-1 ring-primary/40" : ""
              )}
            >
              {/* Widget Card Header */}
              <div className="flex items-center justify-between px-3 h-8 bg-muted/30 border-b border-border/40 text-xs text-muted-foreground select-none gap-2">
                <div className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                  {getWidgetIcon(widget.type)}
                  <span className="text-[11px] truncate max-w-[140px]">
                    {widget.title}
                  </span>
                  {widget.type === "swap" && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal ml-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span>Live rates</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {widgets.length > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveWidget(index, index - 1)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        title="Move left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === widgets.length - 1}
                        onClick={() => handleMoveWidget(index, index + 1)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        title="Move right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </>
                  )}

                  {/* Premium Size Presets Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Resize widget (Compact, Standard, Wide, Full)"
                      >
                        <MoveHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                        Widget Size
                      </div>
                      {SIZE_PRESETS.map((p) => {
                        const isActive =
                          (typeof p.value === "string" && currentWidth === p.value) ||
                          (typeof p.value === "number" &&
                            typeof currentWidth === "number" &&
                            Math.abs(currentWidth - p.value) < 20);
                        return (
                          <DropdownMenuItem
                            key={p.label}
                            onClick={() => handleSetSize(widget.id, p.value)}
                            className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                          >
                            <span>{p.label}</span>
                            {isActive && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(widget.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={widget.isCollapsed ? "Expand widget" : "Collapse widget"}
                  >
                    {widget.isCollapsed ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove widget from note"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Interactive Drag-to-Resize Right Handle */}
              <div
                onMouseDown={(e) => handleStartResize(widget.id, e)}
                onDoubleClick={() => handleSetSize(widget.id, DEFAULT_WIDTHS[widget.type])}
                className={cn(
                  "absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-20 group flex items-center justify-center select-none",
                  resizingId === widget.id ? "bg-primary/30" : ""
                )}
                title="Drag to resize widget (double-click to reset)"
              >
                <div className="w-0.5 h-6 bg-border/80 group-hover:bg-primary rounded-full transition-colors" />
              </div>

              {/* Widget Content (Collapsible) */}
              {!widget.isCollapsed && (
                <div className="p-0">
                  {widget.type === "swap" && (
                    <Swap
                      embedded
                      initialPayAmount={widget.config?.amount || "1.5"}
                      initialFromCurrency={widget.config?.fromCurrency || "ETH"}
                      initialToCurrency={widget.config?.toCurrency || "USDC"}
                      onSuccess={(details) => {
                        const time = new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const dateStr = new Date().toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });
                        const formattedTo =
                          details.toAmount >= 1
                            ? details.toAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })
                            : details.toAmount.toPrecision(4);
                        const formattedRate =
                          details.rate >= 1
                            ? details.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })
                            : details.rate < 0.0001
                            ? details.rate.toPrecision(4)
                            : details.rate.toFixed(6);
                        const receipt = `\n### 💱 Currency Swap Receipt
> *Executed on ${dateStr} at ${time}*

- **Sold**: **\`${details.fromAmount.toLocaleString("en-US")} ${details.fromToken}\`**
- **Received**: **\`${formattedTo} ${details.toToken}\`**
- **Exchange Rate**: \`1 ${details.fromToken} = ${formattedRate} ${details.toToken}\`\n`;
                        onInsertToNote(receipt);
                      }}
                    />
                  )}

                  {widget.type === "ticker" && (
                    <TickerWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "calculator" && (
                    <CalculatorWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "timer" && (
                    <TimerWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "worldclock" && (
                    <WorldClockWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "unitconverter" && (
                    <UnitConverterWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "counter" && (
                    <CounterWidget
                      onInsertToNote={onInsertToNote}
                      className="border-0 shadow-none bg-transparent rounded-none p-2 w-full"
                    />
                  )}

                  {widget.type === "countdown" && (
                    <CountdownWidget
                      config={widget.config}
                      onConfigChange={(cfg) => {
                        onUpdateWidgets(
                          widgets.map((w) =>
                            w.id === widget.id ? { ...w, config: cfg } : w
                          )
                        );
                      }}
                      onInsertToNote={onInsertToNote}
                      className="w-full"
                    />
                  )}

                  {widget.type === "kanban" && (
                    <KanbanWidget
                      onInsertToNote={onInsertToNote}
                    />
                  )}

                  {widget.type === "habits" && (
                    <HabitsWidget
                      onInsertToNote={onInsertToNote}
                    />
                  )}

                  {widget.type === "palette" && (
                    <PaletteWidget
                      onInsertToNote={onInsertToNote}
                    />
                  )}

                  {widget.type === "browser" && (
                    <BrowserWidget
                      widget={widget}
                      noteId={noteId}
                      onUpdateWidget={(patch) => {
                        onUpdateWidgets(
                          widgets.map((w) =>
                            w.id === widget.id ? { ...w, ...patch } : w
                          )
                        );
                      }}
                      onInsertToNote={onInsertToNote}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-52">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 text-[11px] font-semibold text-foreground truncate select-none">
              {getWidgetIcon(widget.type)}
              <span className="truncate">{widget.title}</span>
            </div>

            <ContextMenuItem onClick={() => handleToggleCollapse(widget.id)}>
              {widget.isCollapsed ? (
                <>
                  <ChevronDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Expand widget</span>
                </>
              ) : (
                <>
                  <ChevronUp className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Collapse widget</span>
                </>
              )}
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <MoveHorizontal className="mr-2 h-3.5 w-3.5 text-primary" />
                <span>Widget Size</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Size Presets
                </div>
                {SIZE_PRESETS.map((p) => {
                  const isActive =
                    (typeof p.value === "string" && currentWidth === p.value) ||
                    (typeof p.value === "number" &&
                      typeof currentWidth === "number" &&
                      Math.abs(currentWidth - p.value) < 20);
                  return (
                    <ContextMenuItem
                      key={p.label}
                      onClick={() => handleSetSize(widget.id, p.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{p.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 stroke-[2.5] text-primary" />}
                    </ContextMenuItem>
                  );
                })}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleSetSize(widget.id, DEFAULT_WIDTHS[widget.type])}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Reset Default</span>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            {widgets.length > 1 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <ArrowLeftRight className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Move Widget</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-36">
                  <ContextMenuItem
                    disabled={index === 0}
                    onClick={() => handleMoveWidget(index, index - 1)}
                  >
                    <ChevronLeft className="mr-2 h-3.5 w-3.5" />
                    <span>Move Left</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={index === widgets.length - 1}
                    onClick={() => handleMoveWidget(index, index + 1)}
                  >
                    <ChevronRight className="mr-2 h-3.5 w-3.5" />
                    <span>Move Right</span>
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={() => handleRemoveWidget(widget.id)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span>Remove from note</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
        })}
      </div>
    </div>
  );
};
