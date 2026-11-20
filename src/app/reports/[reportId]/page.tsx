"use client";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { findings } from "@/lib/domain/fixtures";
import type { Finding } from "@/lib/domain/types";
import { ReportCoverage } from "@/components/report-coverage";
import { ReportBaseline } from "@/components/report-baseline";
import { ReportExports, type IntegrityState } from "@/components/report-exports";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  // Determine integrity state based on report data
  // In a real application, this would come from the backend API
  const integrityState: IntegrityState = "verified";

  const findingsColumns: DataColumn<Finding>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      sortFn: (a, b) => a.title.localeCompare(b.title),
      render: (finding) => (
        <div>
          <a
            href={`/reports/${reportId}/findings/${finding.id}`}
            className="font-medium text-accent hover:underline"
          >
            {finding.title}
          </a>
          <p className="mt-1 text-xs text-muted">{finding.evidenceCount} evidence items</p>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      sortFn: (a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      },
      render: (finding) => (
        <StatusBadge status={finding.severity === "high" || finding.severity === "critical" ? "danger" : finding.severity === "medium" ? "warning" : "neutral"}>
          {finding.severity}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortFn: (a, b) => a.status.localeCompare(b.status),
      render: (finding) => (
        <StatusBadge status={finding.status === "open" ? "warning" : finding.status === "accepted" ? "info" : "success"}>
          {finding.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <AppShell
      title={`Report ${reportId}`}
      description="Canonical backend-issued result with traceable findings."
    >
      <div className="rounded-lg border border-line bg-surface p-6 shadow-panel">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">Release verification result</h2>
            <p className="mt-1 text-sm text-muted">Outcome: Ready with notes</p>
          </div>
          <StatusBadge status="success">Signature valid</StatusBadge>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-md bg-canvas p-4">
            <p className="text-xs text-muted">Checks passed</p>
            <p className="mt-1 text-2xl font-bold">16/18</p>
          </div>
          <div className="rounded-md bg-canvas p-4">
            <p className="text-xs text-muted">Evidence coverage</p>
            <p className="mt-1 text-2xl font-bold">94%</p>
          </div>
          <div className="rounded-md bg-canvas p-4">
            <p className="text-xs text-muted">Open findings</p>
            <p className="mt-1 text-2xl font-bold">2</p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <ReportCoverage />
      </div>
      <div className="mt-6">
        <ReportBaseline />
      </div>
      <div className="mt-6 rounded-lg border border-line bg-surface p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Export report</h2>
          <ReportExports reportId={reportId} integrityState={integrityState} />
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-line bg-surface p-6 shadow-panel">
        <h2 className="font-semibold">Findings</h2>
        <div className="mt-4">
          <DataTable<Finding>
            caption="Findings for this report with sortable columns for title, severity, and status"
            columns={findingsColumns}
            rows={findings}
          />
        </div>
      </div>
    </AppShell>
  );
}
