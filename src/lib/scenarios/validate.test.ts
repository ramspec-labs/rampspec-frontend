import { expect, it } from "vitest";
import { validateScenarioSource } from "./validate";
it("rejects executable scenario content", () => expect(validateScenarioSource("name: x\nsteps:\n command: eval(1)").valid).toBe(false));
