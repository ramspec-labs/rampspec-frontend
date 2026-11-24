import { describe, expect, it, vi } from "vitest";

import { submitReferenceRun, submitReferenceRunWithMetadata } from "./reference";

describe("submitReferenceRun", () => {
  it("uses the reference endpoint and preserves the retry key", async () => {
    const post = vi.fn().mockResolvedValue({ run: { id: "run_1" } });
    const input = {
      projectId: "project_1",
      suiteId: "suite_1",
      suiteVersion: "1.0.0",
      targetId: "target_1",
      targetOrigin: "https://anchor.example",
    };

    await submitReferenceRun({ post } as never, input, "reviewer-request-1");

    expect(post).toHaveBeenCalledWith(
      "/v1/reference-runs",
      input,
      "reviewer-request-1",
    );
  });
});

describe("submitReferenceRunWithMetadata", () => {
  it("detects duplicate runs from idempotency replay headers", async () => {
    const result = {
      run: { id: "run_1", state: "completed" as const },
      report: {
        reportId: "report_1",
        evidenceManifestHash: "hash1",
        summary: { passed: 10, warnings: 0, failed: 0, skipped: 0 },
      },
      probe: { reachable: true, status: 200, checkedAt: "2026-01-01T00:00:00Z", supportedSeps: ["sep-1"] },
      targetOrigin: "https://anchor.example",
    };

    const postWithMetadata = vi.fn().mockResolvedValue({
      data: result,
      headers: { idempotencyReplayKey: "existing-key", status: 200 },
    });

    const input = {
      projectId: "project_1",
      suiteId: "suite_1",
      suiteVersion: "1.0.0",
      targetId: "target_1",
      targetOrigin: "https://anchor.example",
    };

    const submitResult = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-1",
    );

    expect(submitResult.isDuplicate).toBe(true);
    expect(submitResult.result).toEqual(result);
    expect(postWithMetadata).toHaveBeenCalledWith(
      "/v1/reference-runs",
      input,
      "reviewer-request-1",
    );
  });

  it("indicates new runs when no replay header is present", async () => {
    const result = {
      run: { id: "run_2", state: "completed" as const },
      report: {
        reportId: "report_2",
        evidenceManifestHash: "hash2",
        summary: { passed: 8, warnings: 2, failed: 0, skipped: 0 },
      },
      probe: { reachable: true, status: 200, checkedAt: "2026-01-01T00:00:00Z", supportedSeps: ["sep-1"] },
      targetOrigin: "https://anchor.example",
    };

    const postWithMetadata = vi.fn().mockResolvedValue({
      data: result,
      headers: { status: 201 },
    });

    const input = {
      projectId: "project_1",
      suiteId: "suite_1",
      suiteVersion: "1.0.0",
      targetId: "target_1",
      targetOrigin: "https://anchor.example",
    };

    const submitResult = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-2",
    );

    expect(submitResult.isDuplicate).toBe(false);
    expect(submitResult.result).toEqual(result);
  });
});
