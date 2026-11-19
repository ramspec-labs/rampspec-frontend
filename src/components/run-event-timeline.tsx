"use client";
import { useEffect, useState } from "react";
import { ConnectionStatus } from "./feedback-state";
import { ReconnectingEventStream, type ConnectionState, type RunEvent } from "@/lib/runs/event-stream";

export function RunEventTimeline({ streamUrl }: { streamUrl?: string }) {
  return <Timeline key={streamUrl ?? "unavailable"} streamUrl={streamUrl} />;
}
function Timeline({ streamUrl }: { streamUrl?: string }) {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [events, setEvents] = useState<RunEvent[]>([]);
  useEffect(() => {
    if (!streamUrl) return;
    let active = true;
    const stream = new ReconnectingEventStream(streamUrl, event => {
      if (active) setEvents(previous => previous.some(item => item.id === event.id) ? previous : [...previous, event]);
    }, undefined, next => { if (active) setState(next); });
    stream.start();
    return () => { active = false; stream.stop(); };
  }, [streamUrl]);
  return <>
    <div className="mb-5 flex min-h-32 flex-col items-start justify-between gap-3 rounded-lg border border-line bg-surface p-5 shadow-panel sm:flex-row sm:items-center">
      <p className="text-sm font-semibold">Live event updates</p><ConnectionStatus state={state} />
    </div>
    {!streamUrl && <p className="mb-4 text-sm text-muted">Live updates are unavailable for this deployment.</p>}
    {events.length === 0 ? <p className="text-sm text-muted">No run events received.</p> : <ol className="space-y-3">{events.map(event => <li key={event.id} className="flex gap-4 rounded-lg border border-line bg-surface p-4"><time className="shrink-0 text-xs text-muted">{event.at}</time><div><p className="font-medium">{event.message}</p><p className="mt-1 text-xs capitalize text-muted">{event.type}</p></div></li>)}</ol>}
  </>;
}
