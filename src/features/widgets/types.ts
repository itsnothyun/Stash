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
  | "browser";

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
