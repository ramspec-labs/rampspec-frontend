export const QUERY_LIMIT = 100;
export function retryDelay(attempt: number, base = 250, cap = 10_000) { return Math.min(base * 2 ** Math.max(0, attempt), cap); }
export function isFresh(updatedAt: string, maxAgeMs: number, now = Date.now()) { return now - new Date(updatedAt).getTime() <= maxAgeMs; }
