import React from "react";
import { cn } from "@/lib/utils/cn";
import logoSrc from "@/assets/logo.png";

interface StashLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * Official Stash application logo mark with optional brand wordmark.
 */
export const StashLogo: React.FC<StashLogoProps> = ({
  size = 18,
  showText = true,
  className,
  imgClassName,
}) => {
  return (
    <div className={cn("flex select-none items-center gap-2", className)}>
      <img
        src={logoSrc}
        alt="Stash"
        width={size}
        height={size}
        className={cn("shrink-0 select-none object-contain", imgClassName)}
        style={{ width: size, height: size }}
        draggable={false}
      />
      {showText && (
        <span className="text-xs font-semibold tracking-tight text-foreground">
          Stash
        </span>
      )}
    </div>
  );
};
