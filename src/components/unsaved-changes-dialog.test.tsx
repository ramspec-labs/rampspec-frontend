// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parametersChanged, UnsavedChangesDialog, useUnsavedChanges } from "./unsaved-changes-dialog";
afterEach(cleanup);
it("announces the dialog, defaults focus to staying, traps focus, and handles Escape", async () => {
  const stay = vi.fn(), leave = vi.fn(), user = userEvent.setup();
  render(<UnsavedChangesDialog onStay={stay} onLeave={leave} />);
  expect(screen.getByRole("alertdialog").getAttribute("aria-labelledby")).toBe("unsaved-title");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Stay and edit" }));
  await user.tab({ shift: true }); expect(document.activeElement).toBe(screen.getByRole("button", { name: "Leave page" }));
  await user.tab(); expect(document.activeElement).toBe(screen.getByRole("button", { name: "Stay and edit" }));
  await user.keyboard("{Escape}"); expect(stay).toHaveBeenCalledTimes(1); expect(leave).not.toHaveBeenCalled();
});
function Guard({ dirty = true, go = vi.fn() }: { dirty?: boolean; go?: (href: string) => void }) {
  const { dialog, allowNavigation } = useUnsavedChanges(dirty, go);
  return <><a href="/reports">Reports</a><a href="#section">Same page</a><a href="/reports" target="_blank">New tab</a><button onClick={allowNavigation}>Commit parameters</button>{dialog}</>;
}
it("intercepts a dirty navigation; staying preserves the page and restores trigger focus", () => {
  const go = vi.fn(); render(<Guard go={go} />); const link = screen.getByRole("link", { name: "Reports" });
  fireEvent.click(link); expect(screen.getByRole("alertdialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Stay and edit" }));
  expect(screen.queryByRole("alertdialog")).toBeNull(); expect(document.activeElement).toBe(link); expect(go).not.toHaveBeenCalled();
});
it("leaves only after confirmation and avoids a second unload prompt", () => {
  const go = vi.fn(); render(<Guard go={go} />); fireEvent.click(screen.getByRole("link", { name: "Reports" }));
  expect(go).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole("button", { name: "Leave page" }));
  expect(go).toHaveBeenCalledExactlyOnceWith(new URL("/reports", location.href).href);
  expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
});
it("warns for native unload/back/reload only while dirty and removes listeners on unmount", () => {
  const view = render(<Guard dirty={false} />); expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
  view.rerender(<Guard />); expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Commit parameters" })); expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
  view.unmount(); expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
});
it("does not block hash links or modified/new-tab navigation", () => {
  render(<Guard />); fireEvent.click(screen.getByRole("link", { name: "Same page" }));
  fireEvent.click(screen.getByRole("link", { name: "New tab" })); fireEvent.click(screen.getByRole("link", { name: "Reports" }), { ctrlKey: true });
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
it("detects meaningful changes, including cleared/invalid fields, but not reverted or equivalent timeouts", () => {
  const initial = { fixture: "sanitized-checkout", timeout: "120" };
  expect(parametersChanged(initial, initial)).toBe(false);
  expect(parametersChanged(initial, { ...initial, timeout: "0120" })).toBe(false);
  for (const timeout of ["", "30", "abc"]) expect(parametersChanged(initial, { ...initial, timeout })).toBe(true);
  expect(parametersChanged(initial, { ...initial, fixture: "empty-wallet" })).toBe(true);
});
