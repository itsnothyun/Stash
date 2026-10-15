import { describe, it, expect } from "vitest";
import {
  computeReadingStats,
  extractHeuristicSummary,
  extractHeuristicActionItems,
  extractHeuristicTags,
} from "./note-ai";

describe("Local AI & Heuristic Intelligence Suite", () => {
  const sampleNote = `
# Engineering Sprint Kickoff

We met today with the core engineering group to finalize our v0.2.0 release roadmap.
The primary goal is delivering high-performance offline search and desktop window shade roll-ups.
We must optimize SQLite queries and ensure Write-Ahead Logging is durable.
Ensure to verify all end-to-end tests before building release artifacts.

TODO: Review PR #142 for the floating window shade.
Action item: Update documentation for keyboard shortcuts.
Should verify the memory usage when multiple notes are unshaded.
`;

  it("computes accurate reading stats and complexity", () => {
    const stats = computeReadingStats(sampleNote);
    expect(stats.words).toBeGreaterThan(50);
    expect(stats.characters).toBeGreaterThan(200);
    expect(stats.readingTimeMinutes).toBeGreaterThan(0);
    expect(stats.estimatedGradeLevel).toBeDefined();
  });

  it("extracts meaningful summary points using word prominence", () => {
    const summary = extractHeuristicSummary(sampleNote, 2);
    expect(summary.length).toBeGreaterThanOrEqual(1);
    expect(summary.length).toBeLessThanOrEqual(2);
    // At least one sentence mentions core topics
    const joined = summary.join(" ").toLowerCase();
    expect(joined.includes("engineering") || joined.includes("sqlite") || joined.includes("release")).toBe(true);
  });

  it("identifies imperative action items and tasks", () => {
    const actions = extractHeuristicActionItems(sampleNote);
    expect(actions.length).toBeGreaterThanOrEqual(2);

    const texts = actions.map((a) => a.text.toLowerCase());
    expect(texts.some((t) => t.includes("review pr #142"))).toBe(true);
    expect(texts.some((t) => t.includes("update documentation"))).toBe(true);
  });

  it("recommends relevant keyword tags", () => {
    const tags = extractHeuristicTags(sampleNote, 4);
    expect(tags).toHaveLength(4);
    for (const tag of tags) {
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("strips checklist markers from summary points", () => {
    const text =
      "- [x] Press Cmd/Ctrl+Shift+N to stash a thought anywhere\n- [ ] Pin floating stashes above your desktop";
    const points = extractHeuristicSummary(text, 4);
    expect(points).toEqual([
      "Press Cmd/Ctrl+Shift+N to stash a thought anywhere",
      "Pin floating stashes above your desktop",
    ]);
  });
});
