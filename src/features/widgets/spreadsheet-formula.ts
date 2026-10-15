/** Formula engine for the mini spreadsheet widget: =SUM(A1:B3), =AVG(A1:A3), =A1*B2+3. */

export const CIRCULAR_REF = "#CIRC";
export const FORMULA_ERROR = "#ERR";

const cellKey = (r: number, c: number) => `${r}:${c}`;

function evaluate(raw: string, data: string[][], visiting: Set<string>): string {
  if (!raw || !raw.startsWith("=")) return raw;

  const formula = raw.slice(1).toUpperCase().trim();

  // Resolves a referenced cell to a number, guarding against reference cycles.
  const cellValue = (r: number, c: number): number => {
    const key = cellKey(r, c);
    if (visiting.has(key)) throw new Error(CIRCULAR_REF);
    visiting.add(key);
    try {
      const result = evaluate(data[r]?.[c] || "0", data, visiting);
      if (result === CIRCULAR_REF) throw new Error(CIRCULAR_REF);
      return parseFloat(result);
    } finally {
      visiting.delete(key);
    }
  };

  try {
    const rangeMatch = formula.match(/^(SUM|AVG)\(([A-Z])(\d+):([A-Z])(\d+)\)$/);
    if (rangeMatch) {
      const [, fn, c1, r1, c2, r2] = rangeMatch;
      const colStart = Math.min(c1.charCodeAt(0), c2.charCodeAt(0)) - 65;
      const colEnd = Math.max(c1.charCodeAt(0), c2.charCodeAt(0)) - 65;
      const rowStart = Math.min(parseInt(r1, 10), parseInt(r2, 10)) - 1;
      const rowEnd = Math.max(parseInt(r1, 10), parseInt(r2, 10)) - 1;

      let sum = 0;
      let count = 0;
      for (let r = rowStart; r <= rowEnd; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          const val = cellValue(r, c);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }
      if (fn === "SUM") return formatNumber(sum);
      return count > 0 ? (sum / count).toFixed(2) : "0";
    }

    // Simple expression evaluation like =A1*B1
    const parsedExpr = formula.replace(/([A-Z])(\d+)/g, (_, col: string, row: string) => {
      const v = cellValue(parseInt(row, 10) - 1, col.charCodeAt(0) - 65);
      return isNaN(v) ? "0" : `(${v})`;
    });
    // Only numbers and arithmetic operators reach the evaluator.
    if (/^[0-9+\-*/().\s]+$/.test(parsedExpr)) {
      const value = Function(`"use strict"; return (${parsedExpr})`)();
      return typeof value === "number" && isFinite(value) ? formatNumber(value) : FORMULA_ERROR;
    }
  } catch (err) {
    return err instanceof Error && err.message === CIRCULAR_REF ? CIRCULAR_REF : FORMULA_ERROR;
  }

  return raw;
}

/** Trims float noise such as 0.1 + 0.2 = 0.30000000000000004. */
function formatNumber(n: number): string {
  return String(Number.isInteger(n) ? n : parseFloat(n.toPrecision(12)));
}

/**
 * Evaluates a cell's raw input. `self` is the cell's own position, so a formula
 * that refers back to itself reports a circular reference instead of recursing forever.
 */
export function evaluateCell(raw: string, data: string[][], self?: { row: number; col: number }): string {
  const visiting = new Set<string>();
  if (self) visiting.add(cellKey(self.row, self.col));
  return evaluate(raw, data, visiting);
}
