"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/components/organization-context";
import { ApiClient, ApiError } from "@/lib/api";
import {
  submitReferenceRun,
  pollReferenceRunResult,
  type ReferenceRunResult,
} from "@/lib/runs/reference";
import { clearDraft } from "@/lib/runs/draft";

const ids = {
  organization: "organization_00000000-0000-4000-8000-000000000001",
  project: "project_00000000-0000-4000-8000-000000000002",
  suite: "suite_00000000-0000-4000-8000-000000000003",
  target: "target_00000000-0000-4000-8000-000000000004",
} as const;

type SubmitState =
  | "idle"
  | "submitting"
  | "polling"
  | "stale"
  | "unauthorized";

export default function SubmitRunPage() {
  const { current: organization } = useOrganization();
  const [idempotencyKey] = useState(() => `reviewer-${crypto.randomUUID()}`);
  const [targetOrigin, setTargetOrigin] = useState("");
  const [result, setResult] = useState<ReferenceRunResult>();
  const [error, setError] = useState<string>();
  const [state, setState] = useState<SubmitState>("idle");
  const [pollingAttempt, setPollingAttempt] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentOrgRef = useRef(ids.organization);

  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl:
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
        getOrganizationId: () => ids.organization,
      }),
    [],
  );

  // Cleanup polling on unmount or org change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Detect organization change and cancel polling
  useEffect(() => {
    const newOrgId = ids.organization;
    if (currentOrgRef.current !== newOrgId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setState("idle");
        setResult(undefined);
        setError("Organization changed. Please submit again.");
        setPollingAttempt(0);
      }
      currentOrgRef.current = newOrgId;
    }
  }, [ids.organization]);

  async function startPolling(runId: string) {
    setState("polling");
    setError(undefined);
    setPollingAttempt(0);

    // Cancel any existing polling
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const pollingResult = await pollReferenceRunResult(
        client,
        runId,
        ids.organization,
        {
          maxAttempts: 60,
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          backoffMultiplier: 1.5,
          signal: abortControllerRef.current.signal,
          onAttempt: (attempt) => setPollingAttempt(attempt),
        },
      );

      if (pollingResult.isTerminal) {
        setResult(pollingResult.result);
        setState("idle");
      } else {
        // Max attempts reached without terminal state
        setState("stale");
        setResult(pollingResult.result);
        setError(
          "The reference run is still in progress. Please refresh to check for updates.",
        );
      }
    } catch (caught) {
      // Don't set error for intentional aborts (e.g., navigation)
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setState("idle");
        return;
      }

      if (caught instanceof ApiError) {
        if (caught.problem.status === 401 || caught.problem.status === 403) {
          setState("unauthorized");
          setError("You don't have permission to access this run.");
        } else {
          setState("idle");
          setError(
            caught.message || "Failed to fetch reference run results.",
          );
        }
      } else {
        setState("idle");
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to fetch reference run results.",
        );
      }
    } finally {
      abortControllerRef.current = null;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(undefined);
    setResult(undefined);
    setPollingAttempt(0);

    try {
      const submitResult = await submitReferenceRun(
        client,
        {
          projectId: ids.project,
          suiteId: ids.suite,
          suiteVersion: "1.0.0",
          targetId: ids.target,
          targetOrigin,
        },
        idempotencyKey,
      );

      // Clear draft on successful submission
      clearDraft();

      // Start polling for results
      await startPolling(submitResult.run.id);
    } catch (caught) {
      setState("idle");
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The API could not complete the reference run.",
      );
    }
  }

  const isLoading = state === "submitting" || state === "polling";

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
            disabled={isLoading}
            className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-cyan-100 disabled:opacity-50"
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

          <Button className="mt-6" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />{" "}
                {state === "polling"
                  ? `Polling (attempt ${pollingAttempt})`
                  : "Running check"}
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
              {state === "polling"
                ? "Waiting for backend to complete the probe..."
                : "Results appear here only after the backend completes the probe."}
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
