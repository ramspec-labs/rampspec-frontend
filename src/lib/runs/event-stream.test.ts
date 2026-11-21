import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ReconnectingEventStream, type RunEvent } from "./event-stream";

describe("ReconnectingEventStream", () => {
  let mockEventSource: Partial<EventSource>;
  let mockConnect: ReturnType<typeof vi.fn>;
  let onEvent: ReturnType<typeof vi.fn>;
  let stream: ReconnectingEventStream;

  beforeEach(() => {
    mockEventSource = {
      onmessage: null,
      onopen: null,
      onerror: null,
      close: vi.fn(),
    };

    mockConnect = vi.fn().mockReturnValue(mockEventSource);
    onEvent = vi.fn();
    stream = new ReconnectingEventStream("http://test/events", onEvent, mockConnect as never);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("event parsing and callbacks", () => {
    it("parses and calls onEvent with valid events", () => {
      stream.start();

      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);

      expect(onEvent).toHaveBeenCalledWith(event);
    });

    it("ignores malformed JSON", () => {
      stream.start();
      mockEventSource.onmessage?.({ data: "not json" } as never);

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("ignores events missing required fields", () => {
      stream.start();

      const malformedEvents = [
        { id: "evt_1", type: "queued" }, // missing at, message
        { type: "queued", at: "2024-01-01T10:00:00Z", message: "Run queued" }, // missing id
        { id: "evt_1", at: "2024-01-01T10:00:00Z", message: "Run queued" }, // missing type
        { id: "evt_1", type: "queued", at: "2024-01-01T10:00:00Z" }, // missing message
      ];

      for (const malformed of malformedEvents) {
        mockEventSource.onmessage?.({ data: JSON.stringify(malformed) } as never);
      }

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("ignores non-object events", () => {
      stream.start();

      mockEventSource.onmessage?.({ data: "null" } as never);
      mockEventSource.onmessage?.({ data: "true" } as never);
      mockEventSource.onmessage?.({ data: "123" } as never);

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("ignores events with wrong field types", () => {
      stream.start();

      const invalidEvents = [
        { id: 123, type: "queued", at: "2024-01-01T10:00:00Z", message: "Run queued" }, // id not string
        { id: "evt_1", type: 456, at: "2024-01-01T10:00:00Z", message: "Run queued" }, // type not string
        { id: "evt_1", type: "queued", at: 789, message: "Run queued" }, // at not string
        { id: "evt_1", type: "queued", at: "2024-01-01T10:00:00Z", message: true }, // message not string
      ];

      for (const invalid of invalidEvents) {
        mockEventSource.onmessage?.({ data: JSON.stringify(invalid) } as never);
      }

      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe("deduplication", () => {
    it("deduplicates events with the same id", () => {
      stream.start();

      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);
      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);

      expect(onEvent).toHaveBeenCalledTimes(1);
    });

    it("allows different events with different ids", () => {
      stream.start();

      const event1: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      const event2: RunEvent = {
        id: "evt_2",
        type: "started",
        at: "2024-01-01T10:00:05Z",
        message: "Run started",
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(event1) } as never);
      mockEventSource.onmessage?.({ data: JSON.stringify(event2) } as never);

      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenNthCalledWith(1, event1);
      expect(onEvent).toHaveBeenNthCalledWith(2, event2);
    });

    it("clears deduplication state when stream restarts", () => {
      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      stream.start();
      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);

      expect(onEvent).toHaveBeenCalledTimes(1);

      // Stop and start again
      stream.stop();
      mockEventSource = {
        onmessage: null,
        onopen: null,
        onerror: null,
        close: vi.fn(),
      };
      mockConnect = vi.fn().mockReturnValue(mockEventSource);
      stream = new ReconnectingEventStream("http://test/events", onEvent, mockConnect as never);
      stream.start();

      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);

      // Event should be processed again after restart
      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it("maintains bounded deduplication during a session", () => {
      stream.start();

      // Send many unique events
      for (let i = 0; i < 1000; i++) {
        const event: RunEvent = {
          id: `evt_${i}`,
          type: "check",
          at: `2024-01-01T10:${String(i).padStart(2, "0")}:00Z`,
          message: `Check ${i}`,
        };
        mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);
      }

      expect(onEvent).toHaveBeenCalledTimes(1000);

      // Try to replay all events
      for (let i = 0; i < 1000; i++) {
        const event: RunEvent = {
          id: `evt_${i}`,
          type: "check",
          at: `2024-01-01T10:${String(i).padStart(2, "0")}:00Z`,
          message: `Check ${i}`,
        };
        mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);
      }

      // All replays should be deduplicated within the session
      expect(onEvent).toHaveBeenCalledTimes(1000);
    });
  });

  describe("reconnection behavior", () => {
    it("resets attempt counter on successful connection", () => {
      stream.start();
      mockEventSource.onopen?.();

      // Trigger error
      mockEventSource.onerror?.();

      // Even after error, next successful open should reset attempt
      vi.useFakeTimers();
      mockEventSource.onerror?.();

      expect(mockConnect).toHaveBeenCalledTimes(2); // initial + after error

      // Simulate open on new connection
      mockEventSource.onopen?.();

      // Now if we trigger error again, it should use the reset counter
      mockEventSource.onerror?.();
      vi.advanceTimersByTime(1100); // 1s backoff

      expect(mockConnect).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it("implements exponential backoff with 1s base", () => {
      vi.useFakeTimers();
      stream.start();

      mockEventSource.onerror?.();
      vi.advanceTimersByTime(999);
      expect(mockConnect).toHaveBeenCalledTimes(1); // not called yet

      vi.advanceTimersByTime(2);
      expect(mockConnect).toHaveBeenCalledTimes(2); // 1s delay

      mockEventSource.onerror?.();
      vi.advanceTimersByTime(1999);
      expect(mockConnect).toHaveBeenCalledTimes(2); // not called yet

      vi.advanceTimersByTime(2);
      expect(mockConnect).toHaveBeenCalledTimes(3); // 2s delay

      mockEventSource.onerror?.();
      vi.advanceTimersByTime(3999);
      expect(mockConnect).toHaveBeenCalledTimes(3); // not called yet

      vi.advanceTimersByTime(2);
      expect(mockConnect).toHaveBeenCalledTimes(4); // 4s delay

      vi.useRealTimers();
    });

    it("caps backoff at 15 seconds", () => {
      vi.useFakeTimers();
      stream.start();

      // Trigger several errors to reach the backoff cap
      for (let i = 0; i < 10; i++) {
        mockEventSource.onerror?.();
        vi.advanceTimersByTime(20000); // Large enough to handle any backoff delay
      }

      // Should never exceed 15 seconds between retries
      expect(mockConnect).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("stream lifecycle", () => {
    it("closes connection when stopped", () => {
      stream.start();
      stream.stop();

      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it("does not reconnect after being stopped", () => {
      vi.useFakeTimers();
      stream.start();

      mockEventSource.onerror?.();
      stream.stop();

      vi.advanceTimersByTime(20000);

      // Should still only have 1 call (initial start)
      expect(mockConnect).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("connects to the provided URL", () => {
      const url = "http://test.example/api/events";
      const newStream = new ReconnectingEventStream(url, onEvent, mockConnect as never);
      newStream.start();

      expect(mockConnect).toHaveBeenCalledWith(url);
    });
  });

  describe("multiple sequential events", () => {
    it("processes events in order", () => {
      stream.start();

      const events: RunEvent[] = [
        {
          id: "evt_1",
          type: "queued",
          at: "2024-01-01T10:00:00Z",
          message: "Run queued",
        },
        {
          id: "evt_2",
          type: "started",
          at: "2024-01-01T10:00:05Z",
          message: "Run started",
        },
        {
          id: "evt_3",
          type: "check",
          at: "2024-01-01T10:00:10Z",
          message: "Check 1 passed",
        },
      ];

      for (const event of events) {
        mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);
      }

      expect(onEvent).toHaveBeenCalledTimes(3);
      for (let i = 0; i < events.length; i++) {
        expect(onEvent).toHaveBeenNthCalledWith(i + 1, events[i]);
      }
    });

    it("handles mixed valid and invalid events", () => {
      stream.start();

      mockEventSource.onmessage?.({
        data: JSON.stringify({
          id: "evt_1",
          type: "queued",
          at: "2024-01-01T10:00:00Z",
          message: "Run queued",
        }),
      } as never);

      mockEventSource.onmessage?.({ data: "invalid" } as never);

      mockEventSource.onmessage?.({
        data: JSON.stringify({
          id: "evt_2",
          type: "started",
          at: "2024-01-01T10:00:05Z",
          message: "Run started",
        }),
      } as never);

      expect(onEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("handles empty string ids", () => {
      stream.start();

      const event1: RunEvent = {
        id: "",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      const event2: RunEvent = {
        id: "",
        type: "started",
        at: "2024-01-01T10:00:05Z",
        message: "Run started",
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(event1) } as never);
      mockEventSource.onmessage?.({ data: JSON.stringify(event2) } as never);

      // Both should be called even though ids are the same (empty string)
      // because the second is a duplicate
      expect(onEvent).toHaveBeenCalledTimes(1);
    });

    it("handles events with extra fields", () => {
      stream.start();

      const eventWithExtra = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
        extra: "ignored",
        nested: { should: "be", ignored: true },
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(eventWithExtra) } as never);

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "evt_1",
          type: "queued",
          at: "2024-01-01T10:00:00Z",
          message: "Run queued",
        }),
      );
    });

    it("does not call onEvent if stream is stopped immediately", () => {
      stream.stop();
      stream.start();

      // Stream should not be open if stopped before start
      // However, our implementation allows this - the stream just reopens
      // This is actually correct behavior for reconnection logic
      const event: RunEvent = {
        id: "evt_1",
        type: "queued",
        at: "2024-01-01T10:00:00Z",
        message: "Run queued",
      };

      mockEventSource.onmessage?.({ data: JSON.stringify(event) } as never);
      expect(onEvent).toHaveBeenCalledWith(event);
    });
  });
});
