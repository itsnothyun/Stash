import type { Editor } from "@tiptap/core";
import { WIDGET_NODE_TYPE, StashWidgetAttrs } from "./stash-content";

/**
 * Widgets can sit anywhere in the doc now, so updating "the swap widget"
 * means finding it by `widgetId` first — there's no separate array to index
 * into anymore.
 */
export function updateWidgetNodeInEditor(
  editor: Editor,
  widgetId: string,
  patch: Partial<StashWidgetAttrs>
): boolean {
  const { state } = editor;
  let targetPos: number | null = null;

  state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false;
    if (node.type.name === WIDGET_NODE_TYPE && node.attrs.widgetId === widgetId) {
      targetPos = pos;
      return false;
    }
    return true;
  });

  if (targetPos === null) return false;
  const node = state.doc.nodeAt(targetPos);
  if (!node) return false;

  const tr = state.tr.setNodeMarkup(targetPos, undefined, { ...node.attrs, ...patch });
  editor.view.dispatch(tr);
  return true;
}
