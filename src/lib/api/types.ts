export type ProblemDetails = { type: string; title: string; status: number; detail?: string; instance?: string; code?: string; requestId?: string };
export type Page<T> = { data: T[]; meta: { nextCursor?: string; hasMore: boolean } };
export type ApiResponse<T> = { data: T; headers: ResponseHeaders };
export type ResponseHeaders = { idempotencyReplayKey?: string; status: number };
export class ApiError extends Error { constructor(public readonly problem: ProblemDetails) { super(problem.detail ?? problem.title); this.name = "ApiError"; } }
