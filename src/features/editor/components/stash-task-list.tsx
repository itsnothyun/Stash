import React, { useState, useEffect } from "react";
import TaskList from "@tiptap/extension-task-list";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Plus, ListTodo } from "lucide-react";

/**
 * The checklist inside a stash. Tasks stay normal Tiptap `taskItem` nodes, so
 * search, cards, and the To-dos section keep reading the same document. This
 * view adds list chrome: an editable title, a progress bar, and a way to append a row.
 */
const TaskListView: React.FC<ReactNodeViewProps> = ({
  node,
  editor,
  getPos,
  updateAttributes,
}) => {
  const nodeTitle = (node.attrs?.title as string) || "";
  const [localTitle, setLocalTitle] = useState(nodeTitle);

  useEffect(() => {
    setLocalTitle(node.attrs?.title || "");
  }, [node.attrs?.title]);

  const handleTitleChange = (val: string) => {
    setLocalTitle(val);
    updateAttributes({ title: val });
  };

  let total = 0;
  let done = 0;
  node.forEach((child) => {
    if (child.type.name !== "taskItem") return;
    total += 1;
    if (child.attrs.checked) done += 1;
  });
  const ratio = total === 0 ? 0 : done / total;
  const isCompleted = ratio === 1 && total > 0;

  const addTask = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: "taskItem",
        attrs: { checked: false },
        content: [{ type: "paragraph" }],
      })
      .run();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      if (total === 0) {
        addTask();
      } else {
        editor.commands.focus();
      }
    }
  };

  return (
    <NodeViewWrapper className="stash-checklist">
      <div className="stash-checklist-chrome" contentEditable={false}>
        {/* Title Header (on top of progress bar) */}
        <div className="stash-checklist-header">
          <div className="stash-checklist-title-wrap">
            <ListTodo className="stash-checklist-icon" />
            <input
              type="text"
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Checklist title..."
              className="stash-checklist-title-input"
            />
          </div>
          <span className="stash-checklist-count">
            {total === 0 ? "No tasks" : isCompleted ? "Completed 🎉" : `${done}/${total}`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="stash-checklist-progress">
          <div className="stash-checklist-track">
            <div
              className={`stash-checklist-fill ${isCompleted ? "stash-checklist-fill-done" : ""}`}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <span className="stash-checklist-percentage">
            {Math.round(ratio * 100)}%
          </span>
        </div>
      </div>
      <NodeViewContent as="ul" data-type="taskList" />
      <button
        type="button"
        className="stash-checklist-add"
        contentEditable={false}
        onMouseDown={(event) => event.preventDefault()}
        onClick={addTask}
      >
        <Plus className="h-3.5 w-3.5" />
        Add a task
      </button>
    </NodeViewWrapper>
  );
};

export const StashTaskList = TaskList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title") || "",
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            "data-title": attributes.title,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(TaskListView);
  },
});
