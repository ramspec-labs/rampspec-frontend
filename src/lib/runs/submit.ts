import { ApiClient } from "@/lib/api";
export type RunSubmission = { targetId: string; suiteId: string; fixture: string; timeoutSeconds: number };
export async function submitRun(client: ApiClient, payload: RunSubmission, idempotencyKey: string) { return client.post<{ runId: string; status: "queued" | "rejected" }>("/v1/runs", payload, idempotencyKey); }
