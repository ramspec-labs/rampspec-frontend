import { AlertCircle } from "lucide-react";
import type { VersionCompatibility } from "@/lib/reports/types";
import { StatusBadge } from "@/components/ui/status-badge";

export interface StaleReportIndicatorProps {
  compatibility: VersionCompatibility;
}

export function StaleReportIndicator({
  compatibility,
}: StaleReportIndicatorProps) {
  if (!compatibility.isStale) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 flex-shrink-0 text-amber-600"
          size={18}
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Report version outdated</h3>
          <p className="mt-1 text-sm text-amber-800">
            This report was created with an older version of the verification suite.
          </p>
          <div className="mt-3 space-y-1 text-xs text-amber-800">
            <p>
              <strong>Suite version:</strong> {compatibility.reportSuiteVersion}
              {compatibility.reportSuiteVersion !==
                compatibility.currentSuiteVersion && (
                <span className="ml-2 text-amber-600">
                  (current: {compatibility.currentSuiteVersion})
                </span>
              )}
            </p>
            <p>
              <strong>Schema version:</strong> {compatibility.reportSchemaVersion}
              {compatibility.reportSchemaVersion !==
                compatibility.currentSchemaVersion && (
                <span className="ml-2 text-amber-600">
                  (current: {compatibility.currentSchemaVersion})
                </span>
              )}
            </p>
          </div>
          <div className="mt-3">
            <StatusBadge status="warning">Stale</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );
}
