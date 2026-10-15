export type WidgetType =
  | "swap"
  | "ticker"
  | "calculator"
  | "timer"
  | "worldclock"
  | "unitconverter"
  | "counter"
  | "countdown"
  | "kanban"
  | "habits"
  | "palette"
  | "browser"
  | "scratchpad"
  | "meeting"
  | "bug"
  | "idea"
  | "api"
  | "reading"
  | "coderunner"
  | "devtools"
  | "spreadsheet"
  | "expenses"
  | "whiteboard"
  | "links";

export interface NoteWidgetData {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  isCollapsed?: boolean;
  config?: Record<string, any>;
  width?: number | string;
}
