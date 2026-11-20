import type { ApiClient, ApiResponse } from "@/lib/api";

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

export type SubmitReferenceRunResult = {
  result: ReferenceRunResult;
  isDuplicate: boolean;
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

export async function submitReferenceRunWithMetadata(
  client: Pick<ApiClient, "postWithMetadata">,
  input: ReferenceRunInput,
  idempotencyKey: string,
): Promise<SubmitReferenceRunResult> {
  const response = await client.postWithMetadata<ReferenceRunResult>(
    "/v1/reference-runs",
    input,
    idempotencyKey,
  );
  const isDuplicate = response.headers.idempotencyReplayKey !== undefined;
  return {
    result: response.data,
    isDuplicate,
  };
}
