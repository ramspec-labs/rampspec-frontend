export { sanitizeSpan } from "./sanitize";
export function telemetryOptOut() { return process.env.NEXT_PUBLIC_TELEMETRY_OPTOUT === "true"; }
