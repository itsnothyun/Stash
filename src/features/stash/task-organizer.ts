/**
 * Helper to organize and clean checklist tasks inside a note
 */

export interface OrganizeTasksResult {
  hasTasks: boolean;
  completedCount: number;
  pendingCount: number;
  updatedText: string;
}

export interface OrganizeDocTasksResult {
  hasTasks: boolean;
  completedCount: number;
  pendingCount: number;
  updatedDoc: any;
}

/**
 * Re-orders task items in a Tiptap AST document so active tasks are first,
 * and checked tasks are grouped at the bottom of the list.
 */
export function organizeDocTasks(doc: any): OrganizeDocTasksResult {
  if (!doc || typeof doc !== "object") {
    return { hasTasks: false, completedCount: 0, pendingCount: 0, updatedDoc: doc };
  }

  let hasTasks = false;
  let completedCount = 0;
  let pendingCount = 0;

  const processNode = (node: any): any => {
    if (!node || typeof node !== "object") return node;

    if (node.type === "taskList" && Array.isArray(node.content)) {
      hasTasks = true;
      const pending: any[] = [];
      const completed: any[] = [];

      for (const item of node.content) {
        if (item.attrs?.checked === true) {
          completed.push(item);
          completedCount++;
        } else {
          pending.push(item);
          pendingCount++;
        }
      }

      return {
        ...node,
        content: [...pending, ...completed],
      };
    }

    if (Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(processNode),
      };
    }

    return node;
  };

  const updatedDoc = processNode(doc);

  return {
    hasTasks,
    completedCount,
    pendingCount,
    updatedDoc,
  };
}

/**
 * Re-orders checklist items in plain text so all active items (- [ ]) come first,
 * and all completed items (- [x]) are grouped at the bottom.
 */
export function organizeChecklist(text: string): OrganizeTasksResult {
  const lines = text.split("\n");
  const pendingTasks: string[] = [];
  const completedTasks: string[] = [];
  const otherLines: { index: number; line: string }[] = [];

  let firstTaskLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    const isPending = /^([-*+]|\d+\.)?\s*\[\s*\]\s+/.test(trimmed);
    const isCompleted = /^([-*+]|\d+\.)?\s*\[[xX]\]\s+/.test(trimmed);

    if (isPending) {
      if (firstTaskLineIndex === -1) firstTaskLineIndex = i;
      pendingTasks.push(raw);
    } else if (isCompleted) {
      if (firstTaskLineIndex === -1) firstTaskLineIndex = i;
      completedTasks.push(raw);
    } else {
      otherLines.push({ index: i, line: raw });
    }
  }

  const hasTasks = pendingTasks.length > 0 || completedTasks.length > 0;

  if (!hasTasks || completedTasks.length === 0) {
    return {
      hasTasks,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      updatedText: text,
    };
  }

  // Construct new document: keep non-task lines before first task, place pending tasks,
  // then other content, then completed tasks section
  const linesBefore: string[] = [];
  const linesAfter: string[] = [];

  for (const item of otherLines) {
    if (item.index < firstTaskLineIndex) {
      linesBefore.push(item.line);
    } else {
      linesAfter.push(item.line);
    }
  }

  const parts: string[] = [];

  if (linesBefore.length > 0) {
    parts.push(linesBefore.join("\n").trimEnd());
  }

  if (pendingTasks.length > 0) {
    parts.push(pendingTasks.join("\n"));
  }

  const remainingAfter = linesAfter.join("\n").trim();
  if (remainingAfter.length > 0) {
    parts.push(remainingAfter);
  }

  if (completedTasks.length > 0) {
    parts.push(completedTasks.join("\n"));
  }

  const updatedText = parts.filter(Boolean).join("\n\n");

  return {
    hasTasks: true,
    completedCount: completedTasks.length,
    pendingCount: pendingTasks.length,
    updatedText,
  };
}
