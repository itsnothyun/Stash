import { describe, it, expect } from "vitest";
import { buildKnowledgeGraph, simulateGraphStep } from "./knowledge-graph";
import { Note } from "./types/note";

describe("Knowledge Graph Constellation", () => {
  const sampleNotes: Note[] = [
    {
      id: "n-architecture",
      title: "Architecture Guide",
      color: "Sky",
      contentJson: "{}",
      plainText: "Check the [[Database Schema]] and [[API Spec]] for details.",
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      sortIndex: 0,
      version: 1,
      tags: [{ id: "t1", name: "engineering", color: undefined, createdAt: "" }],
    },
    {
      id: "n-database",
      title: "Database Schema",
      color: "Mint",
      contentJson: "{}",
      plainText: "Built with SQLite WAL and FTS5. Related to [[Architecture Guide]].",
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      sortIndex: 1,
      version: 1,
      tags: [{ id: "t1", name: "engineering", color: undefined, createdAt: "" }],
    },
    {
      id: "n-api",
      title: "API Spec",
      color: "Lavender",
      contentJson: "{}",
      plainText: "IPC commands and cross-window events.",
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      sortIndex: 2,
      version: 1,
      tags: [{ id: "t1", name: "engineering", color: undefined, createdAt: "" }],
    },
    {
      id: "n-isolated",
      title: "Random Grocery Note",
      color: "Lemon",
      contentJson: "{}",
      plainText: "Milk, eggs, sourdough bread.",
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      sortIndex: 3,
      version: 1,
      tags: [],
    },
  ];

  it("builds bidirectional edges from [[WikiLinks]] and shared tags", () => {
    const { nodes, edges, isolatedCount, maxDegree } = buildKnowledgeGraph(sampleNotes, 800, 600);

    expect(nodes).toHaveLength(4);
    expect(isolatedCount).toBe(1); // Random Grocery Note is isolated
    expect(maxDegree).toBeGreaterThan(0);

    // Verify wikilink edges exist
    const wikiEdges = edges.filter((e) => e.type === "wikilink");
    expect(wikiEdges.length).toBeGreaterThanOrEqual(2);

    // Verify tag edges exist between engineering notes
    const tagEdges = edges.filter((e) => e.type === "tag");
    expect(tagEdges.length).toBeGreaterThan(0);
  });

  it("simulates 2D force physics steps stably without NaN values", () => {
    const { nodes, edges } = buildKnowledgeGraph(sampleNotes, 800, 600);

    for (let i = 0; i < 30; i++) {
      simulateGraphStep(nodes, edges, 800, 600);
    }

    for (const node of nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThan(0);
      expect(node.y).toBeGreaterThan(0);
    }
  });
});
