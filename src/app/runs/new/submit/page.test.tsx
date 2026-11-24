import { describe, expect, it, vi } from "vitest";

import { submitReferenceRunWithMetadata } from "@/lib/runs/reference";

const run = {
  probe: {
    checkedAt: "2026-01-01T00:00:00Z",
    reachable: true,
    status: 200,
    supportedSeps: ["sep-1"],
  },
  report: {
    evidenceManifestHash: "hash123",
    reportId: "report_123",
    summary: { failed: 0, passed: 15, skipped: 0, warnings: 2 },
  },
  run: { id: "run_existing", state: "completed" as const },
  targetOrigin: "https://example.com",
};

const input = {
  projectId: "project_1",
  suiteId: "suite_1",
  suiteVersion: "1.0.0",
  targetId: "target_1",
  targetOrigin: "https://example.com",
};

describe("submitReferenceRunWithMetadata", () => {
  it("identifies an idempotency replay", async () => {
    const postWithMetadata = vi.fn().mockResolvedValue({
      data: run,
      headers: { idempotencyReplayKey: "existing-run-key", status: 200 },
    });
    const result = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-1",
    );
    expect(result).toEqual({ result: run, isDuplicate: true });
  });

  it("identifies a newly created run", async () => {
    const postWithMetadata = vi.fn().mockResolvedValue({
      data: run,
      headers: { status: 201 },
    });
    const result = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-2",
    );
    expect(result).toEqual({ result: run, isDuplicate: false });
  });
});
