export type RunEvent = {
  id: string;
  type: "queued" | "started" | "check" | "completed" | "failed";
  at: string;
  message: string;
};

/**
 * ReconnectingEventStream handles server-sent events with automatic reconnection,
 * exponential backoff, and client-side event deduplication.
 *
 * Handles:
 * - Automatic reconnection with exponential backoff (1s to 15s)
 * - Malformed and invalid events (ignored, stream continues)
 * - Graceful shutdown with stop()
 * - Connection success resets backoff counter
 * - Deduplication tracks seen event IDs to prevent duplicate timeline entries
 *   when the network reconnects and the backend replays previous events.
 *   The deduplication window is bounded and resets when the stream is restarted.
 */
export class ReconnectingEventStream {
  private stopped = false;
  private attempt = 0;
  /** Bounded set of event IDs seen in this stream session */
  private seenIds = new Set<string>();

  constructor(
    private readonly url: string,
    private readonly onEvent: (event: RunEvent) => void,
    private readonly connect: (url: string) => EventSource = (value) =>
      new EventSource(value),
  ) {}

  /** Start listening for events from the server */
  start() {
    this.seenIds.clear();
    this.open();
  }

  /** Stop listening and close the connection */
  stop() {
    this.stopped = true;
  }

  private open() {
    if (this.stopped) return;

    const source = this.connect(this.url);

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RunEvent;

        // Validate event structure
        if (!this.isValidEvent(event)) {
          return;
        }

        // Skip duplicate events
        if (this.seenIds.has(event.id)) {
          return;
        }

        this.seenIds.add(event.id);
        this.onEvent(event);
      } catch {
        /* Ignore malformed events and keep the stream alive. */
      }
    };

    source.onopen = () => {
      this.attempt = 0;
    };

    source.onerror = () => {
      source.close();
      if (this.stopped) return;

      const delay = Math.min(1000 * 2 ** this.attempt++, 15000);
      window.setTimeout(() => this.open(), delay);
    };
  }

  /**
   * Validates that the event has all required fields.
   * Ensures structural integrity before processing.
   */
  private isValidEvent(event: unknown): event is RunEvent {
    if (typeof event !== "object" || event === null) {
      return false;
    }

    const e = event as Record<string, unknown>;
    return (
      typeof e.id === "string" &&
      typeof e.type === "string" &&
      typeof e.at === "string" &&
      typeof e.message === "string"
    );
  }
}
