import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A minimal dropdown that renders inline (no Portal, no separate dismiss
 * layer) — Radix's DropdownMenu stopped registering clicks on its portaled
 * items inside the Tauri/WebView2 shell here, so this trades the extra
 * polish for a mechanism that's just plain DOM buttons and native focus.
 */

interface SimpleDropdownContextValue {
  close: () => void;
}

const SimpleDropdownContext = createContext<SimpleDropdownContextValue | null>(null);

interface SimpleDropdownProps {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  trigger,
  children,
  align = "end",
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!contentRef.current) return;
      const items = Array.from(
        contentRef.current.querySelectorAll<HTMLButtonElement>(
          "[data-menu-item]:not(:disabled)"
        )
      );
      if (items.length === 0) return;
      e.preventDefault();
      const active = document.activeElement as HTMLButtonElement | null;
      const idx = active ? items.indexOf(active) : -1;
      const next =
        e.key === "ArrowDown"
          ? items[(idx + 1 + items.length) % items.length]
          : items[(idx - 1 + items.length) % items.length];
      next?.focus();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown, true);

    const raf = requestAnimationFrame(() => {
      contentRef.current
        ?.querySelector<HTMLButtonElement>("[data-menu-item]:not(:disabled)")
        ?.focus();
    });

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown, true);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <SimpleDropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={rootRef} className={cn("relative inline-flex", className)}>
        {trigger({ open, toggle: () => setOpen(!open) })}
        {open && (
          <div
            ref={contentRef}
            role="menu"
            className={cn(
              "absolute top-full z-50 mt-1 max-h-[70vh] min-w-[8rem] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
              align === "end" ? "right-0" : "left-0",
              contentClassName
            )}
          >
            {children}
          </div>
        )}
      </div>
    </SimpleDropdownContext.Provider>
  );
};

interface SimpleDropdownItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  onSelect?: () => void;
  inset?: boolean;
}

export const SimpleDropdownItem = React.forwardRef<
  HTMLButtonElement,
  SimpleDropdownItemProps
>(({ className, onClick, onSelect, inset, children, disabled, ...props }, ref) => {
  const ctx = useContext(SimpleDropdownContext);
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      data-menu-item
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
        ctx?.close();
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SimpleDropdownItem.displayName = "SimpleDropdownItem";

export const SimpleDropdownSeparator: React.FC<{ className?: string }> = ({
  className,
}) => <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;

export const SimpleDropdownLabel: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div
    className={cn(
      "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40",
      className
    )}
  >
    {children}
  </div>
);

/**
 * A disclosure row used in place of a true flyout submenu — clicking it
 * expands a nested list inline within the same panel instead of opening a
 * second Portal, since that's the exact mechanism that broke here.
 */
export const SimpleDropdownSub: React.FC<{
  label: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ label, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        data-menu-item
        onClick={() => setOpen((o) => !o)}
        className="relative flex w-full cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      >
        {icon}
        <span className="flex-1">{label}</span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-border/50 pl-2 py-0.5">
          {children}
        </div>
      )}
    </div>
  );
};
