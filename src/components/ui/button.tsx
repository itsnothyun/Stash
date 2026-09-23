import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        brand: "bg-brand text-brand-foreground shadow-xs hover:bg-brand/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-border bg-surface-elevated text-foreground shadow-xs hover:bg-surface-hover hover:border-border-strong",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-hover",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-brand underline-offset-4 hover:underline",
        subtle:
          "bg-surface text-foreground border border-border/70 hover:bg-surface-hover",
      },
      size: {
        default: "h-8 px-3 text-xs",
        sm: "h-7 rounded-sm px-2.5 text-2xs",
        lg: "h-9 px-4 text-sm",
        icon: "h-8 w-8 rounded-sm",
        "icon-sm": "h-7 w-7 rounded-sm",
        "icon-xs": "h-6 w-6 rounded-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
