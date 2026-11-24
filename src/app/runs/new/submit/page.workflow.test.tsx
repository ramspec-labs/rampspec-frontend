// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "./page";
import { ApiError } from "@/lib/api";
const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async original => ({
  ...await original<object>(),
  ApiClient: class {
    postWithMetadata = (...args: unknown[]) =>
      post(...args).then((data: unknown) => ({ data, headers: { status: 201 } }));
  },
}));
afterEach(cleanup); beforeEach(() => { post.mockReset(); });
it("provides immediate linked feedback and sends no request for invalid input", () => {
  render(<Page />); const field = screen.getByLabelText("Target origin");
  fireEvent.change(field, { target: { value: "http://bad.example" } });
  expect(field.getAttribute("aria-invalid")).toBe("true"); expect(field.getAttribute("aria-describedby")).toContain("target-origin-error");
  expect(screen.getByText(/Use an HTTPS origin/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Run reference check" })); expect(post).not.toHaveBeenCalled();
});
it("maps backend origin validation to the field and clears stale feedback on edit", async () => {
  post.mockRejectedValue(new ApiError({ status: 400, title: "Bad request", detail: "Target origin is not approved", type: "about:blank" }));
  render(<Page />); const field = screen.getByLabelText("Target origin");
  fireEvent.change(field, { target: { value: "HTTPS://Anchor.Example:443/" } });
  fireEvent.click(screen.getByRole("button", { name: "Run reference check" }));
  await screen.findByText("Target origin is not approved"); expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(post.mock.calls[0][1].targetOrigin).toBe("https://anchor.example");
  fireEvent.change(field, { target: { value: "https://other.example" } }); expect(screen.queryByText("Target origin is not approved")).toBeNull();
});
it("blocks duplicate sends and reports authorization errors without rewriting backend results", async () => {
  let reject!: (error: Error) => void; post.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  render(<Page />); fireEvent.change(screen.getByLabelText("Target origin"), { target: { value: "https://anchor.example" } });
  const button = screen.getByRole("button", { name: "Run reference check" }); fireEvent.click(button); fireEvent.click(button);
  expect(post).toHaveBeenCalledTimes(1); expect((screen.getByLabelText("Target origin") as HTMLInputElement).disabled).toBe(true);
  reject(new ApiError({ status: 403, title: "Forbidden", type: "about:blank" })); await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Forbidden"));
  expect(screen.getByLabelText("Target origin").getAttribute("aria-invalid")).toBe("false");
});
it("renders backend results, clears them on edit, and separates new targets from retries", async () => {
  const result = { targetOrigin: "https://anchor.example", run: { id: "run_synthetic", state: "completed" }, report: { reportId: "report_synthetic", evidenceManifestHash: "synthetic", summary: { passed: 3, warnings: 1, failed: 0, skipped: 0 } }, probe: { checkedAt: "2026-11-19T00:00:00Z", reachable: true, status: 200, supportedSeps: ["SEP-1"] } };
  post.mockResolvedValueOnce(result).mockRejectedValue(new Error("Network unavailable"));
  render(<Page />); const field = screen.getByLabelText("Target origin");
  fireEvent.change(field, { target: { value: "https://anchor.example" } }); fireEvent.click(screen.getByRole("button", { name: "Run reference check" }));
  await screen.findByText("run_synthetic"); expect(screen.getByText("3")).toBeTruthy();
  const firstKey = post.mock.calls[0][2];
  fireEvent.change(field, { target: { value: "https://other.example" } }); expect(screen.queryByText("run_synthetic")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Run reference check" })); await screen.findByRole("alert");
  const secondKey = post.mock.calls[1][2]; expect(secondKey).not.toBe(firstKey);
  fireEvent.click(screen.getByRole("button", { name: "Run reference check" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(3)); expect(post.mock.calls[2][2]).toBe(secondKey);
});
