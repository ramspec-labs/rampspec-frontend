import { afterEach, describe, expect, it, vi } from "vitest";
import { ReconnectingEventStream } from "./event-stream";
function source() { return { onopen: null, onerror: null, onmessage: null, close: vi.fn(), readyState: 0 } as unknown as EventSource; }
afterEach(() => vi.useRealTimers());
describe("connection state", () => {
  it("connects once, reports an open connection, and closes on stop", () => {
    const current = source(), connect = vi.fn(() => current), state = vi.fn();
    const stream = new ReconnectingEventStream("https://stream.example/run", vi.fn(), connect, state);
    expect(stream.connectionState).toBe("disconnected"); stream.start(); stream.start();
    expect(connect).toHaveBeenCalledTimes(1); expect(state).toHaveBeenLastCalledWith("connecting");
    current.onopen?.(new Event("open")); expect(stream.connectionState).toBe("connected");
    stream.stop(); expect(current.close).toHaveBeenCalledTimes(1); expect(stream.connectionState).toBe("disconnected");
  });
  it("backs off transient errors, caps the delay, and resets it after reconnecting", () => {
    vi.useFakeTimers(); const sources: EventSource[] = [];
    const connect = vi.fn(() => { const next = source(); sources.push(next); return next; });
    const stream = new ReconnectingEventStream("https://stream.example/run", vi.fn(), connect);
    stream.start();
    for (const delay of [1000, 2000, 4000, 8000, 15000, 15000]) {
      sources.at(-1)!.onerror?.(new Event("error")); expect(stream.connectionState).toBe("retrying");
      const count = connect.mock.calls.length; vi.advanceTimersByTime(delay - 1); expect(connect).toHaveBeenCalledTimes(count);
      vi.advanceTimersByTime(1); expect(connect).toHaveBeenCalledTimes(count + 1);
    }
    sources.at(-1)!.onopen?.(new Event("open")); sources.at(-1)!.onerror?.(new Event("error"));
    const count = connect.mock.calls.length; vi.advanceTimersByTime(1000); expect(connect).toHaveBeenCalledTimes(count + 1); stream.stop();
  });
  it("ignores late callbacks and cancels queued retries after stop", () => {
    vi.useFakeTimers(); const current = source(), connect = vi.fn(() => current), event = vi.fn();
    const stream = new ReconnectingEventStream("https://stream.example/run", event, connect);
    stream.start(); const lateOpen = current.onopen!, lateMessage = current.onmessage!;
    current.onerror?.(new Event("error")); stream.stop(); vi.runAllTimers();
    lateOpen.call(current, new Event("open")); lateMessage.call(current, new MessageEvent("message", { data: JSON.stringify({ id: "1", type: "check", at: "now", message: "late" }) }));
    expect(event).not.toHaveBeenCalled(); expect(connect).toHaveBeenCalledTimes(1); expect(stream.connectionState).toBe("disconnected");
  });
  it("stops permanently rejected sources and handles constructor failures", () => {
    vi.useFakeTimers(); const current = source(); Object.defineProperty(current, "readyState", { value: 2 });
    const connect = vi.fn(() => current), stream = new ReconnectingEventStream("https://stream.example/run", vi.fn(), connect);
    stream.start(); current.onerror?.(new Event("error")); vi.runAllTimers(); expect(connect).toHaveBeenCalledTimes(1); expect(stream.connectionState).toBe("disconnected");
    const failing = new ReconnectingEventStream("https://stream.example/run", vi.fn(), () => { throw new Error("unavailable"); });
    failing.start(); expect(failing.connectionState).toBe("retrying"); failing.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it("ignores malformed data without suppressing valid events", () => {
    const current = source(), received = vi.fn(), stream = new ReconnectingEventStream("https://stream.example/run", received, () => current);
    stream.start(); for (const data of ["invalid", "null", "{}", '{"type":"check"}']) current.onmessage?.(new MessageEvent("message", { data }));
    const event = { id: "1", type: "check", at: "2026-11-19T00:00:00Z", message: "Synthetic event" };
    current.onmessage?.(new MessageEvent("message", { data: JSON.stringify(event) })); expect(received).toHaveBeenCalledExactlyOnceWith(event); stream.stop();
  });
});
