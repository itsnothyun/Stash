import React, { useState } from "react";
import { ArrowDownUp, Check, Copy, Ruler, Scale, Thermometer, HardDrive, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface UnitConverterWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

type UnitCategory = "length" | "weight" | "temperature" | "data";

interface UnitDefinition {
  label: string;
  symbol: string;
  toBase?: (val: number) => number;
  fromBase?: (val: number) => number;
  ratio?: number; // ratio vs base unit
}

const CATEGORIES: Record<
  UnitCategory,
  {
    name: string;
    icon: React.ReactNode;
    baseUnit: string;
    units: Record<string, UnitDefinition>;
  }
> = {
  length: {
    name: "Length",
    icon: <Ruler className="h-3 w-3" />,
    baseUnit: "m",
    units: {
      km: { label: "Kilometers", symbol: "km", ratio: 1000 },
      m: { label: "Meters", symbol: "m", ratio: 1 },
      cm: { label: "Centimeters", symbol: "cm", ratio: 0.01 },
      mm: { label: "Millimeters", symbol: "mm", ratio: 0.001 },
      mi: { label: "Miles", symbol: "mi", ratio: 1609.344 },
      yd: { label: "Yards", symbol: "yd", ratio: 0.9144 },
      ft: { label: "Feet", symbol: "ft", ratio: 0.3048 },
      in: { label: "Inches", symbol: "in", ratio: 0.0254 },
    },
  },
  weight: {
    name: "Weight",
    icon: <Scale className="h-3 w-3" />,
    baseUnit: "kg",
    units: {
      kg: { label: "Kilograms", symbol: "kg", ratio: 1 },
      g: { label: "Grams", symbol: "g", ratio: 0.001 },
      mg: { label: "Milligrams", symbol: "mg", ratio: 0.000001 },
      lb: { label: "Pounds", symbol: "lb", ratio: 0.45359237 },
      oz: { label: "Ounces", symbol: "oz", ratio: 0.0283495 },
    },
  },
  temperature: {
    name: "Temp",
    icon: <Thermometer className="h-3 w-3" />,
    baseUnit: "c",
    units: {
      c: {
        label: "Celsius",
        symbol: "°C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      f: {
        label: "Fahrenheit",
        symbol: "°F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      k: {
        label: "Kelvin",
        symbol: "K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    },
  },
  data: {
    name: "Data",
    icon: <HardDrive className="h-3 w-3" />,
    baseUnit: "MB",
    units: {
      b: { label: "Bytes", symbol: "B", ratio: 1 / (1024 * 1024) },
      kb: { label: "Kilobytes", symbol: "KB", ratio: 1 / 1024 },
      mb: { label: "Megabytes", symbol: "MB", ratio: 1 },
      gb: { label: "Gigabytes", symbol: "GB", ratio: 1024 },
      tb: { label: "Terabytes", symbol: "TB", ratio: 1024 * 1024 },
    },
  },
};

export const UnitConverterWidget: React.FC<UnitConverterWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [amount, setAmount] = useState<string>("10");
  const [fromUnit, setFromUnit] = useState<string>("km");
  const [toUnit, setToUnit] = useState<string>("mi");
  const [copied, setCopied] = useState(false);

  const currentCat = CATEGORIES[category];

  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat);
    const keys = Object.keys(CATEGORIES[newCat].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const handleSwapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const convert = (
    valStr: string,
    fromKey: string,
    toKey: string,
    cat: UnitCategory
  ): number => {
    const num = parseFloat(valStr);
    if (isNaN(num)) return 0;
    const fromDef = CATEGORIES[cat].units[fromKey];
    const toDef = CATEGORIES[cat].units[toKey];
    if (!fromDef || !toDef) return 0;

    if (cat === "temperature") {
      const baseVal = fromDef.toBase ? fromDef.toBase(num) : num;
      return toDef.fromBase ? toDef.fromBase(baseVal) : baseVal;
    }

    const baseVal = num * (fromDef.ratio || 1);
    return baseVal / (toDef.ratio || 1);
  };

  const convertedValue = convert(amount, fromUnit, toUnit, category);
  const formattedOutput =
    Math.abs(convertedValue) < 0.0001 && convertedValue !== 0
      ? convertedValue.toExponential(3)
      : convertedValue.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        });

  const fromDef = currentCat.units[fromUnit];
  const toDef = currentCat.units[toUnit];

  const handleInsert = () => {
    const fromSymbol = fromDef?.symbol || fromUnit;
    const toSymbol = toDef?.symbol || toUnit;
    const fromLabel = fromDef?.label || fromUnit;
    const toLabel = toDef?.label || toUnit;

    const str = `\n### 📐 Unit Conversion: ${currentCat.name}
> *Converted from ${fromLabel} to ${toLabel}*

- **Input**: **\`${amount} ${fromSymbol}\`** (${fromLabel})
- **Result**: **\`${formattedOutput} ${toSymbol}\`** (${toLabel})\n`;

    onInsertToNote(str);
  };

  const handleCopy = async () => {
    const str = `${amount} ${fromDef?.symbol || fromUnit} = ${formattedOutput} ${toDef?.symbol || toUnit}`;
    try {
      await navigator.clipboard.writeText(str);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[260px] text-foreground",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      {/* Category Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 mb-3 text-[11px]">
        {(["length", "weight", "temperature", "data"] as UnitCategory[]).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1 ${
                category === cat
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORIES[cat].icon}
              <span className="truncate">{CATEGORIES[cat].name}</span>
            </button>
          )
        )}
      </div>

      {/* From Input Well */}
      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-2 border border-border/50">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-medium block">
            From
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9.-]*$/.test(val)) setAmount(val);
            }}
            className="w-full bg-transparent font-bold text-lg font-mono text-foreground focus:outline-none tabular-nums"
          />
        </div>

        {/* Premium From Unit Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold bg-card hover:bg-accent text-foreground border border-border/80 rounded-lg px-2.5 py-1.5 shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
              title="Change source unit"
            >
              <span className="font-mono font-bold text-primary">{fromDef?.symbol}</span>
              <span className="text-[11px] text-muted-foreground font-normal max-w-[80px] truncate">
                {fromDef?.label}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70 shrink-0 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 max-h-56 overflow-y-auto">
            {Object.entries(currentCat.units).map(([key, def]) => {
              const isSelected = key === fromUnit;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFromUnit(key)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold w-7 text-left text-primary text-[11px]">
                      {def.symbol}
                    </span>
                    <span className="truncate">{def.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Swap Direction Divider */}
      <div className="flex justify-center -my-1.5 relative z-10">
        <button
          onClick={handleSwapUnits}
          className="h-6 w-6 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
          title="Swap units"
        >
          <ArrowDownUp className="h-3 w-3" />
        </button>
      </div>

      {/* To Output Well */}
      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-2 border border-border/50 mt-1">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-medium block">
            To
          </span>
          <div className="text-lg font-bold font-mono text-foreground truncate tabular-nums">
            {formattedOutput}
          </div>
        </div>

        {/* Premium To Unit Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold bg-card hover:bg-accent text-foreground border border-border/80 rounded-lg px-2.5 py-1.5 shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
              title="Change target unit"
            >
              <span className="font-mono font-bold text-primary">{toDef?.symbol}</span>
              <span className="text-[11px] text-muted-foreground font-normal max-w-[80px] truncate">
                {toDef?.label}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70 shrink-0 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 max-h-56 overflow-y-auto">
            {Object.entries(currentCat.units).map(([key, def]) => {
              const isSelected = key === toUnit;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setToUnit(key)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold w-7 text-left text-primary text-[11px]">
                      {def.symbol}
                    </span>
                    <span className="truncate">{def.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center gap-1.5 mt-3">
        <WidgetInsertButton
          onInsert={handleInsert}
          label="Insert to note"
          insertedLabel="Inserted to note!"
          className="flex-1"
        />

        <button
          onClick={handleCopy}
          className="h-8 px-2.5 rounded-lg border border-border/70 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-colors flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          title="Copy result"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
