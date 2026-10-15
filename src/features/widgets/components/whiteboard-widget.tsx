import React, { useEffect, useRef, useState } from "react";
import { PaintBrush, Eraser, ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";

interface WhiteboardWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

/** The canvas is CSS-stretched to the widget width, so map pointer pixels to canvas pixels. */
function toCanvasPoint(canvas: HTMLCanvasElement, e: React.MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

const COLORS = ["#f8fafc", "#38bdf8", "#34d399", "#fbbf24", "#f43f5e", "#a855f7"];

export const WhiteboardWidget: React.FC<WhiteboardWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const strokeWidth = 2.5;
  const [isEraser, setIsEraser] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill dark background once
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (historyRef.current.length > 15) historyRef.current.shift();
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = toCanvasPoint(canvas, e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? "#09090b" : currentColor;
    ctx.lineWidth = isEraser ? strokeWidth * 4 : strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = toCanvasPoint(canvas, e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleUndo = () => {
    playClickSound();
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    historyRef.current.pop(); // Remove current
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  };

  const handleClear = () => {
    playClickSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const handleInsert = () => {
    playClickSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const markdownImage = `\n\n![Stash Sketch](${dataUrl})\n\n`;
    onInsertToNote(markdownImage);
    toast.success("Sketch inserted into note");
  };

  return (
    <div className={cn("flex flex-col space-y-2.5 p-3 rounded-xl bg-card border border-border shadow-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
          <PaintBrush className="h-4 w-4 text-indigo-500" />
          <span>Sketchpad Canvas</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleUndo}
            title="Undo"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClear}
            title="Clear canvas"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleInsert}
            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
        <canvas
          ref={canvasRef}
          width={340}
          height={180}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair block w-full touch-none"
        />
      </div>

      {/* Toolbar Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCurrentColor(c);
                setIsEraser(false);
              }}
              style={{ backgroundColor: c }}
              className={cn(
                "h-4 w-4 rounded-full border transition-transform",
                currentColor === c && !isEraser ? "scale-125 border-primary shadow-xs" : "border-neutral-700"
              )}
            />
          ))}
        </div>

        <button
          onClick={() => setIsEraser(!isEraser)}
          className={cn(
            "p-1 rounded-md border text-xs flex items-center space-x-1",
            isEraser
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Eraser className="h-3.5 w-3.5" />
          <span>Eraser</span>
        </button>
      </div>
    </div>
  );
};
