import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RunEvent } from "./event-stream";
import { RunEventManager, fetchRunState } from "./state";

describe("fetchRunState", () => {
  it("fetches the run state from the API", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      id: "run_1",
      status: "executing" as const,
      events: [
        {
          id: "evt_1",
          type: "queued" as const,
          at: "2024-01-01T00:00:00Z",
          message: "Run queued",
        },
      ],
    });

    const result = await fetchRunState({ get: mockGet } as never, "run_1");

    expect(mockGet).toHaveBeenCalledWith("/v1/runs/run_1");
    expect(result.id).toBe("run_1");
    expect(result.status).toBe("executing");
    expect(result.events).toHaveLength(1);
  });

  it("returns empty events when no events exist", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      id: "run_1",
      status: "queued" as const,
      events: [],
    });

    const result = await fetchRunState({ get: mockGet } as never, "run_1");

    expect(result.events).toEqual([]);
  });
});

describe("RunEventManager", () => {
  let mockEventSource: {
    onmessage: ((event: MessageEvent) => void) | null;
    onopen: (() => void) | null;
    onerror: (() => void) | null;
    close: () => void;
  };
  let mockEventSourceConstructor: (url: string) => typeof mockEventSource;

  beforeEach(() => {
    mockEventSource = {
      onmessage: null,
      onopen: null,
      onerror: null,
      close: vi.fn(),
    };
    mockEventSourceConstructor = vi.fn(() => mockEventSource);
  });

  describe("event deduplication", () => {
    it("deduplicates initial events and streamed events", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      const initialEvent: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T00:00:00Z",
        message: "Run queued",
      };

      manager.start([initialEvent]);

      // Try to send the same event through the stream
      mockEventSource.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify(initialEvent),
        }),
      );

      expect(onEventsUpdate).not.toHaveBeenCalled();
    });

    it("accepts new events not in the initial state", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      const initialEvent: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T00:00:00Z",
        message: "Run queued",
      };

      manager.start([initialEvent]);

      const newEvent: RunEvent = {
        id: "evt_2",
        type: "started",
        at: "2024-01-01T00:00:01Z",
        message: "Run started",
      };

      mockEventSource.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(newEvent) }),
      );

      expect(onEventsUpdate).toHaveBeenCalledWith([newEvent]);
    });

    it("deduplicates repeated streamed events", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      manager.start([]);

      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T00:00:00Z",
        message: "Run queued",
      };

      mockEventSource.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(event) }),
      );
      mockEventSource.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(event) }),
      );

      expect(onEventsUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("stream management", () => {
    it("creates EventSource with correct event stream URL", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      manager.start([]);

      expect(mockEventSourceConstructor).toHaveBeenCalledWith(
        "http://example.com/v1/runs/run_1/events",
      );
    });

    it("calls onEventsUpdate with new events", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      manager.start([]);

      const events: RunEvent[] = [
        {
          id: "evt_1",
          type: "queued",
          at: "2024-01-01T00:00:00Z",
          message: "Run queued",
        },
        {
          id: "evt_2",
          type: "started",
          at: "2024-01-01T00:00:01Z",
          message: "Run started",
        },
      ];

      events.forEach((event) => {
        mockEventSource.onmessage?.(
          new MessageEvent("message", { data: JSON.stringify(event) }),
        );
      });

      expect(onEventsUpdate).toHaveBeenCalledTimes(2);
      expect(onEventsUpdate).toHaveBeenNthCalledWith(1, [events[0]]);
      expect(onEventsUpdate).toHaveBeenNthCalledWith(2, [events[1]]);
    });

    it("stops the stream when stop() is called", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      manager.start([]);
      manager.stop();

      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe("initial state handling", () => {
    it("preserves order of initial events", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      const initialEvents: RunEvent[] = [
        {
          id: "evt_1",
          type: "queued",
          at: "2024-01-01T00:00:00Z",
          message: "Run queued",
        },
        {
          id: "evt_2",
          type: "started",
          at: "2024-01-01T00:00:01Z",
          message: "Run started",
        },
      ];

      manager.start(initialEvents);

      // Verify all initial events are tracked
      const newEvent: RunEvent = {
        id: "evt_3",
        type: "check",
        at: "2024-01-01T00:00:02Z",
        message: "Check complete",
      };

      mockEventSource.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(newEvent) }),
      );

      expect(onEventsUpdate).toHaveBeenCalledWith([newEvent]);
    });

    it("handles empty initial state", () => {
      const onEventsUpdate = vi.fn();
      const manager = new RunEventManager(
        "run_1",
        "http://example.com",
        onEventsUpdate,
        mockEventSourceConstructor,
      );

      manager.start([]);

      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T00:00:00Z",
        message: "Run queued",
      };

      mockEventSource.onmessage?.(
        new MessageEvent("message", { data: JSON.stringify(event) }),
      );

      expect(onEventsUpdate).toHaveBeenCalledWith([event]);
    });
  });
});
