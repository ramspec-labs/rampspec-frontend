"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { buildFilterParams, parseFilterParams, type FilterState } from "@/lib/reports/filters";

type FilterCheckboxProps = {
  label: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function FilterCheckbox({ label, value, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

type FindingsFilterProps = {
  onFiltersChange?: (filters: FilterState) => void;
};

export function FindingsFilter({ onFiltersChange }: FindingsFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo(
    () => parseFilterParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  const updateFilter = useCallback(
    (filterType: "severity" | "status", value: string, checked: boolean) => {
      const updated = { ...filters };
      const currentList = updated[filterType];
      
      if (checked) {
        if (!currentList.includes(value as any)) {
          currentList.push(value as any);
        }
      } else {
        const index = currentList.indexOf(value as any);
        if (index > -1) {
          currentList.splice(index, 1);
        }
      }

      const params = buildFilterParams(updated);
      const query = new URLSearchParams();
      
      // Preserve unrelated safe parameters
      for (const [key, value] of searchParams.entries()) {
        if (key !== "severity" && key !== "status") {
          query.set(key, value);
        }
      }

      // Add filter parameters
      Object.entries(params).forEach(([key, value]) => {
        query.set(key, value);
      });

      const queryString = query.toString();
      const href = queryString ? `?${queryString}` : "";
      router.push(href || ".");
      
      onFiltersChange?.(updated);
    },
    [filters, router, searchParams, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    const query = new URLSearchParams();
    
    // Preserve unrelated safe parameters
    for (const [key, value] of searchParams.entries()) {
      if (key !== "severity" && key !== "status") {
        query.set(key, value);
      }
    }

    const queryString = query.toString();
    const href = queryString ? `?${queryString}` : "";
    router.push(href || ".");
    
    onFiltersChange?.({ severity: [], status: [] });
  }, [router, searchParams, onFiltersChange]);

  const hasActiveFilters = filters.severity.length > 0 || filters.status.length > 0;

  return (
    <div className="space-y-4 rounded-lg border border-line bg-canvas p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-accent hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-3">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted">Severity</legend>
          <div className="space-y-1">
            <FilterCheckbox
              label="Critical"
              value="critical"
              checked={filters.severity.includes("critical")}
              onChange={(checked) => updateFilter("severity", "critical", checked)}
            />
            <FilterCheckbox
              label="High"
              value="high"
              checked={filters.severity.includes("high")}
              onChange={(checked) => updateFilter("severity", "high", checked)}
            />
            <FilterCheckbox
              label="Medium"
              value="medium"
              checked={filters.severity.includes("medium")}
              onChange={(checked) => updateFilter("severity", "medium", checked)}
            />
            <FilterCheckbox
              label="Low"
              value="low"
              checked={filters.severity.includes("low")}
              onChange={(checked) => updateFilter("severity", "low", checked)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted">Status</legend>
          <div className="space-y-1">
            <FilterCheckbox
              label="Open"
              value="open"
              checked={filters.status.includes("open")}
              onChange={(checked) => updateFilter("status", "open", checked)}
            />
            <FilterCheckbox
              label="Accepted"
              value="accepted"
              checked={filters.status.includes("accepted")}
              onChange={(checked) => updateFilter("status", "accepted", checked)}
            />
            <FilterCheckbox
              label="Resolved"
              value="resolved"
              checked={filters.status.includes("resolved")}
              onChange={(checked) => updateFilter("status", "resolved", checked)}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
