/**
 * Simple, efficient offline line-level diff calculation using Longest Common Subsequence (LCS).
 */

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumA?: number;
  lineNumB?: number;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export function computeLineDiff(oldText: string, newText: string): { lines: DiffLine[]; stats: DiffStats } {
  // Normalize line endings
  const cleanOld = oldText.replace(/\r\n/g, "\n");
  const cleanNew = newText.replace(/\r\n/g, "\n");

  if (!cleanOld && !cleanNew) {
    return { lines: [], stats: { added: 0, removed: 0, unchanged: 0 } };
  }

  const a = cleanOld ? cleanOld.split("\n") : [];
  const b = cleanNew ? cleanNew.split("\n") : [];
  const m = a.length;
  const n = b.length;

  // Fast path: identical strings
  if (cleanOld === cleanNew) {
    const lines: DiffLine[] = a.map((line, idx) => ({
      type: "unchanged",
      text: line,
      lineNumA: idx + 1,
      lineNumB: idx + 1,
    }));
    return {
      lines,
      stats: { added: 0, removed: 0, unchanged: lines.length },
    };
  }

  // Fast path: old was empty
  if (m === 0) {
    const lines: DiffLine[] = b.map((line, idx) => ({
      type: "added",
      text: line,
      lineNumB: idx + 1,
    }));
    return { lines, stats: { added: lines.length, removed: 0, unchanged: 0 } };
  }

  // Fast path: new is empty
  if (n === 0) {
    const lines: DiffLine[] = a.map((line, idx) => ({
      type: "removed",
      text: line,
      lineNumA: idx + 1,
    }));
    return { lines, stats: { added: 0, removed: lines.length, unchanged: 0 } };
  }

  // Cap memory matrix if document is unusually gigantic (> 2000 lines)
  const maxCells = 2500000;
  if (m * n > maxCells) {
    // Truncated fallback diff
    const lines: DiffLine[] = [
      ...a.map((line, i) => ({ type: "removed" as const, text: line, lineNumA: i + 1 })),
      ...b.map((line, i) => ({ type: "added" as const, text: line, lineNumB: i + 1 })),
    ];
    return { lines, stats: { added: b.length, removed: a.length, unchanged: 0 } };
  }

  // Use typed arrays for memory efficiency
  const dp: Int32Array[] = [];
  for (let i = 0; i <= m; i++) {
    dp.push(new Int32Array(n + 1));
  }

  for (let i = 0; i < m; i++) {
    const aLine = a[i];
    for (let j = 0; j < n; j++) {
      if (aLine === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        const val1 = dp[i + 1][j];
        const val2 = dp[i][j + 1];
        dp[i + 1][j + 1] = val1 > val2 ? val1 : val2;
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = m;
  let j = n;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      diff.unshift({
        type: "unchanged",
        text: a[i - 1],
        lineNumA: i,
        lineNumB: j,
      });
      unchanged++;
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: "added",
        text: b[j - 1],
        lineNumB: j,
      });
      added++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({
        type: "removed",
        text: a[i - 1],
        lineNumA: i,
      });
      removed++;
      i--;
    }
  }

  return {
    lines: diff,
    stats: { added, removed, unchanged },
  };
}
