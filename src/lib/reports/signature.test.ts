import { describe, expect, it } from "vitest";
import { verifyReportSignature } from "./signature";
describe("report signature", () => { it("accepts matching digests", () => expect(verifyReportSignature("abc", "abc", "RampSpec signer").valid).toBe(true)); it("rejects mismatches", () => expect(verifyReportSignature("abc", "def", "RampSpec signer").valid).toBe(false)); });
