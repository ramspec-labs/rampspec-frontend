import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { findings, reportVersionMetadata } from "@/lib/domain/fixtures";
import { ReportCoverage } from "@/components/report-coverage";
import { ReportBaseline } from "@/components/report-baseline";
import { ReportExports } from "@/components/report-exports";
import { ReportFindingsView } from "@/components/report-findings-view";
import { StaleReportIndicator } from "@/components/stale-report-indicator";
import { checkVersionCompatibility } from "@/lib/reports/compatibility";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  // Get report version metadata - default to current if not found
  const metadata = reportVersionMetadata[reportId] || reportVersionMetadata["report-current"];
  const compatibility = checkVersionCompatibility(metadata);

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
        <StaleReportIndicator compatibility={compatibility} />
      </div>
      <div className="mt-6">
        <ReportCoverage />
      </div>
      <div className="mt-6">
        <ReportBaseline />
      </div>
      <div className="mt-6">
        <ReportFindingsView reportId={reportId} findings={findings} />
      </div>
    </AppShell>
  );
}
