import type { Finding } from "@/lib/domain/types";

export type FilterState = {
  severity: Finding["severity"][];
  status: Finding["status"][];
};

const VALID_SEVERITIES: Set<Finding["severity"]> = new Set([
  "critical",
  "high",
  "medium",
  "low",
]);

const VALID_STATUSES: Set<Finding["status"]> = new Set([
  "open",
  "accepted",
  "resolved",
]);

export function parseFilterParams(
  params: Record<string, string | string[] | undefined>
): FilterState {
  const filters: FilterState = {
    severity: [],
    status: [],
  };

  // Parse severity filter
  const severityParam = params.severity;
  if (severityParam) {
    const severities = Array.isArray(severityParam)
      ? severityParam
      : [severityParam];

    filters.severity = severities
      .flatMap((s) => s.split(","))
      .filter((s): s is Finding["severity"] => VALID_SEVERITIES.has(s as any));
  }

  // Parse status filter
  const statusParam = params.status;
  if (statusParam) {
    const statuses = Array.isArray(statusParam) ? statusParam : [statusParam];

    filters.status = statuses
      .flatMap((s) => s.split(","))
      .filter((s): s is Finding["status"] => VALID_STATUSES.has(s as any));
  }

  return filters;
}

export function buildFilterParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.severity.length > 0) {
    params.severity = filters.severity.join(",");
  }

  if (filters.status.length > 0) {
    params.status = filters.status.join(",");
  }

  return params;
}

export function filterFindings(
  findings: Finding[],
  filters: FilterState
): Finding[] {
  return findings.filter((finding) => {
    // If no severity filters applied, include all severities
    if (filters.severity.length > 0 && !filters.severity.includes(finding.severity)) {
      return false;
    }

    // If no status filters applied, include all statuses
    if (filters.status.length > 0 && !filters.status.includes(finding.status)) {
      return false;
    }

    return true;
  });
}

export function mergeFilters(
  currentFilters: FilterState,
  updates: Partial<FilterState>
): FilterState {
  return {
    severity: updates.severity !== undefined ? updates.severity : currentFilters.severity,
    status: updates.status !== undefined ? updates.status : currentFilters.status,
  };
}
