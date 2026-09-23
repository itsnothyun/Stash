/**
 * Safe inline arithmetic evaluator for Stash notes.
 *
 * Automatically detects patterns like:
 *   24 * 5 =
 *   (150 + 50) / 4 =
 *   12.5 + 3.75 =
 *   500 * 0.15 =
 *
 * Returns null if not a valid arithmetic expression.
 */

export function evaluateInlineMath(textBeforeCursor: string): { expression: string; result: string } | null {
  // Match trailing math equation ending with '='
  // e.g. "Total is 120 * 1.15=" -> matches "120 * 1.15="
  const match = textBeforeCursor.match(/(?:^|\s)([\d\.\s\+\-\*\/\(\)\^%]+)=$/);
  if (!match) return null;

  const rawExpr = match[1].trim();
  if (!rawExpr) return null;

  // Must contain at least one arithmetic operator (+, -, *, /, ^, %) and at least one number
  if (!/[\+\-\*\/\^%]/.test(rawExpr)) return null;
  if (!/\d/.test(rawExpr)) return null;

  // Safety check: ONLY allow digits, basic operators, parens, decimal points, spaces
  if (!/^[\d\.\s\+\-\*\/\(\)\^%]+$/.test(rawExpr)) return null;

  // Replace percentage: "15%" -> "(15/100)"
  const withPercentages = rawExpr.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");

  // Replace power: "^" -> "**"
  const normalized = withPercentages.replace(/\^/g, "**");

  try {
    // Evaluate safely using restricted Function constructor
    // Only numbers and operators are permitted per regex above
    const fn = new Function(`"use strict"; return (${normalized})`);
    const val = fn();

    if (typeof val !== "number" || !Number.isFinite(val)) return null;

    // Format output (clean up floating point errors like 0.30000000000000004)
    const formatted = parseFloat(val.toPrecision(10)).toString();
    return {
      expression: rawExpr,
      result: formatted,
    };
  } catch {
    return null;
  }
}
