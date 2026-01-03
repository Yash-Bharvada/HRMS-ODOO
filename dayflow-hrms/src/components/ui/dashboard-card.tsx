"use client";

import React from "react";
import { clsx } from "clsx";
import { DashboardCardProps } from "@/types";

export function DashboardCard({
  title,
  value,
  icon: Icon,
  onClick,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border bg-card p-4 shadow-sm transition hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
