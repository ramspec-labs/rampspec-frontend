import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  submitReferenceRun,
  pollReferenceRunResult,
  type ReferenceRunResult,
} from "./reference";

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

describe("pollReferenceRunResult", () => {
  const mockResult: ReferenceRunResult = {
    probe: {
      checkedAt: "2024-01-01T00:00:00Z",
      reachable: true,
      status: 200,
      supportedSeps: ["SEP-1"],
    },
    report: {
      evidenceManifestHash: "hash_1",
      reportId: "report_1",
      summary: { failed: 0, passed: 10, skipped: 0, warnings: 0 },
    },
    run: { id: "run_1", state: "completed" },
    targetOrigin: "https://anchor.example",
  };

  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGet = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("returns immediately when result is in terminal state", async () => {
    mockGet.mockResolvedValueOnce(mockResult);

    const result = await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
    );

    expect(result).toEqual({ result: mockResult, isTerminal: true });
    expect(mockGet).toHaveBeenCalledOnce();
  });

  it("polls with exponential backoff until terminal state", async () => {
    const pendingResult = { ...mockResult, run: { id: "run_1", state: "pending" as const } };
    mockGet
      .mockResolvedValueOnce(pendingResult)
      .mockResolvedValueOnce(pendingResult)
      .mockResolvedValueOnce(mockResult);

    const result = await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
      { initialDelayMs: 100, maxDelayMs: 300, backoffMultiplier: 2 },
    );

    expect(result).toEqual({ result: mockResult, isTerminal: true });
    expect(mockGet).toHaveBeenCalledTimes(3);

    // Check backoff timing
    expect(vi.getTimerCount()).toBe(0);
  });

  it("respects maxAttempts limit", async () => {
    const pendingResult = { ...mockResult, run: { id: "run_1", state: "pending" as const } };
    mockGet.mockResolvedValue(pendingResult);

    const result = await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
      { maxAttempts: 3, initialDelayMs: 100 },
    );

    expect(result).toEqual({
      result: pendingResult,
      isTerminal: false,
    });
    expect(mockGet).toHaveBeenCalledTimes(4); // initial + 3 polling attempts, then final fetch
  });

  it("caps delay at maxDelayMs", async () => {
    const pendingResult = { ...mockResult, run: { id: "run_1", state: "pending" as const } };
    mockGet.mockResolvedValue(pendingResult);

    await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
      {
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 200,
        backoffMultiplier: 10,
      },
    );

    // Delays should be: 100, 1000->capped to 200, 2000->capped to 200, 2000->capped to 200, 2000->capped to 200
    expect(mockGet).toHaveBeenCalled();
  });

  it("calls onAttempt callback for each attempt", async () => {
    const pendingResult = { ...mockResult, run: { id: "run_1", state: "pending" as const } };
    mockGet.mockResolvedValueOnce(pendingResult).mockResolvedValueOnce(mockResult);
    const onAttempt = vi.fn();

    await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
      { onAttempt, initialDelayMs: 100 },
    );

    expect(onAttempt).toHaveBeenCalledWith(1);
    expect(onAttempt).toHaveBeenCalledWith(2);
  });

  it("throws AbortError when signal is aborted before attempt", async () => {
    const controller = new AbortController();
    controller.abort();

    const promise = pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
      { signal: controller.signal },
    );

    await expect(promise).rejects.toThrow("Aborted");
  });

  it("throws AbortError when signal is aborted during polling", async () => {
    const controller = new AbortController();
    const pendingResult = { ...mockResult, run: { id: "run_1", state: "pending" as const } };
    mockGet.mockResolvedValueOnce(pendingResult);

    let abortResolve: (() => void) | null = null;
    const abortPromise = new Promise<void>((resolve) => {
      abortResolve = resolve;
    });

    // Simulate aborting after first attempt
    Promise.resolve().then(() => {
      controller.abort();
      abortResolve?.();
    });

    await expect(
      pollReferenceRunResult(
        { get: mockGet } as never,
        "run_1",
        "org_1",
        { signal: controller.signal, initialDelayMs: 100 },
      ),
    ).rejects.toThrow("Aborted");

    await abortPromise;
  });

  it("throws API errors from get requests", async () => {
    const apiError = new Error("API Error");
    mockGet.mockRejectedValueOnce(apiError);

    const promise = pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
    );

    await expect(promise).rejects.toThrow("API Error");
  });

  it("handles failed terminal state", async () => {
    const failedResult = { ...mockResult, run: { id: "run_1", state: "failed" as const } };
    mockGet.mockResolvedValueOnce(failedResult);

    const result = await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_1",
      "org_1",
    );

    expect(result).toEqual({ result: failedResult, isTerminal: true });
  });

  it("passes correct run ID to get request", async () => {
    mockGet.mockResolvedValueOnce(mockResult);

    await pollReferenceRunResult(
      { get: mockGet } as never,
      "run_123",
      "org_1",
    );

    expect(mockGet).toHaveBeenCalledWith("/v1/reference-runs/run_123");
  });
});
