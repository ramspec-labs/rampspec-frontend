import { expect, it } from "vitest";
import { sanitizeSpan } from "./sanitize";
it("keeps allowlisted attributes and drops secrets", () => expect(sanitizeSpan({ route: "/reports", token: "secret", fixture: "account" })).toEqual({ route: "/reports" }));
