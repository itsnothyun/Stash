import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Check, Search, X, RotateCw, Plus, Copy } from "lucide-react";
import {
  CURRENCIES,
  CURRENCY_LIST,
  CurrencyItem,
  fetchLiveExchangeRates,
  formatCurrencyAmount,
  formatUsdValue,
  formatRateInPicker,
} from "@/features/widgets/currencies";

interface SwapProps {
  initialPayAmount?: string;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  onSuccess?: (details: {
    fromToken: string;
    toToken: string;
    fromAmount: number;
    toAmount: number;
    rate: number;
  }) => void;
  className?: string;
  embedded?: boolean;
}

export const Swap: React.FC<SwapProps> = ({
  initialPayAmount = "1000",
  initialFromCurrency = "VND",
  initialToCurrency = "PHP",
  onSuccess,
  className,
  embedded = false,
}) => {
  const [payAmount, setPayAmount] = useState(initialPayAmount);
  // Two persistent physical tokens that glide between the two wells
  const [symbol1, setSymbol1] = useState(initialFromCurrency);
  const [symbol2, setSymbol2] = useState(initialToCurrency);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (initialFromCurrency) setSymbol1(initialFromCurrency);
    if (initialToCurrency) setSymbol2(initialToCurrency);
    setIsFlipped(false);
  }, [initialFromCurrency, initialToCurrency]);

  // Live exchange rates state
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const [k, v] of Object.entries(CURRENCIES)) {
      initial[k] = v.rateVsUsd;
    }
    return initial;
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  // Currency Picker Modal state: 1 for Token Pill 1, 2 for Token Pill 2
  const [pickerTarget, setPickerTarget] = useState<1 | 2 | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "fiat" | "crypto">("all");

  const [isCopied, setIsCopied] = useState(false);
  const [isInserted, setIsInserted] = useState(false);

  // Load live rates on mount
  useEffect(() => {
    let mounted = true;
    fetchLiveExchangeRates().then((liveRates) => {
      if (mounted && liveRates) {
        setRates(liveRates);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pickerTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPickerTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickerTarget]);

  const refreshRates = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFetchingRates(true);
    try {
      const live = await fetchLiveExchangeRates();
      if (live) setRates(live);
    } finally {
      setTimeout(() => setIsFetchingRates(false), 500);
    }
  };

  // Persistent token definitions
  const token1Currency: CurrencyItem = CURRENCIES[symbol1] || CURRENCIES.VND || CURRENCIES.USD;
  const token2Currency: CurrencyItem = CURRENCIES[symbol2] || CURRENCIES.PHP || CURRENCIES.EUR;

  // Well currencies based on physical position (Top Well is at y:28, Bottom Well is at y:124)
  // When unflipped: Token 1 is at top (Pay), Token 2 is at bottom (Receive)
  // When flipped:   Token 2 is at top (Pay), Token 1 is at bottom (Receive)
  const payCurrency: CurrencyItem = isFlipped ? token2Currency : token1Currency;
  const receiveCurrency: CurrencyItem = isFlipped ? token1Currency : token2Currency;

  // Real calculation with active rates
  const payRateVsUsd = rates[payCurrency.symbol] || payCurrency.rateVsUsd;
  const receiveRateVsUsd = rates[receiveCurrency.symbol] || receiveCurrency.rateVsUsd;

  const parsedPay = parseFloat(payAmount.replace(/,/g, "")) || 0;
  const exchangeRate = receiveRateVsUsd > 0 ? payRateVsUsd / receiveRateVsUsd : 0;
  const receiveAmountNum = parsedPay * exchangeRate;

  // Format outputs
  const receiveDisplay = formatCurrencyAmount(receiveAmountNum, receiveCurrency.decimals);
  const payUsdValue = formatUsdValue(parsedPay * payRateVsUsd);
  const receiveUsdValue = formatUsdValue(receiveAmountNum * receiveRateVsUsd);

  // Flip currencies: tokens physically glide between wells with spring physics
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);

    // Transfer the calculated receive amount to the pay input for clean round-tripping
    if (receiveAmountNum > 0) {
      const rounded =
        receiveCurrency.decimals === 0
          ? Math.round(receiveAmountNum).toString()
          : receiveAmountNum >= 1
          ? (Math.round(receiveAmountNum * 100) / 100).toString()
          : parseFloat(receiveAmountNum.toPrecision(4)).toString();
      setPayAmount(rounded);
    }
  };

  const handleInsert = () => {
    setIsInserted(true);
    if (onSuccess) {
      onSuccess({
        fromToken: payCurrency.symbol,
        toToken: receiveCurrency.symbol,
        fromAmount: parsedPay,
        toAmount: receiveAmountNum,
        rate: exchangeRate,
      });
    }
    setTimeout(() => setIsInserted(false), 2000);
  };

  const handleCopy = async () => {
    const text = `${parsedPay} ${payCurrency.symbol} = ${receiveDisplay} ${receiveCurrency.symbol} (Rate: 1 ${payCurrency.symbol} = ${exchangeRate >= 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(6)} ${receiveCurrency.symbol})`;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Currency Selection for the target token
  const handleSelectCurrency = (currency: CurrencyItem) => {
    if (pickerTarget === 1) {
      setSymbol1(currency.symbol);
    } else if (pickerTarget === 2) {
      setSymbol2(currency.symbol);
    }
    setPickerTarget(null);
    setSearchQuery("");
  };

  const filteredCurrencies = CURRENCY_LIST.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.country && item.country.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Determine which well the clicked token currently belongs to for the modal label
  const isTargetInTopWell =
    (pickerTarget === 1 && !isFlipped) || (pickerTarget === 2 && isFlipped);
  const activePickerSymbol =
    pickerTarget === 1 ? symbol1 : pickerTarget === 2 ? symbol2 : "";

  return (
    <div
      className={`swp select-none relative ${embedded ? "swp-embedded" : ""} ${className || ""}`}
      style={{
        width: embedded ? "100%" : "320px",
        minWidth: "260px",
        maxWidth: "100%",
        minHeight: embedded ? "auto" : "272px",
        borderRadius: embedded ? "0px" : "22px",
        padding: embedded ? "8px 12px 12px 12px" : "12px",
      }}
    >
      {/* Header (hidden if embedded into widget window) */}
      {!embedded && (
        <header className="swp-head" style={{ height: "24px" }}>
          <span className="swp-title flex items-center gap-1.5">
            <span>Swap</span>
            <button
              onClick={refreshRates}
              className={`p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors ${
                isFetchingRates ? "animate-spin" : ""
              }`}
              title="Refresh exchange rates"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </span>
          <span className="swp-slip flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Live rates</span>
          </span>
        </header>
      )}

      {/* Wells & Flip Container: self-contained relative coordinate box for wells, switcher, and gliding tokens */}
      <div className="relative">
        {/* "You pay" Well (Top) */}
        <label className="swp-well" style={{ height: "88px", borderRadius: "10px", marginTop: 0 }}>
          <span className="swp-label">You pay</span>
          <input
            type="text"
            inputMode="decimal"
            value={payAmount}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(val) || val === "") {
                setPayAmount(val);
              }
            }}
            className="swp-in"
            aria-label={`Amount in ${payCurrency.symbol}`}
          />
          <span className="swp-usd">${payUsdValue}</span>
        </label>

        {/* Central Flip Button (Centered precisely between the two wells, spring spins 180deg) */}
        <motion.button
          type="button"
          onClick={handleFlip}
          aria-label="Reverse trade direction"
          className="swp-flip"
          animate={{ rotate: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            width: "36px",
            height: "36px",
            top: "74px",
            left: "calc(50% - 18px)",
            zIndex: 10,
          }}
        >
          <ArrowUpDown className="h-4 w-4 stroke-[2.2]" />
        </motion.button>

        {/* "You receive" Well (Bottom) */}
        <div className="swp-well" style={{ height: "88px", borderRadius: "10px", marginTop: "8px" }}>
          <span className="swp-label">You receive</span>
          <span className="swp-out">
            <span className="swp-roll">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${receiveDisplay}-${receiveCurrency.symbol}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  {receiveDisplay}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span className="swp-usd">${receiveUsdValue}</span>
        </div>

        {/* Token Pill 1: Physically glides with spring between y:28 (top well) and y:124 (bottom well) */}
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPickerTarget(1);
          }}
          className="swp-token"
          data-tone={token1Currency.tone}
          aria-label={`Select ${token1Currency.symbol} currency`}
          title={`Click to select ${token1Currency.symbol} currency`}
          initial={false}
          animate={{
            y: isFlipped ? 124 : 28,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 19 }}
          style={{ right: "12px", top: 0, zIndex: 10 }}
        >
          <span className="swp-coin" aria-hidden="true">
            {token1Currency.glyph}
          </span>
          <span>{token1Currency.symbol}</span>
        </motion.button>

        {/* Token Pill 2: Physically glides with spring between y:124 (bottom well) and y:28 (top well) */}
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPickerTarget(2);
          }}
          className="swp-token"
          data-tone={token2Currency.tone}
          aria-label={`Select ${token2Currency.symbol} currency`}
          title={`Click to select ${token2Currency.symbol} currency`}
          initial={false}
          animate={{
            y: isFlipped ? 28 : 124,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 19 }}
          style={{ right: "12px", top: 0, zIndex: 10 }}
        >
          <span className="swp-coin" aria-hidden="true">
            {token2Currency.glyph}
          </span>
          <span>{token2Currency.symbol}</span>
        </motion.button>
      </div>

      {/* Rate and Fee row */}
      <div className="swp-rate" style={{ height: "18px" }}>
        <span className="truncate">
          1 {payCurrency.symbol} ={" "}
          {exchangeRate >= 1
            ? exchangeRate.toLocaleString("en-US", { maximumFractionDigits: 4 })
            : exchangeRate < 0.0001
            ? exchangeRate.toPrecision(4)
            : exchangeRate.toFixed(6)}{" "}
          {receiveCurrency.symbol}
        </span>
        <span>Fee 0.0%</span>
      </div>

      {/* Instant Action Row */}
      <div className="flex items-center gap-2 mt-3 pt-1">
        <button
          type="button"
          onClick={handleInsert}
          className="flex-1 h-9 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-xs"
        >
          {isInserted ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
              <span>Inserted to Note!</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Insert to Note</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="h-9 px-3 rounded-xl border border-border/80 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-colors flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          title="Copy conversion result to clipboard"
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />
              <span className="text-emerald-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Currency Selector Popover Overlay */}
      <AnimatePresence>
        {pickerTarget !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="swp-picker-overlay"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/70 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {pickerTarget === 1 ? token1Currency.glyph : token2Currency.glyph}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Select {isTargetInTopWell ? "Pay" : "Receive"} Currency
                </span>
              </div>
              <button
                onClick={() => setPickerTarget(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title="Close (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-2 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, country or name (e.g. VND, Vietnam, PHP, USD)..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-black/5 dark:bg-white/5 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 mt-2 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[11px] shrink-0">
              {(["all", "fiat", "crypto"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex-1 py-1 rounded-md capitalize font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Currencies Scrollable List */}
            <div className="flex-1 overflow-y-auto mt-2 space-y-0.5 pr-1 divide-y divide-black/5 dark:divide-white/5">
              {filteredCurrencies.map((c) => {
                const isSelected = c.symbol === activePickerSymbol;
                return (
                  <button
                    key={c.symbol}
                    onClick={() => handleSelectCurrency(c)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-foreground font-semibold"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="swp-coin text-xs shrink-0"
                        style={{
                          width: "24px",
                          height: "24px",
                          fontSize: "11px",
                        }}
                        data-tone={c.tone}
                      >
                        {c.glyph}
                      </span>
                      <div>
                        <div className="text-xs font-medium leading-tight flex items-center gap-1.5">
                          <span>{c.symbol}</span>
                          {isSelected && (
                            <Check className="h-3 w-3 text-emerald-500 stroke-[3]" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {c.name} {c.country ? `(${c.country})` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-muted-foreground tabular-nums">
                      {formatRateInPicker(rates[c.symbol] || c.rateVsUsd, c.symbol)}
                    </div>
                  </button>
                );
              })}
              {filteredCurrencies.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No currencies match "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
