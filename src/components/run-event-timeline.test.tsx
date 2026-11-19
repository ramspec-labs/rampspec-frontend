// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RunEventTimeline } from "./run-event-timeline";
class FakeSource {
  static instances: FakeSource[] = [];
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();
  constructor(public url: string) { FakeSource.instances.push(this); }
}
beforeEach(() => { FakeSource.instances = []; vi.stubGlobal("EventSource", FakeSource); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it("announces connected, retrying and disconnected text through the same live region", () => {
  vi.useFakeTimers(); const view = render(<RunEventTimeline streamUrl="https://stream.example/run-1" />);
  const status = screen.getByRole("status"); expect(status.textContent).toContain("Connecting");
  expect(status.getAttribute("aria-live")).toBe("polite"); expect(status.getAttribute("aria-atomic")).toBe("true");
  act(() => FakeSource.instances[0].onopen?.(new Event("open"))); expect(status.textContent).toContain("Connected");
  act(() => FakeSource.instances[0].onerror?.(new Event("error"))); expect(status.textContent).toContain("Retrying");
  act(() => vi.advanceTimersByTime(1000));
  FakeSource.instances[1].readyState = 2;
  act(() => FakeSource.instances[1].onerror?.(new Event("error"))); expect(status.textContent).toContain("disconnected");
  expect(screen.getByRole("status")).toBe(status); view.unmount();
});
it("never claims connected without configuration and provides an empty state", () => {
  render(<RunEventTimeline />); expect(screen.getByRole("status").textContent).toContain("disconnected");
  expect(screen.getByText("No run events received.")).toBeTruthy(); expect(FakeSource.instances).toHaveLength(0);
});
it("discards stale events when changing runs and closes the previous connection", () => {
  const view = render(<RunEventTimeline streamUrl="https://stream.example/run-1" />);
  const first = FakeSource.instances[0], late = first.onmessage!;
  act(() => first.onmessage?.(new MessageEvent("message", { data: JSON.stringify({ id: "1", type: "check", at: "now", message: "Old run" }) })));
  expect(screen.getByText("Old run")).toBeTruthy();
  view.rerender(<RunEventTimeline streamUrl="https://stream.example/run-2" />); expect(first.close).toHaveBeenCalledTimes(1);
  act(() => late(new MessageEvent("message", { data: JSON.stringify({ id: "2", type: "check", at: "now", message: "Late old event" }) })));
  expect(screen.queryByText("Old run")).toBeNull(); expect(screen.queryByText("Late old event")).toBeNull();
  expect(screen.getByRole("status").textContent).toContain("Connecting");
});
