"use client";

import React from "react";
import { clsx } from "clsx";

type SpinnerSize = "sm" | "md" | "lg";

export interface LoadingSpinnerProps {
  text?: string;
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

export function LoadingSpinner({
  text,
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={clsx("flex items-center gap-2 text-foreground", className)}>
      <span
        className={clsx(
          "inline-block animate-spin rounded-full border-solid border-current border-r-transparent",
          sizeMap[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
