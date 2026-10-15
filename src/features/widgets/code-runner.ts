/** Runs a JavaScript scratchpad snippet with a captured console, REPL style. */

export interface SnippetResult {
  logs: string[];
  result: unknown;
}

const formatArg = (a: unknown) => {
  if (typeof a !== "object" || a === null) return String(a);
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
};

export function runSnippet(code: string): SnippetResult {
  const logs: string[] = [];
  const capturedConsole = {
    log: (...args: unknown[]) => logs.push(args.map(formatArg).join(" ")),
    info: (...args: unknown[]) => logs.push(args.map(formatArg).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(formatArg).join(" ")}`),
    error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(formatArg).join(" ")}`),
  };

  let result: unknown;
  let started = false;
  const markStarted = () => {
    started = true;
  };
  try {
    // Direct eval yields the value of the last expression statement, like a REPL.
    // The marker shares the first line so reported line numbers stay accurate.
    const evaluator = new Function(
      "console",
      "__markStarted",
      "__snippet",
      '"use strict"; return eval("__markStarted();" + __snippet);'
    );
    result = evaluator(capturedConsole, markStarted, code);
  } catch (err) {
    // A top-level `return` fails to parse under eval; run those snippets as a function body.
    // Only parse failures fall through, so a snippet never executes twice.
    if (started || !(err instanceof SyntaxError)) throw err;
    const runner = new Function("console", `"use strict";\n${code}`);
    result = runner(capturedConsole);
  }

  return { logs, result };
}
