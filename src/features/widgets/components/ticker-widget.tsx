import React, { useState } from "react";
import { TrendingUp, TrendingDown, Plus, RotateCw } from "lucide-react";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: "$64,250.00", change: "+2.8%", isPositive: true },
  { symbol: "ETH", name: "Ethereum", price: "$3,214.10", change: "+1.9%", isPositive: true },
  { symbol: "SOL", name: "Solana", price: "$152.40", change: "+5.4%", isPositive: true },
  { symbol: "EUR/USD", name: "Euro", price: "1.0920", change: "+0.15%", isPositive: true },
  { symbol: "XAU", name: "Gold", price: "$2,648.50", change: "-0.32%", isPositive: false },
];

interface TickerWidgetProps {
  onInsertToNote?: (text: string) => void;
  className?: string;
}

export const TickerWidget: React.FC<TickerWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [tickers, setTickers] = useState<TickerItem[]>(DEFAULT_TICKERS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate gentle market price fluctuations
    setTimeout(() => {
      setTickers((prev) =>
        prev.map((t) => {
          const delta = (Math.random() * 0.4 - 0.2).toFixed(2);
          const isPos = parseFloat(delta) >= 0;
          return {
            ...t,
            change: `${isPos ? "+" : ""}${delta}%`,
            isPositive: isPos,
          };
        })
      );
      setIsRefreshing(false);
    }, 400);
  };

  const handleInsertSingle = (t: TickerItem) => {
    if (!onInsertToNote) return;
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    onInsertToNote(
      `\n• 📈 **${t.symbol}** (${t.name}): **\`${t.price}\`** (${t.isPositive ? "🟢" : "🔴"} \`${t.change}\` • ${timeStr})`
    );
  };

  const handleInsertAll = () => {
    if (!onInsertToNote) return;
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const lines = tickers
      .map(
        (t) =>
          `- **${t.symbol}** (${t.name}): **\`${t.price}\`** (${t.isPositive ? "🟢" : "🔴"} \`${t.change}\`)`
      )
      .join("\n");

    const summary = `\n### 📈 Market Watchlist Snapshot
> *Updated on ${dateStr} at ${timeStr}*

${lines}\n`;

    onInsertToNote(summary);
  };

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[240px] text-xs",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      {!className?.includes("border-0") ? (
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Market Tickers</span>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
            title="Refresh prices"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 px-1 text-muted-foreground text-[10px]">
          <span className="uppercase font-semibold tracking-wider">Live Quotes</span>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
            title="Refresh prices"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="divide-y divide-border/40 mt-1">
        {tickers.map((t) => (
          <div
            key={t.symbol}
            className="flex items-center justify-between py-1.5 group hover:bg-muted/40 px-1 rounded transition-colors"
          >
            <div>
              <div className="font-semibold text-foreground flex items-center gap-1">
                <span>{t.symbol}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {t.name}
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {t.price}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  t.isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {t.isPositive ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {t.change}
              </span>

              {onInsertToNote && (
                <button
                  type="button"
                  onClick={() => handleInsertSingle(t)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  title={`Insert ${t.symbol} into note`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {onInsertToNote && (
        <div className="pt-2 mt-1.5 border-t border-border/40">
          <WidgetInsertButton
            onInsert={handleInsertAll}
            label="Insert to note"
            insertedLabel="Inserted to note!"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
