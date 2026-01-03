"use client";

import { useMemo, useState } from "react";
import { DataTableProps } from "@/types";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const { key, direction } = sort;
    const factor = direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal === bVal) return 0;
      return aVal > bVal ? factor : -factor;
    });
  }, [data, sort]);

  const handleSort = (key: keyof T) => {
    const nextDirection =
      sort?.key === key && sort.direction === "asc" ? "desc" : "asc";
    const nextSort = { key, direction: nextDirection } as const;
    setSort(nextSort);
    onSort?.(key, nextDirection);
  };

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-3 py-2 font-semibold text-foreground ${
                    col.sortable ? "cursor-pointer" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sort?.key === col.key &&
                      (sort.direction === "asc" ? "▲" : "▼")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx} className="border-b border-border/60 last:border-0">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-3 py-2 text-foreground/90"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
