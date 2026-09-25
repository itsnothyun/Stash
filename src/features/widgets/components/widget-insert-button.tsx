import React, { useState } from "react";
import { Plus, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface WidgetInsertButtonProps {
  onInsert: () => void;
  label?: string;
  insertedLabel?: string;
  className?: string;
  variant?: "default" | "compact" | "subtle";
  icon?: React.ReactNode;
}

export const WidgetInsertButton: React.FC<WidgetInsertButtonProps> = ({
  onInsert,
  label = "Insert to note",
  insertedLabel = "Inserted to note!",
  className,
  variant = "default",
  icon,
}) => {
  const [isInserted, setIsInserted] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsert();
    setIsInserted(true);
    setTimeout(() => setIsInserted(false), 1800);
  };

  const defaultIcon = icon || (
    <Plus className="h-3.5 w-3.5 shrink-0" weight="bold" />
  );

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isInserted}
        title={label}
        className={cn(
          "group flex items-center justify-center gap-1.5 px-2.5 h-6.5 rounded-lg text-[11px] font-medium transition-all select-none bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-xs disabled:opacity-100 cursor-pointer",
          className
        )}
      >
        {isInserted ? (
          <>
            <Check className="h-3 w-3 text-background animate-in zoom-in-75 shrink-0" weight="bold" />
            <span className="font-semibold">{insertedLabel}</span>
          </>
        ) : (
          <>
            {defaultIcon}
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isInserted}
        className={cn(
          "group flex items-center gap-1 text-[11px] font-medium transition-colors select-none cursor-pointer",
          isInserted
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground underline decoration-muted-foreground/40 hover:decoration-foreground",
          className
        )}
      >
        {isInserted ? (
          <>
            <Check className="h-3 w-3 text-foreground shrink-0" weight="bold" />
            <span>{insertedLabel}</span>
          </>
        ) : (
          <>
            {defaultIcon}
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isInserted}
      className={cn(
        "group relative flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-lg text-xs font-medium transition-all select-none bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-xs disabled:opacity-100 cursor-pointer",
        className
      )}
    >
      {isInserted ? (
        <span className="flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150">
          <Check className="h-3.5 w-3.5 text-background shrink-0" weight="bold" />
          <span className="font-semibold">{insertedLabel}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {defaultIcon}
          <span>{label}</span>
        </span>
      )}
    </button>
  );
};
