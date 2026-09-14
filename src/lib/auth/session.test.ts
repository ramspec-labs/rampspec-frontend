import { describe, expect, it } from "vitest";
import { isSessionValid, sessionFromPayload } from "./session";

describe("session boundary", () => {
  it("rejects expired sessions", () => expect(isSessionValid({ userId: "u", displayName: "A", email: "a@example.test", expiresAt: "2020-01-01", roles: ["viewer"] })).toBe(false));
  it("drops malformed payloads", () => expect(sessionFromPayload({ userId: "u" })).toBeNull());
});
