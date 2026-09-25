import React, { useState, useEffect } from "react";
import { Globe, Sun, Moon, Plus, Check, CopySimple as Copy } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { WidgetInsertButton } from "./widget-insert-button";
import { cn } from "@/lib/utils/cn";

interface WorldClockWidgetProps {
  onInsertToNote: (text: string) => void;
  className?: string;
}

interface CityTimezone {
  name: string;
  code: string;
  timeZone: string;
}

const ALL_AVAILABLE_CITIES: CityTimezone[] = [
  { name: "Local Time", code: "LOC", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { name: "UTC / GMT", code: "UTC", timeZone: "UTC" },
  { name: "San Francisco", code: "SFO", timeZone: "America/Los_Angeles" },
  { name: "New York", code: "NYC", timeZone: "America/New_York" },
  { name: "London", code: "LDN", timeZone: "Europe/London" },
  { name: "Paris", code: "PAR", timeZone: "Europe/Paris" },
  { name: "Berlin", code: "BER", timeZone: "Europe/Berlin" },
  { name: "Dubai", code: "DXB", timeZone: "Asia/Dubai" },
  { name: "Singapore", code: "SIN", timeZone: "Asia/Singapore" },
  { name: "Hong Kong", code: "HKG", timeZone: "Asia/Hong_Kong" },
  { name: "Tokyo", code: "TYO", timeZone: "Asia/Tokyo" },
  { name: "Sydney", code: "SYD", timeZone: "Australia/Sydney" },
  { name: "Auckland", code: "AKL", timeZone: "Pacific/Auckland" },
];

const DEFAULT_CITIES: CityTimezone[] = [
  ALL_AVAILABLE_CITIES[0],
  ALL_AVAILABLE_CITIES[1],
  ALL_AVAILABLE_CITIES[3], // New York
  ALL_AVAILABLE_CITIES[4], // London
  ALL_AVAILABLE_CITIES[10], // Tokyo
];

export const WorldClockWidget: React.FC<WorldClockWidgetProps> = ({
  onInsertToNote,
  className,
}) => {
  const [now, setNow] = useState(new Date());
  const [cities, setCities] = useState<CityTimezone[]>(DEFAULT_CITIES);
  const [is24Hour, setIs24Hour] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeForZone = (timeZone: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: !is24Hour,
      });
      return formatter.format(now);
    } catch {
      return now.toLocaleTimeString([], { hour12: !is24Hour });
    }
  };

  const getHourForZone = (timeZone: string): number => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).formatToParts(now);
      const h = parts.find((p) => p.type === "hour");
      return h ? parseInt(h.value, 10) : 12;
    } catch {
      return 12;
    }
  };

  const getDayOffset = (timeZone: string): string => {
    try {
      const localDay = now.getDate();
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        day: "numeric",
      }).formatToParts(now);
      const targetDay = parseInt(parts.find((p) => p.type === "day")?.value || `${localDay}`, 10);
      if (targetDay > localDay) return "+1d";
      if (targetDay < localDay) return "-1d";
      return "";
    } catch {
      return "";
    }
  };

  const handleInsert = () => {
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const cityLines = cities
      .map((c) => {
        const time = getTimeForZone(c.timeZone);
        const offset = getDayOffset(c.timeZone);
        const offsetStr = offset ? ` *(${offset})*` : "";
        return `- 🌐 **${c.name}** (\`${c.code}\`): **\`${time}\`**${offsetStr}`;
      })
      .join("\n");

    const summary = `\n### 🌐 World Clock Snapshot
> *Captured on ${dateStr}*

${cityLines}\n`;

    onInsertToNote(summary);
  };

  const handleCopyCity = async (c: CityTimezone) => {
    const text = `${c.name}: ${getTimeForZone(c.timeZone)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(c.code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // fallback
    }
  };

  const isEmbedded = className?.includes("border-0") || className?.includes("embedded");

  return (
    <div
      className={cn(
        "select-none w-full min-w-[240px] text-foreground",
        isEmbedded
          ? "p-2"
          : "rounded-2xl border border-border bg-card p-3 shadow-md",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40 text-xs">
        {!isEmbedded ? (
          <div className="flex items-center gap-1.5 font-semibold">
            <Globe className="h-3.5 w-3.5 text-foreground" />
            <span>World Clocks</span>
          </div>
        ) : (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Cities ({cities.length})</span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle 12h / 24h format"
          >
            {is24Hour ? "24H" : "12H"}
          </button>

          {/* Premium Add/Remove City Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-5 px-1.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                title="Manage displayed cities"
              >
                <Plus className="h-3 w-3" />
                <span>City</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                Select Cities
              </div>
              {ALL_AVAILABLE_CITIES.map((c) => {
                const isSelected = cities.some((sc) => sc.code === c.code);
                return (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => {
                      if (isSelected) {
                        if (cities.length > 1) {
                          setCities(cities.filter((sc) => sc.code !== c.code));
                        }
                      } else {
                        setCities([...cities, c]);
                      }
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-muted-foreground w-8">
                        {c.code}
                      </span>
                      <span>{c.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-foreground" weight="bold" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Clocks List */}
      <div className="space-y-1 my-2">
        {cities.map((city) => {
          const hour = getHourForZone(city.timeZone);
          const isDaytime = hour >= 6 && hour < 18;
          const dayOffset = getDayOffset(city.timeZone);
          const isCopied = copiedCode === city.code;

          return (
            <div
              key={city.code}
              onClick={() => handleCopyCity(city)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
              title="Click to copy time"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {isDaytime ? (
                    <Sun className="h-3.5 w-3.5 text-foreground/80" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-foreground/80" />
                  )}
                </span>
                <div>
                  <div className="text-xs font-medium leading-tight flex items-center gap-1">
                    <span>{city.name}</span>
                    {dayOffset && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-mono">
                        {dayOffset}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">
                    {city.code}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium tabular-nums text-foreground">
                  {getTimeForZone(city.timeZone)}
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity">
                  {isCopied ? (
                    <Check className="h-3 w-3 text-foreground" weight="bold" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insert Timestamp to Note */}
      <WidgetInsertButton
        onInsert={handleInsert}
        label="Insert to note"
        insertedLabel="Inserted to note!"
        className="w-full mt-2"
      />
    </div>
  );
};
