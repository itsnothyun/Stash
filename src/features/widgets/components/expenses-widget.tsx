import React, { useMemo, useState } from "react";
import { Plus, Trash, Receipt } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { playClickSound } from "@/lib/utils/sound-effects";
import { cn } from "@/lib/utils/cn";

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

interface ExpensesWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

const CATEGORIES = ["Food", "Software", "Hardware", "Coffee", "Transit", "Other"] as const;

export const ExpensesWidget: React.FC<ExpensesWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [currency, setCurrency] = useState("$");
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: "1", category: "Coffee", description: "Espresso & Pastry", amount: 6.5 },
    { id: "2", category: "Software", description: "Cloud Hosting", amount: 24.0 },
    { id: "3", category: "Transit", description: "Metro Pass", amount: 15.0 },
  ]);

  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<string>("Food");
  const [amt, setAmt] = useState("");

  const total = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [items]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amt);
    if (!desc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    playClickSound();
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        category: cat,
        description: desc.trim(),
        amount: parsedAmount,
      },
    ]);

    setDesc("");
    setAmt("");
  };

  const handleDelete = (id: string) => {
    playClickSound();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleInsert = () => {
    playClickSound();
    const dateStr = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const list = items
      .map((i) => `- **${i.description}** (${i.category}): \`${currency}${i.amount.toFixed(2)}\``)
      .join("\n");

    const receipt = `\n### 🧾 Expense Log (${dateStr})\n${list}\n\n**Total:** \`${currency}${total.toFixed(2)}\`\n\n`;
    onInsertToNote(receipt);
    toast.success("Expense receipt inserted");
  };

  return (
    <div className={cn("flex flex-col space-y-2.5 p-3 rounded-xl bg-card border border-border shadow-xs", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-amber-500" />
          <span>Expense Log</span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-1.5 py-0.5 text-xs rounded-md bg-muted border border-border text-foreground"
          >
            <option value="$">$ USD</option>
            <option value="€">€ EUR</option>
            <option value="£">£ GBP</option>
            <option value="¥">¥ JPY</option>
            <option value="₱">₱ PHP</option>
          </select>

          <button
            onClick={handleInsert}
            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Total Banner */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Running Total</span>
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {currency}{total.toFixed(2)}
        </span>
      </div>

      {/* Item List */}
      <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 text-xs transition-colors group"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground shrink-0">
                {item.category}
              </span>
              <span className="truncate text-foreground font-medium">{item.description}</span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="font-semibold text-foreground">
                {currency}{item.amount.toFixed(2)}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAdd} className="flex items-center space-x-1.5 pt-1">
        <input
          type="text"
          placeholder="Item..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg bg-background border border-border text-foreground"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-1.5 py-1 text-xs rounded-lg bg-background border border-border text-foreground max-w-[80px] shrink-0"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          className="w-16 shrink-0 px-2 py-1 text-xs rounded-lg bg-background border border-border text-foreground"
        />
        <button
          type="submit"
          className="shrink-0 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" weight="bold" />
        </button>
      </form>
    </div>
  );
};
