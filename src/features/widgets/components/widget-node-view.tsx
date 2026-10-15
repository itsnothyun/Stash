import React, { useRef, useState } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import {
  X,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  ArrowsLeftRight as MoveHorizontal,
  Check,
  ArrowCounterClockwise as RotateCcw,
  DotsSixVertical as GripIcon,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { WidgetType } from "../types";
import { WidgetWrapSide } from "@/features/editor/stash-content";
import { useUIStore } from "@/stores/ui-store";
import { getWidgetIcon, DEFAULT_WIDTHS, SIZE_PRESETS } from "../widget-meta";
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
import { ScratchpadWidget } from "./scratchpad-widget";
import { MeetingWidget } from "./meeting-widget";
import { BugWidget } from "./bug-widget";
import { IdeaWidget } from "./idea-widget";
import { ApiWidget } from "./api-widget";
import { ReadingWidget } from "./reading-widget";
import { CodeRunnerWidget } from "./code-runner-widget";
import { DevToolsWidget } from "./dev-tools-widget";
import { SpreadsheetWidget } from "./spreadsheet-widget";
import { ExpensesWidget } from "./expenses-widget";
import { WhiteboardWidget } from "./whiteboard-widget";
import { LinksWidget } from "./links-widget";
import { cn } from "@/lib/utils/cn";

/**
 * Renders one widget node inline in the note. `side` drives a CSS float so
 * paragraph text wraps around it; the grip handle uses ProseMirror's native
 * atom-node dragging (no custom drag math) to move it to a new spot in the doc.
 */
export const WidgetNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  extension,
  selected,
}) => {
  const attrs = node.attrs as {
    widgetId: string;
    widgetType: WidgetType;
    title: string;
    config: Record<string, any> | null;
    isCollapsed: boolean;
    width: number | string | null;
    side: WidgetWrapSide;
  };
  const { noteId, onInsertToNote } = extension.options as {
    noteId: string;
    onInsertToNote: (text: string) => void;
  };

  const [resizing, setResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const iconSet = useUIStore((s) => s.iconSet);
  const isColorful = iconSet === "colorful";

  const currentWidth = liveWidth ?? attrs.width ?? DEFAULT_WIDTHS[attrs.widgetType];
  const widthStyle = typeof currentWidth === "number" ? `${currentWidth}px` : currentWidth;
  const isFloated = attrs.side === "left" || attrs.side === "right";

  const handleStartResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);

    const startX = e.clientX;
    const startW =
      typeof currentWidth === "number"
        ? currentWidth
        : cardRef.current?.offsetWidth ?? 320;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLiveWidth(Math.max(200, Math.min(800, Math.round(startW + delta))));
    };
    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setResizing(false);
      const delta = upEvent.clientX - startX;
      const finalWidth = Math.max(200, Math.min(800, Math.round(startW + delta)));
      setLiveWidth(null);
      updateAttributes({ width: finalWidth });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const onUpdateWidget = (patch: Record<string, any>) => {
    const { id, type, ...rest } = patch;
    updateAttributes(rest);
  };

  const widgetDataShim = {
    id: attrs.widgetId,
    type: attrs.widgetType,
    title: attrs.title,
    x: 0,
    y: 0,
    isCollapsed: attrs.isCollapsed,
    config: attrs.config ?? undefined,
    width: attrs.width ?? undefined,
  };

  return (
    <NodeViewWrapper
      as="div"
      data-widget-wrap={attrs.side}
      className={cn(
        "not-prose my-2 align-top",
        isFloated ? "max-w-[70%]" : "block w-full clear-both"
      )}
      style={{
        float: isFloated ? attrs.side : undefined,
        marginLeft: attrs.side === "right" ? "1rem" : undefined,
        marginRight: attrs.side === "left" ? "1rem" : undefined,
      }}
    >
      <div
        ref={cardRef}
        style={{ width: widthStyle, minWidth: attrs.isCollapsed ? "180px" : "250px", maxWidth: "100%" }}
        className={cn(
          "relative flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden transition-shadow duration-200",
          selected ? "border-primary/60 ring-1 ring-primary/40" : "border-border/80",
          resizing ? "select-none ring-1 ring-primary/40" : ""
        )}
      >
        {/* Widget Card Header */}
        <div className="flex items-center justify-between px-2 h-8 bg-muted/30 border-b border-border/40 text-xs text-muted-foreground select-none gap-1">
          <div className="flex items-center gap-1 font-medium text-foreground min-w-0">
            <span
              data-drag-handle
              className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
              title="Drag to move"
            >
              <GripIcon className="h-3.5 w-3.5" />
            </span>
            {getWidgetIcon(attrs.widgetType, isColorful)}
            <span className="text-[11px] truncate max-w-[130px]">{attrs.title}</span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Resize widget"
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
                      onClick={() => updateAttributes({ width: p.value })}
                      className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                    >
                      <span>{p.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-foreground" weight="bold" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem
                  onClick={() => updateAttributes({ width: DEFAULT_WIDTHS[attrs.widgetType] })}
                  className="text-xs cursor-pointer"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Reset Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => updateAttributes({ isCollapsed: !attrs.isCollapsed })}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={attrs.isCollapsed ? "Expand widget" : "Collapse widget"}
            >
              {attrs.isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove widget from note"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Drag-to-resize right handle */}
        <div
          onMouseDown={handleStartResize}
          onDoubleClick={() => updateAttributes({ width: DEFAULT_WIDTHS[attrs.widgetType] })}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-20 group flex items-center justify-center select-none",
            resizing ? "bg-primary/30" : ""
          )}
          title="Drag to resize widget (double-click to reset)"
        >
          <div className="w-0.5 h-6 bg-border/80 group-hover:bg-primary rounded-full transition-colors" />
        </div>

        {/* Widget Content */}
        {!attrs.isCollapsed && (
          <div className="p-0">
            {attrs.widgetType === "swap" && (
              <Swap
                embedded
                initialPayAmount={attrs.config?.amount || "1.5"}
                initialFromCurrency={attrs.config?.fromCurrency || "ETH"}
                initialToCurrency={attrs.config?.toCurrency || "USDC"}
                onSuccess={(details) => {
                  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const dateStr = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
                  const receipt = `\n### \u{1F4B1} Currency Swap Receipt
> *Executed on ${dateStr} at ${time}*

- **Sold**: **\`${details.fromAmount.toLocaleString("en-US")} ${details.fromToken}\`**
- **Received**: **\`${formattedTo} ${details.toToken}\`**
- **Exchange Rate**: \`1 ${details.fromToken} = ${formattedRate} ${details.toToken}\`\n`;
                  onInsertToNote(receipt);
                }}
              />
            )}
            {attrs.widgetType === "ticker" && (
              <TickerWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "calculator" && (
              <CalculatorWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "timer" && (
              <TimerWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "worldclock" && (
              <WorldClockWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "unitconverter" && (
              <UnitConverterWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "counter" && (
              <CounterWidget onInsertToNote={onInsertToNote} className="border-0 shadow-none bg-transparent rounded-none p-2 w-full" />
            )}
            {attrs.widgetType === "countdown" && (
              <CountdownWidget
                config={attrs.config ?? undefined}
                onConfigChange={(cfg) => updateAttributes({ config: cfg })}
                onInsertToNote={onInsertToNote}
                className="w-full"
              />
            )}
            {attrs.widgetType === "kanban" && <KanbanWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "habits" && <HabitsWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "palette" && <PaletteWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "browser" && (
              <BrowserWidget
                widget={widgetDataShim as any}
                noteId={noteId}
                onUpdateWidget={onUpdateWidget}
                onInsertToNote={onInsertToNote}
              />
            )}
            {attrs.widgetType === "scratchpad" && <ScratchpadWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "meeting" && <MeetingWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "bug" && <BugWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "idea" && <IdeaWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "api" && <ApiWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "reading" && <ReadingWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "coderunner" && <CodeRunnerWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "devtools" && <DevToolsWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "spreadsheet" && <SpreadsheetWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "expenses" && <ExpensesWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "whiteboard" && <WhiteboardWidget onInsertToNote={onInsertToNote} />}
            {attrs.widgetType === "links" && (
              <LinksWidget
                config={attrs.config ?? undefined}
                onConfigChange={(cfg) => updateAttributes({ config: cfg })}
                onInsertToNote={onInsertToNote}
              />
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
