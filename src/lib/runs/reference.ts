import { ApiError, type ApiClient } from "@/lib/api";

export function validateTargetOrigin(input: string): { origin: string; error?: never } | { origin?: never; error: string } {
  const value = input.trim();
  if (!value) return { error: "Enter an HTTPS target origin." };
  if ([...input].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
      || /\s/.test(value) || value.includes("\\")) return { error: "Remove whitespace, control characters and backslashes from the origin." };
  if (!/^https:\/\//i.test(value)) return { error: "Use an HTTPS origin, such as https://anchor.example." };
  const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/)[0];
  if (authority.includes("@") || authority.includes("%") || /[^\x20-\x7E]/.test(authority)) return { error: "Use an unambiguous host without credentials or encoded characters." };
  if (value.includes("#") || value.includes("?")) return { error: "An origin cannot contain a query or fragment." };
  const suffix = value.slice(value.indexOf("://") + 3 + authority.length);
  if ((suffix !== "" && suffix !== "/") || authority.endsWith(":")) return { error: "Enter only an HTTPS origin without a path or empty port." };
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.pathname !== "/") return { error: "Enter only the HTTPS scheme, host and optional port; remove paths and credentials." };
    const rawHost = authority.startsWith("[") ? authority.slice(0, authority.indexOf("]") + 1) : authority.split(":")[0];
    if (url.hostname.endsWith(".") || (!rawHost.startsWith("[") && rawHost.toLowerCase() !== url.hostname)) return { error: "Use the complete, unambiguous host name or IP address." };
    return { origin: url.origin };
  } catch { return { error: "Enter a valid HTTPS origin with a valid host and port." }; }
}

export function originValidationMessage(error: unknown): string | undefined {
  return error instanceof ApiError && error.problem.status === 400 && /origin|url/i.test(`${error.message} ${error.problem.code ?? ""}`)
    ? error.message : undefined;
}

export type ReferenceRunInput = {
  projectId: string;
  suiteId: string;
  suiteVersion: string;
  targetId: string;
  targetOrigin: string;
  effectiveConfig?: Readonly<Record<string, unknown>>;
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
  const validated = validateTargetOrigin(input.targetOrigin);
  if (validated.error) return Promise.reject(new Error(validated.error));
  return client.post<ReferenceRunResult>(
    "/v1/reference-runs",
    { ...input, targetOrigin: validated.origin },
    idempotencyKey,
  );
}

export async function submitReferenceRunWithMetadata(
  client: Pick<ApiClient, "postWithMetadata">,
  input: ReferenceRunInput,
  idempotencyKey: string,
): Promise<SubmitReferenceRunResult> {
  const validated = validateTargetOrigin(input.targetOrigin);
  if (validated.error) return Promise.reject(new Error(validated.error));
  const response = await client.postWithMetadata<ReferenceRunResult>(
    "/v1/reference-runs",
    { ...input, targetOrigin: validated.origin },
    idempotencyKey,
  );
  const isDuplicate = response.headers.idempotencyReplayKey !== undefined;
  return {
    result: response.data,
    isDuplicate,
  };
}
