import type { ApiClient } from "@/lib/api";
import { ReconnectingEventStream, type RunEvent } from "./event-stream";

export type RunState = {
  id: string;
  status: "queued" | "executing" | "completed" | "failed";
  events: RunEvent[];
};

/**
 * Fetches the initial run state and events from the API.
 *
 * This returns the current run status and any events already recorded.
 * Used to initialize the UI with existing data before streaming new events.
 */
export async function fetchRunState(
  client: Pick<ApiClient, "get">,
  runId: string,
): Promise<RunState> {
  return client.get<RunState>(`/v1/runs/${runId}`);
}

/**
 * Manages streaming run events with proper deduplication and state reconciliation.
 *
 * Ensures:
 * - Events are deduplicated by ID
 * - Reconnections don't lose events
 * - Malformed events are ignored
 * - Initial state is preserved
 */
export class RunEventManager {
  private stream: ReconnectingEventStream | null = null;
  private seenEventIds = new Set<string>();

  constructor(
    private readonly runId: string,
    private readonly baseUrl: string,
    private readonly onEventsUpdate: (events: RunEvent[]) => void,
    private readonly connect?: (url: string) => EventSource,
  ) {}

  /**
   * Starts streaming events for a run.
   *
   * @param initialEvents - Events already fetched from the initial state
   */
  start(initialEvents: RunEvent[]) {
    // Track initially fetched events to deduplicate streamed events
    initialEvents.forEach((event) => {
      this.seenEventIds.add(event.id);
    });

    const streamUrl = `${this.baseUrl}/v1/runs/${this.runId}/events`;

    this.stream = new ReconnectingEventStream(
      streamUrl,
      (event) => this.handleNewEvent(event),
      this.connect,
    );

    this.stream.start();
  }

  /**
   * Stops the event stream and cleans up resources.
   */
  stop() {
    this.stream?.stop();
    this.stream = null;
  }

  private handleNewEvent(event: RunEvent) {
    // Skip duplicate events (already in initial state or previously seen)
    if (this.seenEventIds.has(event.id)) {
      return;
    }

    this.seenEventIds.add(event.id);

    // Notify the observer of the new event
    // The callback is responsible for managing the full event list
    this.onEventsUpdate([event]);
  }
}
