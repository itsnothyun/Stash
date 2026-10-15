import React, { useEffect, useRef, useState } from "react";
import { Note } from "../types/note";
import { buildKnowledgeGraph, simulateGraphStep, GraphNode, GraphEdge } from "../knowledge-graph";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { playClickSound } from "@/lib/utils/sound-effects";
import {
  MagnifyingGlass,
  Plus,
  Minus,
  ArrowClockwise,
  ArrowSquareOut,
  X,
  ShareNetwork,
} from "@phosphor-icons/react";

interface KnowledgeGraphModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  onOpenStash: (noteId: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  Paper: "#94a3b8",
  Sand: "#f59e0b",
  Lemon: "#eab308",
  Sage: "#84cc16",
  Mint: "#10b981",
  Sky: "#0ea5e9",
  Lavender: "#8b5cf6",
  Rose: "#f43f5e",
  Graphite: "#64748b",
};

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  open,
  onOpenChange,
  notes,
  onOpenStash,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const graphDataRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const animationFrameRef = useRef<number | null>(null);

  // Latest view state, read by the render loop so interaction never restarts the simulation.
  const viewRef = useRef({ pan, zoom, searchQuery, selectedNode, hoveredNode });
  viewRef.current = { pan, zoom, searchQuery, selectedNode, hoveredNode };

  // Initialize and run simulation
  useEffect(() => {
    if (!open) return;

    const width = 960;
    const height = 620;
    const { nodes, edges } = buildKnowledgeGraph(notes, width, height);
    graphDataRef.current = { nodes, edges };

    // Warm up simulation
    for (let i = 0; i < 40; i++) {
      simulateGraphStep(nodes, edges, width, height, 0.88);
    }

    let iterations = 0;
    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (iterations < 200) {
        simulateGraphStep(graphDataRef.current.nodes, graphDataRef.current.edges, width, height, 0.85);
        iterations++;
      }

      const { pan, zoom, searchQuery, selectedNode, hoveredNode } = viewRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(pan.x, pan.y);
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const q = searchQuery.toLowerCase().trim();
      const nodeById = new Map(graphDataRef.current.nodes.map((n) => [n.id, n]));

      // Draw Edges
      for (const edge of graphDataRef.current.edges) {
        const source = nodeById.get(edge.sourceId);
        const target = nodeById.get(edge.targetId);
        if (!source || !target) continue;

        const isHighlighted =
          (hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id)) ||
          (selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id));

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = edge.type === "wikilink" ? "#38bdf8" : "#a855f7";
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = edge.type === "wikilink" ? "rgba(148, 163, 184, 0.45)" : "rgba(168, 85, 247, 0.3)";
          ctx.lineWidth = 1;
        }

        ctx.stroke();
      }

      // Draw Nodes
      for (const node of graphDataRef.current.nodes) {
        const isMatch = q ? node.title.toLowerCase().includes(q) || node.tags.some((t) => t.toLowerCase().includes(q)) : true;
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        const baseColor = COLOR_MAP[node.color] || "#94a3b8";

        // Glow aura
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "rgba(56, 189, 248, 0.25)" : isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.1)";
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isMatch ? baseColor : "rgba(100, 116, 139, 0.3)";
        ctx.fill();

        const idleStroke = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(15, 23, 42, 0.15)";
        ctx.strokeStyle = isSelected ? "#38bdf8" : isHovered ? (isDark ? "#ffffff" : "#0f172a") : idleStroke;
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.stroke();

        // Node Label
        if (node.radius >= 12 || isSelected || isHovered || isMatch) {
          ctx.font = isSelected || isHovered ? "bold 12px Inter, sans-serif" : "11px Inter, sans-serif";
          ctx.fillStyle = isMatch ? (isDark ? "#f1f5f9" : "#1e293b") : "rgba(148, 163, 184, 0.5)";
          ctx.textAlign = "center";
          ctx.fillText(node.title, node.x, node.y + node.radius + 14);
        }
      }

      ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, notes]);

  // Coordinate mapper from screen to canvas space
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const width = 960;
    const height = 620;

    const screenX = (clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (clientY - rect.top) * (canvas.height / rect.height);

    // Invert translation and zoom
    const centeredX = screenX - pan.x - width / 2;
    const centeredY = screenY - pan.y - height / 2;

    const unscaledX = centeredX / zoom;
    const unscaledY = centeredY / zoom;

    return {
      x: unscaledX + width / 2,
      y: unscaledY + height / 2,
    };
  };

  const findNodeAt = (coords: { x: number; y: number }): GraphNode | null => {
    for (const node of graphDataRef.current.nodes) {
      const dx = coords.x - node.x;
      const dy = coords.y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 5) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const hit = findNodeAt(coords);

    if (hit) {
      setSelectedNode(hit);
      playClickSound();
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const hit = findNodeAt(coords);
    setHoveredNode(hit);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const hit = findNodeAt(coords);
    if (hit) {
      onOpenStash(hit.id);
      onOpenChange(false);
    }
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[94vw] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
        <DialogHeader className="p-4 pr-12 border-b border-border flex flex-col items-stretch gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center space-x-2.5">
            <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              <ShareNetwork className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <DialogTitle className="whitespace-nowrap text-base font-bold text-foreground">Knowledge Graph</DialogTitle>
              <div className="text-xs text-muted-foreground hidden md:block">
                Interactive bidirectional link constellation & tag clusters
              </div>
            </div>
          </div>

          {/* Search bar & Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Highlight notes or #tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-muted/60 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center space-x-1 border border-border/80 rounded-lg p-0.5 bg-muted/40">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                title="Zoom in"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                title="Zoom out"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetView}
                title="Reset view"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowClockwise className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[960/620] bg-muted/30 overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoveredNode(null);
          }}
          onDoubleClick={handleDoubleClick}
        >
          <canvas
            ref={canvasRef}
            width={960}
            height={620}
            className="w-full h-full block"
          />

          {/* HUD Overlay: Node Details Card */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 p-3.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg max-w-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                  {selectedNode.title}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1">
                <div>Connections: <span className="font-semibold text-foreground">{selectedNode.connectionCount}</span></div>
                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNode.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onOpenStash(selectedNode.id);
                  onOpenChange(false);
                }}
                className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center space-x-1.5 hover:bg-primary/90 transition-colors shadow-xs"
              >
                <ArrowSquareOut className="h-3.5 w-3.5" />
                <span>Open Floating Stash</span>
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-card/80 backdrop-blur-md border border-border/70 text-[10px] space-y-1 text-muted-foreground shadow-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-0.5 bg-sky-400 rounded-full" />
              <span>WikiLink [[...]]</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-0.5 bg-purple-400 rounded-full" />
              <span>Shared Tag</span>
            </div>
            <div className="text-[9px] text-muted-foreground/70 pt-0.5">
              Click node to inspect • Double-click to open
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
