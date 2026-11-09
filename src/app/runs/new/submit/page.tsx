"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ApiClient, ApiError } from "@/lib/api";
import {
  submitReferenceRun,
  type ReferenceRunResult,
} from "@/lib/runs/reference";

const ids = {
  organization: "organization_00000000-0000-4000-8000-000000000001",
  project: "project_00000000-0000-4000-8000-000000000002",
  suite: "suite_00000000-0000-4000-8000-000000000003",
  target: "target_00000000-0000-4000-8000-000000000004",
} as const;

export default function SubmitRunPage() {
  const [idempotencyKey] = useState(() => `reviewer-${crypto.randomUUID()}`);
  const [targetOrigin, setTargetOrigin] = useState("");
  const [result, setResult] = useState<ReferenceRunResult>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl:
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
        getOrganizationId: () => ids.organization,
      }),
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(
        await submitReferenceRun(
          client,
          {
            projectId: ids.project,
            suiteId: ids.suite,
            suiteVersion: "1.0.0",
            targetId: ids.target,
            targetOrigin,
          },
          idempotencyKey,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The API could not complete the reference run.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Run the SEP-1 reference check"
      description="Probe an approved target and receive a backend-generated evidence summary."
    >
      <div className="grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={submit}
          className="rounded-lg border border-line bg-surface p-6 shadow-panel"
        >
          <label
            className="block text-sm font-semibold"
            htmlFor="target-origin"
          >
            Target origin
          </label>
          <input
            id="target-origin"
            type="url"
            required
            value={targetOrigin}
            placeholder="https://approved-anchor.example"
            onChange={(event) => setTargetOrigin(event.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-cyan-100"
          />
          <p className="mt-2 text-xs text-muted">
            The API accepts only HTTPS origins on its deployment allowlist.
          </p>

          <div className="mt-6 rounded-md border border-line bg-canvas p-4">
            <p className="text-xs font-semibold uppercase text-muted">
              Retry key
            </p>
            <code className="mt-2 block break-all text-xs">
              {idempotencyKey}
            </code>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          )}

          <Button className="mt-6" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Running check
              </>
            ) : (
              "Run reference check"
            )}
          </Button>
        </form>

        <aside className="rounded-lg border border-line bg-surface p-5 shadow-panel">
          <h2 className="font-semibold">Evidence summary</h2>
          {!result ? (
            <p className="mt-3 text-sm text-muted">
              Results appear here only after the backend completes the probe.
            </p>
          ) : (
            <div className="mt-4">
              <div
                className={`flex items-center gap-2 text-sm font-semibold ${
                  result.run.state === "completed"
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {result.run.state === "completed" ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}
                {result.run.state}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted">Passed</dt>
                  <dd className="mt-1 text-xl font-bold">
                    {result.report.summary.passed}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Warnings</dt>
                  <dd className="mt-1 text-xl font-bold">
                    {result.report.summary.warnings}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Reachable</dt>
                  <dd className="mt-1 font-semibold">
                    {result.probe.reachable ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">HTTP status</dt>
                  <dd className="mt-1 font-semibold">
                    {result.probe.status ?? "No response"}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs text-muted">Run ID</p>
                <code className="mt-1 block break-all text-xs">
                  {result.run.id}
                </code>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
