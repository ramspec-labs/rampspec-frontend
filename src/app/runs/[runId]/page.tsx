"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RunEvent } from "@/lib/runs/event-stream";
import { RunEventManager, fetchRunState } from "@/lib/runs/state";
import { ApiClient } from "@/lib/api";

type StreamStatus = "loading" | "connected" | "error" | "unauthorized";

export default function RunPage({ params }: { params: { runId: string } }) {
  const { runId } = params;
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("loading");
  const [runStatus, setRunStatus] = useState<
    "queued" | "executing" | "completed" | "failed"
  >("executing");
  const [manager, setManager] = useState<RunEventManager | null>(null);

  useEffect(() => {
    let isMounted = true;
    let eventManager: RunEventManager | null = null;

    const initializeStream = async () => {
      try {
        // Create API client with public configuration
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          console.error("NEXT_PUBLIC_API_BASE_URL not configured");
          if (isMounted) setStatus("error");
          return;
        }

        const client = new ApiClient({ baseUrl });

        // Fetch initial run state
        const runState = await client.get(`/v1/runs/${runId}`);

        if (!isMounted) return;

        // Set initial events and status
        setEvents(runState.events || []);
        setRunStatus(runState.status);

        // Initialize event manager
        eventManager = new RunEventManager(
          runId,
          baseUrl,
          (newEvents) => {
            if (isMounted) {
              setEvents((prev) => [...prev, ...newEvents]);
            }
          },
        );

        // Start streaming new events
        eventManager.start(runState.events || []);
        setManager(eventManager);
        setStatus("connected");
      } catch (error) {
        if (!isMounted) return;

        console.error("Failed to fetch run state:", error);

        if (error instanceof Error && error.message.includes("401")) {
          setStatus("unauthorized");
        } else {
          setStatus("error");
        }
      }
    };

    initializeStream();

    return () => {
      isMounted = false;
      eventManager?.stop();
    };
  }, [runId]);

  const statusLabel =
    runStatus === "completed"
      ? "Completed"
      : runStatus === "failed"
        ? "Failed"
        : runStatus === "queued"
          ? "Queued"
          : "Executing checks";

  const statusBadgeType =
    runStatus === "completed"
      ? "success"
      : runStatus === "failed"
        ? "error"
        : status === "connected"
          ? "info"
          : "warning";

  return (
    <AppShell title={`Run ${runId}`} description="Live backend event timeline.">
      <div className="mb-5 flex items-center justify-between rounded-lg border border-line bg-surface p-5 shadow-panel">
        <div>
          <p className="text-sm text-muted">Current status</p>
          <p className="mt-1 text-lg font-bold">{statusLabel}</p>
        </div>
        <StatusBadge status={statusBadgeType}>
          {status === "loading"
            ? "Loading..."
            : status === "connected"
              ? "Connected"
              : status === "error"
                ? "Error"
                : "Unauthorized"}
        </StatusBadge>
      </div>

      {status === "error" && (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Failed to load run events. Please refresh the page.
          </p>
        </div>
      )}

      {status === "unauthorized" && (
        <div className="mb-5 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            You don't have permission to view this run.
          </p>
        </div>
      )}

      {events.length === 0 && status === "connected" && (
        <div className="rounded-lg border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">No events yet. Waiting for run to start...</p>
        </div>
      )}

      {events.length > 0 && (
        <ol className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex gap-4 rounded-lg border border-line bg-surface p-4"
            >
              <time className="w-24 shrink-0 text-xs text-muted">
                {new Date(event.at).toLocaleTimeString()}
              </time>
              <div className="flex-1">
                <p className="font-medium">{event.message}</p>
                <p className="mt-1 text-xs capitalize text-muted">{event.type}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
