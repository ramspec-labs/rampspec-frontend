import { AlertTriangle, Inbox, LockKeyhole, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ConnectionState } from "@/lib/runs/event-stream";

const connectionLabels: Record<ConnectionState, string> = {
  connecting: "Connecting to live updates", connected: "Connected to live updates",
  retrying: "Connection interrupted. Retrying live updates", disconnected: "Live updates disconnected",
};
export function ConnectionStatus({ state }: { state: ConnectionState }) {
  return <p role="status" aria-live="polite" aria-atomic="true" className="min-h-12 w-full shrink-0 text-left text-sm sm:w-64 sm:text-right">{connectionLabels[state]}</p>;
}

type StateProps = { title: string; description: string; action?: ReactNode };

function State({ icon, title, description, action }: StateProps & { icon: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center"><div className="mb-3 text-muted">{icon}</div><h2 className="font-semibold">{title}</h2><p className="mt-1 max-w-md text-sm text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function LoadingState() { return <State icon={<LoaderCircle className="animate-spin" />} title="Loading workspace data" description="The latest backend-authoritative state is being retrieved." />; }
export function EmptyState(props: StateProps) { return <State icon={<Inbox />} {...props} />; }
export function DeniedState(props: StateProps) { return <State icon={<LockKeyhole />} {...props} />; }
export function ErrorState(props: StateProps) { return <State icon={<AlertTriangle />} {...props} />; }
