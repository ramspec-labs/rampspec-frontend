// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Page from "./page";
afterEach(cleanup);
it("warns for edits, keeps them on Stay, and stops warning after reverting", () => {
  render(<Page />);
  expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
  const field = screen.getByLabelText("Fixture set") as HTMLSelectElement;
  fireEvent.change(field, { target: { value: "empty-wallet" } });
  expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(false);
  fireEvent.click(screen.getByRole("link", { name: "Reports" }));
  fireEvent.click(screen.getByRole("button", { name: "Stay and edit" })); expect(field.value).toBe("empty-wallet");
  fireEvent.change(field, { target: { value: "sanitized-checkout" } });
  expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
});
