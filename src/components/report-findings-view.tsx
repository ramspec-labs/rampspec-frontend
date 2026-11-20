"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Finding } from "@/lib/domain/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { FindingsFilter } from "@/components/findings-filter";
import { filterFindings, parseFilterParams, type FilterState } from "@/lib/reports/filters";

type ReportFindingsViewProps = {
  reportId: string;
  findings: Finding[];
};

function getSeverityBadgeStatus(
  severity: Finding["severity"]
): "danger" | "warning" | "success" | "neutral" {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "neutral";
  }
}

function getSeverityLabel(severity: Finding["severity"]): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function getStatusLabel(status: Finding["status"]): string {
  switch (status) {
    case "open":
      return "Open";
    case "accepted":
      return "Accepted";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
}

export function ReportFindingsView({ reportId, findings }: ReportFindingsViewProps) {
  const searchParams = useSearchParams();
  const [filterState, setFilterState] = useState<FilterState | null>(null);

  const filters = useMemo(
    () => parseFilterParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  // Use either state (from filter component) or computed filters
  const currentFilters = filterState || filters;

  const filteredFindings = useMemo(
    () => filterFindings(findings, currentFilters),
    [findings, currentFilters]
  );

  const hasFilters = currentFilters.severity.length > 0 || currentFilters.status.length > 0;

  return (
    <div className="space-y-6">
      <FindingsFilter onFiltersChange={setFilterState} />

      <div className="rounded-lg border border-line bg-surface p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Findings
            {hasFilters && (
              <span className="ml-2 inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {filteredFindings.length}
              </span>
            )}
          </h2>
          {filteredFindings.length === 0 && findings.length > 0 && (
            <p className="text-sm text-muted">No findings match the selected filters</p>
          )}
        </div>

        {filteredFindings.length === 0 && findings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No findings in this report.</p>
        ) : filteredFindings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No findings match the selected filters.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {filteredFindings.map((finding) => (
              <li
                key={finding.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <a
                    href={`/reports/${reportId}/findings/${finding.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {finding.title}
                  </a>
                  <div className="mt-1 flex gap-3 text-xs text-muted">
                    <span>{finding.evidenceCount} evidence items</span>
                    <span>•</span>
                    <span className="capitalize">{finding.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={getSeverityBadgeStatus(finding.severity)}>
                    {getSeverityLabel(finding.severity)}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
