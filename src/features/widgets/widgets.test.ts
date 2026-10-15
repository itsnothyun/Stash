import { describe, it, expect } from "vitest";
import { evaluateCell, CIRCULAR_REF } from "./spreadsheet-formula";
import { runSnippet } from "./code-runner";

describe("Widgets & Interactive Mini-Apps Suite", () => {
  describe("Spreadsheet Formula Engine", () => {
    it("evaluates =SUM(A1:A3) correctly", () => {
      const grid = [
        ["10", "20"],
        ["30", "40"],
        ["50", "60"],
      ];

      const sumA = evaluateCell("=SUM(A1:A3)", grid);
      expect(sumA).toBe("90");

      const sumB = evaluateCell("=SUM(B1:B3)", grid);
      expect(sumB).toBe("120");
    });

    it("evaluates cell arithmetic =A1*B1", () => {
      const grid = [
        ["5", "12"],
      ];
      const product = evaluateCell("=A1*B1", grid);
      expect(product).toBe("60");
    });

    it("evaluates =AVG over a range", () => {
      expect(evaluateCell("=AVG(A1:A3)", [["1"], ["2"], ["6"]])).toBe("3.00");
    });

    it("reports a self reference instead of overflowing the stack", () => {
      const grid = [["=A1"]];
      expect(evaluateCell(grid[0][0], grid, { row: 0, col: 0 })).toBe(CIRCULAR_REF);
    });

    it("reports indirect cycles and ranges that include the cell itself", () => {
      const grid = [["=B1", "=A1", "=SUM(A1:C1)"]];
      expect(evaluateCell(grid[0][0], grid, { row: 0, col: 0 })).toBe(CIRCULAR_REF);
      expect(evaluateCell(grid[0][2], grid, { row: 0, col: 2 })).toBe(CIRCULAR_REF);
    });

    it("lets several formulas reference the same cell", () => {
      const grid = [["4", "=A1+A1", "=A1*B1"]];
      expect(evaluateCell(grid[0][2], grid, { row: 0, col: 2 })).toBe("32");
    });

    it("subtracts negative references and trims float noise", () => {
      expect(evaluateCell("=A1-B1", [["5", "-5"]])).toBe("10");
      expect(evaluateCell("=A1+B1", [["0.1", "0.2"]])).toBe("0.3");
    });

    it("returns an error for division by zero", () => {
      expect(evaluateCell("=A1/0", [["5"]])).toBe("#ERR");
    });
  });

  describe("Code Runner Sandbox", () => {
    it("captures console.log output and an explicit return", () => {
      const { logs, result } = runSnippet(`
        const a = 10;
        const b = 20;
        console.log("Sum:", a + b);
        return a + b;
      `);
      expect(logs).toContain("Sum: 30");
      expect(result).toBe(30);
    });

    it("returns the value of the last expression like a REPL", () => {
      const { logs, result } = runSnippet(
        `const items = [120, 45, 89, 210];
const total = items.reduce((a, b) => a + b, 0);
console.log("Total:", total);
total * 2;`
      );
      expect(logs).toEqual(["Total: 464"]);
      expect(result).toBe(928);
    });

    it("runs a snippet only once when it throws a runtime SyntaxError", () => {
      let runs = 0;
      (globalThis as any).__countRun = () => runs++;
      expect(() => runSnippet(`__countRun(); JSON.parse("{bad");`)).toThrow(SyntaxError);
      expect(runs).toBe(1);
      delete (globalThis as any).__countRun;
    });

    it("surfaces genuine syntax errors", () => {
      expect(() => runSnippet("const = ;")).toThrow(SyntaxError);
    });
  });

  describe("Developer Tools JSON & Regex", () => {
    it("validates and formats JSON strings", () => {
      const unformatted = '{"a":1,"b":[2,3]}';
      const parsed = JSON.parse(unformatted);
      const formatted = JSON.stringify(parsed, null, 2);

      expect(formatted).toContain('\n  "a": 1,');
      expect(formatted).toContain('\n  "b": [\n    2,\n    3\n  ]');
    });

    it("finds regex matches correctly", () => {
      const text = "Contact hello@stash.app and support@stash.app";
      const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(regex);

      expect(matches).toHaveLength(2);
      expect(matches?.[0]).toBe("hello@stash.app");
      expect(matches?.[1]).toBe("support@stash.app");
    });
  });

  describe("Expenses Ledger Calculation", () => {
    it("computes total amount and category totals accurately", () => {
      const items = [
        { category: "Coffee", amount: 4.5 },
        { category: "Software", amount: 20 },
        { category: "Coffee", amount: 5.5 },
      ];

      const total = items.reduce((a, b) => a + b.amount, 0);
      expect(total).toBe(30);

      const coffeeTotal = items
        .filter((i) => i.category === "Coffee")
        .reduce((a, b) => a + b.amount, 0);
      expect(coffeeTotal).toBe(10);
    });
  });
});
