import { Note } from "./types/note";
import { extractNoteWikiLinks } from "./note-links";

export interface GraphNode {
  id: string;
  title: string;
  color: string;
  tags: string[];
  connectionCount: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "wikilink" | "tag";
  label?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isolatedCount: number;
  maxDegree: number;
}

/**
 * Builds nodes and edges from notes using wiki links [[Title]] and shared tags.
 */
export function buildKnowledgeGraph(notes: Note[], width = 800, height = 600): KnowledgeGraphData {
  const activeNotes = notes.filter((n) => !n.isArchived && !n.deletedAt);
  const titleToIdMap = new Map<string, string>();

  for (const n of activeNotes) {
    if (n.title?.trim()) {
      titleToIdMap.set(n.title.trim().toLowerCase(), n.id);
    }
  }

  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const degrees = new Map<string, number>();

  // Initialize degrees
  for (const n of activeNotes) {
    degrees.set(n.id, 0);
  }

  // 1. Build edges from WikiLinks
  for (const n of activeNotes) {
    const wikiLinks = extractNoteWikiLinks(n.plainText || "");
    for (const linkTitle of wikiLinks) {
      const targetId = titleToIdMap.get(linkTitle.toLowerCase());
      if (targetId && targetId !== n.id) {
        const key = [n.id, targetId].sort().join("-") + "-wiki";
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({
            sourceId: n.id,
            targetId,
            type: "wikilink",
            label: "links",
          });
          degrees.set(n.id, (degrees.get(n.id) || 0) + 1);
          degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
        }
      }
    }
  }

  // 2. Build edges from Shared Tags
  const tagToNotes = new Map<string, string[]>();
  for (const n of activeNotes) {
    for (const tag of n.tags || []) {
      const existing = tagToNotes.get(tag.name) || [];
      existing.push(n.id);
      tagToNotes.set(tag.name, existing);
    }
  }

  for (const [tag, noteIds] of tagToNotes.entries()) {
    if (noteIds.length > 1 && noteIds.length <= 15) {
      for (let i = 0; i < noteIds.length; i++) {
        for (let j = i + 1; j < noteIds.length; j++) {
          const key = [noteIds[i], noteIds[j]].sort().join("-") + "-tag";
          if (!edgeKeys.has(key)) {
            edgeKeys.add(key);
            edges.push({
              sourceId: noteIds[i],
              targetId: noteIds[j],
              type: "tag",
              label: `#${tag}`,
            });
            degrees.set(noteIds[i], (degrees.get(noteIds[i]) || 0) + 1);
            degrees.set(noteIds[j], (degrees.get(noteIds[j]) || 0) + 1);
          }
        }
      }
    }
  }

  // Initialize node layout in a soft circle around center
  const centerX = width / 2;
  const centerY = height / 2;
  const initialRadius = Math.min(width, height) * 0.35;

  let maxDegree = 0;
  let isolatedCount = 0;

  const nodes: GraphNode[] = activeNotes.map((n, i) => {
    const angle = (i / Math.max(activeNotes.length, 1)) * Math.PI * 2;
    const deg = degrees.get(n.id) || 0;
    if (deg > maxDegree) maxDegree = deg;
    if (deg === 0) isolatedCount++;

    const baseRadius = 8;
    const radius = Math.min(24, baseRadius + deg * 2.5);

    // Random jitter so nodes don't overlap completely
    const jitter = (Math.random() - 0.5) * 40;
    const x = centerX + Math.cos(angle) * (initialRadius + jitter);
    const y = centerY + Math.sin(angle) * (initialRadius + jitter);

    return {
      id: n.id,
      title: n.title?.trim() || "Untitled Stash",
      color: n.color || "Paper",
      tags: n.tags?.map((t) => t.name) ?? [],
      connectionCount: deg,
      radius,
      x,
      y,
      vx: 0,
      vy: 0,
    };
  });

  return { nodes, edges, isolatedCount, maxDegree };
}

/**
 * Executes a single 2D force simulation step (Coulomb repulsion + Spring attraction + Center gravity).
 */
export function simulateGraphStep(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  damping = 0.85
): void {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const centerX = width / 2;
  const centerY = height / 2;

  // 1. Coulomb Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy + 1;
      const dist = Math.sqrt(distSq);

      if (dist < 400) {
        const force = 1800 / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }
  }

  // 2. Hooke's Law Spring Attraction along edges
  const targetDistance = 110;
  for (const edge of edges) {
    const a = nodeMap.get(edge.sourceId);
    const b = nodeMap.get(edge.targetId);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const springStrength = edge.type === "wikilink" ? 0.05 : 0.02;
    const displacement = dist - targetDistance;
    const force = displacement * springStrength;

    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // 3. Center gravity and update position
  const gravity = 0.015;
  for (const node of nodes) {
    node.vx += (centerX - node.x) * gravity;
    node.vy += (centerY - node.y) * gravity;

    node.vx *= damping;
    node.vy *= damping;

    node.x += node.vx;
    node.y += node.vy;

    // Soft bounds
    const pad = node.radius + 10;
    node.x = Math.max(pad, Math.min(width - pad, node.x));
    node.y = Math.max(pad, Math.min(height - pad, node.y));
  }
}
