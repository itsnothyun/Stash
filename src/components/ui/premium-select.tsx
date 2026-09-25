import React, { useState, useRef, useEffect } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface PremiumSelectOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface PremiumSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: PremiumSelectOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "start" | "end";
  disabled?: boolean;
}

export function PremiumSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  triggerClassName,
  contentClassName,
  align = "start",
  disabled = false,
}: PremiumSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-xs", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs select-none disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-1 ring-primary/40 border-primary/50",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-muted-foreground">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium text-foreground">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <CaretDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>

      {/* Floating Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1 min-w-[160px] p-1.5 rounded-xl bg-card/95 backdrop-blur-xl border border-border shadow-xl space-y-0.5",
              align === "end" ? "right-0" : "left-0",
              contentClassName
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/80"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <span className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}>
                        {option.icon}
                      </span>
                    )}
                    <div className="flex flex-col truncate">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground truncate font-normal">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-muted text-muted-foreground border border-border">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" weight="bold" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
