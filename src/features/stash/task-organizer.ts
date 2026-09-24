/**
 * Helper to organize and clean checklist tasks inside a note
 */

export interface OrganizeTasksResult {
  hasTasks: boolean;
  completedCount: number;
  pendingCount: number;
  updatedText: string;
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

    const isPending = /^([-*]\s*)?\[\s*\]\s+/.test(trimmed);
    const isCompleted = /^([-*]\s*)?\[[xX]\]\s+/.test(trimmed);

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
    parts.push(`### ✅ Completed\n` + completedTasks.join("\n"));
  }

  const updatedText = parts.filter(Boolean).join("\n\n");

  return {
    hasTasks: true,
    completedCount: completedTasks.length,
    pendingCount: pendingTasks.length,
    updatedText,
  };
}
