import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import logoSrc from "../../../src-tauri/icons/128x128@2x.png";

export function TitleBar({ canClose }: { canClose: boolean }) {
  const win = getCurrentWindow();
  return (
    <div
      data-tauri-drag-region
      className="flex h-9 shrink-0 items-center justify-between pl-4 pr-1.5 text-2xs text-subtle"
    >
      <span data-tauri-drag-region className="select-none">
        Stash Setup
      </span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Minimize"
          onClick={() => win.minimize()}
          className="flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Close"
          disabled={!canClose}
          onClick={() => win.close()}
          className="flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoSrc}
      alt=""
      draggable={false}
      className={cn("h-12 w-12 select-none rounded-[14px] shadow-md", className)}
    />
  );
}

export function StepDots({ index, total = 3 }: { index: number; total?: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300 ease-soft",
            i === index ? "w-4 bg-brand" : "w-1.5 bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}

/** One wizard page: content on top, a footer row with dots and actions. */
export function Page({
  children,
  footerStart,
  actions,
}: {
  children: ReactNode;
  footerStart?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 animate-slide-up overflow-y-auto px-10 pt-4">{children}</div>
      <div className="flex h-16 shrink-0 items-center justify-between px-10">
        <div>{footerStart}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-start gap-2.5 rounded-sm py-1 text-left disabled:opacity-50"
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors duration-150",
          checked
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border-strong bg-surface-elevated group-hover:border-muted-foreground",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        {hint && <span className="block text-2xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

export function ProgressBar({ fraction }: { fraction: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-300 ease-soft"
        style={{ width: `${Math.max(2, fraction * 100)}%` }}
      />
    </div>
  );
}
