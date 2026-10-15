import React, { useState } from "react";
import { Table } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";
import { evaluateCell } from "../spreadsheet-formula";

interface SpreadsheetWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

export const SpreadsheetWidget: React.FC<SpreadsheetWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [cols, setCols] = useState(["A", "B", "C"]);
  const [data, setData] = useState<string[][]>([
    ["Item", "Quantity", "Price"],
    ["Keyboard", "2", "85"],
    ["Monitor", "1", "240"],
    ["Total", "=SUM(B2:B3)", "=SUM(C2:C3)"],
  ]);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setData((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[rowIndex][colIndex] = value;
      return copy;
    });
  };

  const handleAddRow = () => {
    playClickSound();
    setData((prev) => [...prev, new Array(cols.length).fill("")]);
  };

  const handleAddCol = () => {
    if (cols.length >= 26) return;
    playClickSound();
    const nextCol = String.fromCharCode(65 + cols.length);
    setCols((prev) => [...prev, nextCol]);
    setData((prev) => prev.map((row) => [...row, ""]));
  };

  const handleInsert = () => {
    playClickSound();
    const evaluated = data.map((row, r) => row.map((cell, c) => evaluateCell(cell, data, { row: r, col: c })));
    if (evaluated.length === 0) return;

    const headers = evaluated[0];
    const headerLine = `| ${headers.join(" | ")} |`;
    const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
    const rows = evaluated.slice(1).map((r) => `| ${r.join(" | ")} |`).join("\n");

    const mdTable = `\n${headerLine}\n${separatorLine}\n${rows}\n\n`;
    onInsertToNote(mdTable);
    toast.success("Table inserted into note");
  };

  return (
    <div className={cn("flex flex-col space-y-2.5 p-3 rounded-xl bg-card border border-border shadow-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
          <Table className="h-4 w-4 text-teal-500" />
          <span>Mini Spreadsheet</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleAddRow}
            className="px-2 py-0.5 text-[10px] rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            + Row
          </button>
          <button
            onClick={handleAddCol}
            disabled={cols.length >= 26}
            className="disabled:opacity-40 disabled:pointer-events-none px-2 py-0.5 text-[10px] rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            + Col
          </button>
          <button
            onClick={handleInsert}
            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto border border-border rounded-lg bg-background">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-8 p-1 text-[10px] font-mono text-muted-foreground border-r border-border">#</th>
              {cols.map((col) => (
                <th key={col} className="p-1 font-mono text-[10px] text-muted-foreground border-r border-border last:border-r-0">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                <td className="p-1 text-center font-mono text-[10px] text-muted-foreground bg-muted/30 border-r border-border">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => {
                  const evalVal = evaluateCell(cell, data, { row: rIdx, col: cIdx });
                  const isFormula = cell.startsWith("=");
                  const cellId = `${rIdx}:${cIdx}`;
                  const isEditing = editingCell === cellId;

                  return (
                    <td key={cIdx} className="p-0 border-r border-border last:border-r-0">
                      <input
                        type="text"
                        value={isEditing || !isFormula ? cell : evalVal}
                        onFocus={() => setEditingCell(cellId)}
                        onBlur={() => setEditingCell((cur) => (cur === cellId ? null : cur))}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        title={isFormula ? `Formula: ${cell} => ${evalVal}` : cell}
                        className={cn(
                          "w-full px-2 py-1 text-xs bg-transparent focus:outline-none focus:bg-primary/5",
                          isFormula && "font-semibold text-teal-600 dark:text-teal-400"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Formulas supported: <code className="bg-muted px-1 py-0.5 rounded">=SUM(A1:A3)</code>, <code className="bg-muted px-1 py-0.5 rounded">=AVG(B2:B4)</code>, <code className="bg-muted px-1 py-0.5 rounded">=A2*B2</code>
      </div>
    </div>
  );
};
