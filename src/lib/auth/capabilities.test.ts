import { describe, expect, it } from "vitest";
import { can } from "./capabilities";
describe("capabilities", () => { it("allows operators to run suites", () => expect(can(["operator"], "runs:create")).toBe(true)); it("keeps settings restricted", () => expect(can(["viewer"], "settings:write")).toBe(false)); });
