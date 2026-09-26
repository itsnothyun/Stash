import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { WidgetNodeView } from "@/features/widgets/components/widget-node-view";
import { WIDGET_NODE_TYPE, WidgetWrapSide } from "../stash-content";

export interface StashWidgetOptions {
  noteId: string;
  onInsertToNote: (text: string) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    stashWidget: {
      insertWidget: (attrs: {
        widgetId: string;
        widgetType: string;
        title: string;
        config?: Record<string, any> | null;
        width?: number | string | null;
        side?: WidgetWrapSide;
      }) => ReturnType;
    };
  }
}

/**
 * A widget (calculator, kanban board, timer, ...) embedded directly in the
 * note's content instead of a separate shelf above it. `atom` because its
 * insides are a React component, not editable ProseMirror content; `draggable`
 * gets native drag-to-reposition for free.
 */
export const StashWidget = Node.create<StashWidgetOptions>({
  name: WIDGET_NODE_TYPE,
  group: "block",
  atom: true,
  draggable: true,
  isolating: true,
  // Without this, clicking or arrow-keying next to the widget can leave it
  // as a ProseMirror node selection — and typing while a node is selected
  // replaces it, which reads as "typing deletes the widget."
  selectable: false,

  addOptions() {
    return {
      noteId: "",
      onInsertToNote: () => {},
    };
  },

  addAttributes() {
    return {
      widgetId: { default: null },
      widgetType: { default: null },
      title: { default: "" },
      config: { default: null },
      isCollapsed: { default: false },
      width: { default: null },
      side: { default: "none" },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${WIDGET_NODE_TYPE}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": WIDGET_NODE_TYPE })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WidgetNodeView, {
      // Without this, clicking a button/input inside the widget can leave
      // ProseMirror's selection as a NodeSelection on the whole atom — so a
      // later insertContent() (e.g. adding another widget) replaces this one
      // instead of leaving it alone. Drag events still pass through so the
      // grip handle keeps native reposition-by-drag working.
      stopEvent: ({ event }) => !event.type.startsWith("drag") && event.type !== "drop",
    });
  },

  addCommands() {
    return {
      insertWidget:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              isCollapsed: false,
              config: null,
              width: null,
              side: "none",
              ...attrs,
            },
          });
        },
    };
  },
});
