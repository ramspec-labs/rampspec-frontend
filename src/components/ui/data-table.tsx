"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortKey = string;
export type SortDirection = "asc" | "desc" | null;

export type DataColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
};

type SortState = {
  key: SortKey | null;
  direction: SortDirection;
};

export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: DataColumn<T>[];
  rows: T[];
}) {
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });

  const handleSort = (columnKey: string, sortFn?: (a: T, b: T) => number) => {
    let newDirection: SortDirection;

    if (sortState.key === columnKey) {
      // Cycle: asc -> desc -> none
      if (sortState.direction === "asc") {
        newDirection = "desc";
      } else if (sortState.direction === "desc") {
        newDirection = null;
      } else {
        newDirection = "asc";
      }
    } else {
      // New column: start with asc
      newDirection = "asc";
    }

    setSortState({ key: columnKey, direction: newDirection });
  };

  const sortedRows = (() => {
    if (!sortState.key || !sortState.direction) return rows;

    const column = columns.find((col) => col.key === sortState.key);
    if (!column) return rows;

    const sorted = [...rows].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b);
      }
      return 0;
    });

    return sortState.direction === "desc" ? sorted.reverse() : sorted;
  })();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3 font-semibold">
                {column.sortable ? (
                  <SortableHeader
                    label={column.label}
                    columnKey={column.key}
                    isActive={sortState.key === column.key}
                    direction={sortState.key === column.key ? sortState.direction : null}
                    onClick={() => handleSort(column.key, column.sortFn)}
                  />
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sortedRows.map((row) => (
            <tr key={row.id} className="hover:bg-canvas">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-top">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  columnKey,
  isActive,
  direction,
  onClick,
}: {
  label: string;
  columnKey: string;
  isActive: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={cn("gap-1 px-0", {
        "text-ink": isActive,
        "text-muted": !isActive,
      })}
      aria-pressed={isActive}
      aria-sort={
        isActive
          ? direction === "asc"
            ? "ascending"
            : direction === "desc"
              ? "descending"
              : "none"
          : "none"
      }
      title={
        !isActive
          ? `Sort by ${label} in ascending order`
          : direction === "asc"
            ? `Sort by ${label} in descending order`
            : direction === "desc"
              ? `Clear sort for ${label}`
              : `Sort by ${label} in ascending order`
      }
    >
      <span>{label}</span>
      {isActive && direction === "asc" && <ChevronUp className="h-4 w-4" />}
      {isActive && direction === "desc" && <ChevronDown className="h-4 w-4" />}
    </Button>
  );
}
