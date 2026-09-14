import { expect, it } from "vitest";
const supportedStates = ["loading", "empty", "partial", "error", "blocked", "permission", "terminal"] as const;
it("keeps the supported state vocabulary explicit", () => expect(supportedStates).toHaveLength(7));
