import type { ApiClient } from "@/lib/api";

export type ReferenceRunInput = {
  projectId: string;
  suiteId: string;
  suiteVersion: string;
  targetId: string;
  targetOrigin: string;
};

export type ReferenceRunResult = {
  probe: {
    checkedAt: string;
    reachable: boolean;
    status: number | null;
    supportedSeps: string[];
  };
  report: {
    evidenceManifestHash: string;
    reportId: string;
    summary: {
      failed: number;
      passed: number;
      skipped: number;
      warnings: number;
    };
  };
  run: {
    id: string;
    state: "completed" | "failed";
  };
  targetOrigin: string;
};

export function submitReferenceRun(
  client: Pick<ApiClient, "post">,
  input: ReferenceRunInput,
  idempotencyKey: string,
): Promise<ReferenceRunResult> {
  return client.post<ReferenceRunResult>(
    "/v1/reference-runs",
    input,
    idempotencyKey,
  );
}
