import { AppShell } from "@/components/app-shell";
import { RunEventTimeline } from "@/components/run-event-timeline";
export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  // No SSE route is published by the current backend. Deployment configuration
  // supplies the actual endpoint; missing configuration cannot mean connected.
  const template = process.env.RAMPSPEC_RUN_EVENT_STREAM_URL;
  let streamUrl: string | undefined;
  if (template?.includes("{runId}")) {
    try {
      const url = new URL(template.replaceAll("{runId}", encodeURIComponent(runId)));
      if (url.protocol === "https:" && !url.username && !url.password && !url.hash) streamUrl = url.href;
    } catch { /* Invalid configuration leaves the transport disconnected. */ }
  }
  return <AppShell title={`Run ${runId}`} description="Live backend event timeline."><RunEventTimeline streamUrl={streamUrl} /></AppShell>;
}
