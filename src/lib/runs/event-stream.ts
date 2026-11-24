export type RunEvent = { id: string; type: "queued" | "started" | "check" | "completed" | "failed"; at: string; message: string };
export type ConnectionState = "connecting" | "connected" | "retrying" | "disconnected";

/** Describes the transport, never the outcome of a run. */
export class ReconnectingEventStream {
  private stopped = true;
  private attempt = 0;
  private source: EventSource | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private state: ConnectionState = "disconnected";
  constructor(
    private readonly url: string,
    private readonly onEvent: (event: RunEvent) => void,
    private readonly connect: (url: string) => EventSource = value => new EventSource(value),
    private readonly onState: (state: ConnectionState) => void = () => {},
  ) {}
  get connectionState(): ConnectionState { return this.state; }
  start() {
    if (!this.stopped) return;
    this.stopped = false; this.attempt = 0;
    this.transition("connecting"); this.open();
  }
  stop() {
    this.stopped = true; clearTimeout(this.timer); this.timer = undefined;
    const source = this.source; this.source = undefined;
    if (source) { source.onopen = source.onmessage = source.onerror = null; source.close(); }
    this.transition("disconnected");
  }
  private transition(state: ConnectionState) {
    if (this.state === state) return;
    this.state = state; this.onState(state);
  }
  private retry() {
    if (this.stopped) return;
    this.transition("retrying");
    const delay = Math.min(1000 * 2 ** Math.min(this.attempt++, 4), 15000);
    this.timer = setTimeout(() => { this.timer = undefined; this.open(); }, delay);
  }
  private open() {
    if (this.stopped) return;
    let source: EventSource;
    try { source = this.connect(this.url); } catch { this.retry(); return; }
    this.source = source;
    const current = () => !this.stopped && this.source === source;
    source.onmessage = message => {
      if (!current()) return;
      try { const event: unknown = JSON.parse(message.data); if (isRunEvent(event)) this.onEvent(event); }
      catch { /* Ignore malformed messages without changing transport state. */ }
    };
    source.onopen = () => { if (current()) { this.attempt = 0; this.transition("connected"); } };
    source.onerror = () => {
      if (!current()) return;
      // Permanently closed/rejected connections must not be recreated forever.
      const closed = source.readyState === 2;
      this.source = undefined;
      source.onopen = source.onmessage = source.onerror = null; source.close();
      if (closed) this.stop(); else this.retry();
    };
  }
}
function isRunEvent(value: unknown): value is RunEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RunEvent>;
  return typeof event.id === "string" && typeof event.at === "string" && typeof event.message === "string"
    && ["queued", "started", "check", "completed", "failed"].includes(event.type ?? "");
}
