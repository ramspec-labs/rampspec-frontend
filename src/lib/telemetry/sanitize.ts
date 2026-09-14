const allowed = new Set(["route", "method", "status", "durationMs", "release", "traceId"]);
export function sanitizeSpan(attributes: Record<string, unknown>) { return Object.fromEntries(Object.entries(attributes).filter(([key, value]) => allowed.has(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"))); }
