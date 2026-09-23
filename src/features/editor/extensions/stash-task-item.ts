import TaskItem from "@tiptap/extension-task-item";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Pressing Enter on an empty last task leaves the checklist and continues
 * the note underneath it. A task with text still splits into another row.
 */
export const StashTaskItem = TaskItem.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Enter: () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;
        const item = $from.node(-1);
        const list = $from.node(-2);
        const emptyRow =
          empty &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0 &&
          item?.type.name === this.name &&
          list?.type.name === "taskList" &&
          item.textContent.length === 0 &&
          $from.index(-2) === list.childCount - 1;

        if (!emptyRow) {
          return this.editor.commands.splitListItem(this.name);
        }

        return this.editor.commands.command(({ tr, dispatch }) => {
          const itemPos = $from.before(-1);
          const listPos = $from.before(-2);
          if (dispatch) {
            tr.delete(itemPos, itemPos + item.nodeSize);
            const mapped = tr.mapping.map(listPos);
            const mappedList = tr.doc.nodeAt(mapped);
            let insertAt = mapped;
            if (mappedList?.type.name === "taskList") {
              if (mappedList.childCount === 0) {
                tr.delete(mapped, mapped + mappedList.nodeSize);
                insertAt = mapped;
              } else {
                insertAt = mapped + mappedList.nodeSize;
              }
            }
            const paragraph = state.schema.nodes.paragraph.create();
            tr.insert(insertAt, paragraph);
            tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 1)));
            tr.scrollIntoView();
          }
          return true;
        });
      },
    };
  },
});

/**
 * A click on the page outside a checklist should land in the note, not in
 * the last task. Creates a paragraph before or after the block when needed.
 */
export function focusOutsideChecklist(
  view: EditorView,
  clientX: number,
  clientY: number
): boolean {
  const root = view.dom;
  const lists = [...root.querySelectorAll<HTMLElement>(".stash-checklist")];
  if (lists.length === 0) return false;

  for (const el of lists) {
    const rect = el.getBoundingClientRect();
    const inside =
      clientY >= rect.top &&
      clientY <= rect.bottom &&
      clientX >= rect.left &&
      clientX <= rect.right;
    if (inside) return false;
  }

  let target: HTMLElement | null = null;
  let after = true;
  for (const el of lists) {
    const rect = el.getBoundingClientRect();
    if (clientY < rect.top) {
      target = el;
      after = false;
      break;
    }
    target = el;
    after = true;
  }
  if (!target) return false;

  const pos = view.posAtDOM(target, 0);
  if (pos < 0) return false;
  const $pos = view.state.doc.resolve(pos);
  let depth = $pos.depth;
  while (depth > 0 && $pos.node(depth).type.name !== "taskList") depth -= 1;
  if (depth === 0) return false;

  const start = $pos.before(depth);
  const listNode = $pos.node(depth);
  const { schema, doc } = view.state;

  const selectAt = (at: number) => {
    const tr = view.state.tr.setSelection(TextSelection.near(doc.resolve(at)));
    view.dispatch(tr.scrollIntoView());
    view.focus();
  };

  if (after) {
    const next = doc.nodeAt(start + listNode.nodeSize);
    if (next?.type.name === "paragraph") {
      selectAt(start + listNode.nodeSize + 1);
      return true;
    }
  } else if ($pos.index(depth - 1) > 0) {
    const parent = $pos.node(depth - 1);
    const index = $pos.index(depth - 1);
    const prev = parent.child(index - 1);
    if (prev.type.name === "paragraph") {
      selectAt(start - prev.nodeSize + 1);
      return true;
    }
  }

  const insertAt = after ? start + listNode.nodeSize : start;
  const paragraph = schema.nodes.paragraph.create();
  const tr = view.state.tr.insert(insertAt, paragraph);
  tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 1)));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}
