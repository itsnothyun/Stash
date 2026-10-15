import React, { useEffect, useRef } from "react";
import { create } from "zustand";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

/**
 * Toasts are deliberately rare in Stash.
 *
 * Per the product's toast policy they exist for exactly three things:
 * a destructive action that deserves an Undo, a long operation that finished
 * (export/import/backup), and an unexpected failure. Routine autosaves,
 * pin toggles, colour changes and tag edits must stay silent.
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  description?: string;
  action?: ToastAction;
  variant?: "default" | "destructive";
  /** Milliseconds on screen. Toasts with an action linger longer. */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // At most three at once; the oldest falls off the top of the stack.
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-3) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  show: (input: Omit<Toast, "id">) => useToastStore.getState().push(input),
  /** A reversible destructive action: "Moved to Trash  ·  Undo". */
  undoable: (message: string, onUndo: () => void, description?: string) =>
    useToastStore.getState().push({
      message,
      description,
      action: { label: "Undo", onClick: onUndo },
      duration: 7000,
    }),
  error: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, variant: "destructive" }),
  success: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, variant: "default" }),
  info: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, variant: "default" }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};

const ToastRow: React.FC<{ toast: Toast }> = ({ toast: item }) => {
  const dismiss = useToastStore((s) => s.dismiss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = item.duration ?? (item.action ? 7000 : 4000);
    timerRef.current = setTimeout(() => dismiss(item.id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, item.action, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-md border bg-popover/95 px-3.5 py-2.5 shadow-md backdrop-blur animate-toast-in",
        item.variant === "destructive"
          ? "border-destructive/30"
          : "border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-xs font-medium leading-tight",
            item.variant === "destructive"
              ? "text-destructive"
              : "text-foreground"
          )}
        >
          {item.message}
        </div>
        {item.description && (
          <div className="mt-0.5 text-2xs text-muted-foreground leading-snug">
            {item.description}
          </div>
        )}
      </div>

      {item.action && (
        <button
          onClick={() => {
            item.action?.onClick();
            dismiss(item.id);
          }}
          className="shrink-0 rounded-sm border border-border bg-surface-elevated px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          {item.action.label}
        </button>
      )}

      <button
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-xs p-1 text-subtle transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  );
};
