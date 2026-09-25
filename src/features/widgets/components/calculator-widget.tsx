import React, { useState } from "react";
import { Calculator as CalcIcon, Backspace } from "@phosphor-icons/react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface CalculatorWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [display, setDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [lastEquation, setLastEquation] = useState<string | null>(null);

  const handleDigit = (d: string) => {
    if (display === "0" || resetNext) {
      setDisplay(d);
      setResetNext(false);
    } else {
      setDisplay(display + d);
    }
  };

  const handleDot = () => {
    if (resetNext) {
      setDisplay("0.");
      setResetNext(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevVal(null);
    setOp(null);
    setResetNext(false);
  };

  const handleOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prevVal !== null && op) {
      let result = prevVal;
      if (op === "+") result = prevVal + current;
      if (op === "-") result = prevVal - current;
      if (op === "×") result = prevVal * current;
      if (op === "÷") result = current !== 0 ? prevVal / current : 0;
      setDisplay(String(Number(result.toFixed(6))));
      setPrevVal(result);
      setLastEquation(`${prevVal} ${op} ${current} = ${Number(result.toFixed(6))}`);
    } else {
      setPrevVal(current);
    }
    setOp(nextOp);
    setResetNext(true);
  };

  const handleEquals = () => {
    if (prevVal === null || !op) return;
    const current = parseFloat(display);
    let result = prevVal;
    if (op === "+") result = prevVal + current;
    if (op === "-") result = prevVal - current;
    if (op === "×") result = prevVal * current;
    if (op === "÷") result = current !== 0 ? prevVal / current : 0;
    const finalStr = String(Number(result.toFixed(6)));
    setLastEquation(`${prevVal} ${op} ${current} = ${finalStr}`);
    setDisplay(finalStr);
    setPrevVal(null);
    setOp(null);
    setResetNext(true);
  };

  const handleInsertToNote = () => {
    if (!onInsertToNote) return;
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const equationLine = lastEquation ? `- **Equation**: \`${lastEquation}\`\n` : "";
    const summary = `\n### 🧮 Calculation Result
> *Computed at ${timeStr}*
${equationLine}- **Result**: **\`${display}\`**\n`;

    onInsertToNote(summary);
  };

  const btnClass =
    "h-8 rounded-lg font-medium text-xs flex items-center justify-center transition-colors active:scale-95";
  const numBtn = `${btnClass} bg-muted/60 text-foreground hover:bg-muted`;
  const opBtn = `${btnClass} bg-primary/10 text-primary font-semibold hover:bg-primary/20`;

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[220px] text-xs",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
        {!className?.includes("border-0") ? (
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <CalcIcon className="h-3.5 w-3.5 text-foreground" />
            <span>Quick Calculator</span>
          </div>
        ) : (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Standard</span>
        )}
        {onInsertToNote && (
          <WidgetInsertButton
            onInsert={handleInsertToNote}
            label="Insert to note"
            insertedLabel="Inserted to note!"
            variant="compact"
          />
        )}
      </div>

      {/* Screen */}
      <div className="bg-muted/40 rounded-xl p-2.5 my-2 text-right">
        <div className="text-[10px] text-muted-foreground h-3">
          {prevVal !== null && op ? `${prevVal} ${op}` : ""}
        </div>
        <div className="text-xl font-bold font-mono text-foreground truncate">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={handleClear} className={`${btnClass} bg-muted text-foreground font-bold hover:bg-muted/80`}>
          C
        </button>
        <button
          onClick={() => {
            if (display.length > 1) {
              setDisplay(display.slice(0, -1));
            } else {
              setDisplay("0");
            }
          }}
          className={`${btnClass} bg-muted text-muted-foreground hover:text-foreground`}
        >
          <Backspace className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(val / 100));
          }}
          className={opBtn}
        >
          %
        </button>
        <button onClick={() => handleOp("÷")} className={opBtn}>
          ÷
        </button>

        <button onClick={() => handleDigit("7")} className={numBtn}>
          7
        </button>
        <button onClick={() => handleDigit("8")} className={numBtn}>
          8
        </button>
        <button onClick={() => handleDigit("9")} className={numBtn}>
          9
        </button>
        <button onClick={() => handleOp("×")} className={opBtn}>
          ×
        </button>

        <button onClick={() => handleDigit("4")} className={numBtn}>
          4
        </button>
        <button onClick={() => handleDigit("5")} className={numBtn}>
          5
        </button>
        <button onClick={() => handleDigit("6")} className={numBtn}>
          6
        </button>
        <button onClick={() => handleOp("-")} className={opBtn}>
          −
        </button>

        <button onClick={() => handleDigit("1")} className={numBtn}>
          1
        </button>
        <button onClick={() => handleDigit("2")} className={numBtn}>
          2
        </button>
        <button onClick={() => handleDigit("3")} className={numBtn}>
          3
        </button>
        <button onClick={() => handleOp("+")} className={opBtn}>
          +
        </button>

        <button onClick={() => handleDigit("0")} className={`col-span-2 ${numBtn}`}>
          0
        </button>
        <button onClick={handleDot} className={numBtn}>
          .
        </button>
        <button onClick={handleEquals} className={`${btnClass} bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-90`}>
          =
        </button>
      </div>
    </div>
  );
};
