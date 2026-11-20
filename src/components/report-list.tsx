"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Report } from "@/lib/domain/types";
import type { Page } from "@/lib/api";
import { StatusBadge } from "./ui/status-badge";
import { PaginationControls } from "./ui/pagination-controls";

export interface ReportListProps {
  initialData: Page<Report>;
  onFetchPage: (cursor?: string) => Promise<Page<Report>>;
}

export function ReportList({ initialData, onFetchPage }: ReportListProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);

  const currentIndex = cursorHistory.length - 1;

  const handleNext = useCallback(async () => {
    if (!data.meta.nextCursor) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextData = await onFetchPage(data.meta.nextCursor);

      if (nextData.data.length === 0) {
        setError("Empty page received");
        setIsLoading(false);
        return;
      }

      setData(nextData);
      setCursorHistory([...cursorHistory, data.meta.nextCursor]);
    } catch (err) {
      const apiError = err instanceof Error ? err.message : "Failed to fetch next page";
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [data.meta.nextCursor, cursorHistory, onFetchPage]);

  const handlePrevious = useCallback(async () => {
    if (currentIndex <= 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const prevCursor = cursorHistory[currentIndex - 1];
      const prevData = await onFetchPage(prevCursor);

      setData(prevData);
      setCursorHistory(cursorHistory.slice(0, currentIndex));
    } catch (err) {
      const apiError = err instanceof Error ? err.message : "Failed to fetch previous page";
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [currentIndex, cursorHistory, onFetchPage]);

  const hasPrevious = currentIndex > 0;
  const hasNext = data.meta.hasMore;

  if (data.data.length === 0 && !error) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <p className="text-sm text-muted">No reports available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <XCircle className="text-red-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-600">Error loading reports</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">Loading reports...</p>
        </div>
      )}

      {!isLoading &&
        data.data.map((report) => (
          <article
            key={report.id}
            className="rounded-lg border border-line bg-surface p-6 shadow-panel"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Report {report.id}</p>
                <h2 className="mt-1 text-2xl font-bold">{report.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  Generated {report.generated} · run {report.runId}
                </p>
              </div>
              {report.signed && (
                <StatusBadge status="success">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Signed
                  </span>
                </StatusBadge>
              )}
            </div>

            <dl className="mt-8 grid gap-4 border-y border-line py-5 text-sm md:grid-cols-4">
              <div>
                <dt className="text-muted">Outcome</dt>
                <dd className="mt-1 font-semibold capitalize">{report.outcome}</dd>
              </div>
              <div>
                <dt className="text-muted">Checks</dt>
                <dd className="mt-1 font-semibold">{report.checks}</dd>
              </div>
              <div>
                <dt className="text-muted">Findings</dt>
                <dd className="mt-1 font-semibold">
                  {report.findings} {report.findings === 1 ? "open" : "open"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Coverage</dt>
                <dd className="mt-1 font-semibold">{report.coverage}%</dd>
              </div>
            </dl>

            <a
              href={`/reports/${report.id}`}
              className="mt-5 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Open report
            </a>
          </article>
        ))}

      {(hasPrevious || hasNext) && (
        <PaginationControls
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
