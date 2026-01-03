"use client";

import React from "react";
import { clsx } from "clsx";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-primary/10",
  ghost: "text-foreground hover:bg-primary/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      className,
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
