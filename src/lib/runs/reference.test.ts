import { describe, expect, it, vi } from "vitest";

import { submitReferenceRun } from "./reference";

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
