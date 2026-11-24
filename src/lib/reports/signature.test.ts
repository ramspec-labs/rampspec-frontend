import { describe, expect, it } from "vitest";
import { verifyReportSignature, isValidDigest } from "./signature";

describe("report signature", () => {
  describe("verifyReportSignature", () => {
    it("accepts matching digests", () =>
      expect(verifyReportSignature("abc", "abc", "RampSpec signer").valid).toBe(
        true
      ));

    it("rejects mismatches", () =>
      expect(verifyReportSignature("abc", "def", "RampSpec signer").valid).toBe(
        false
      ));

    it("rejects empty expected digest", () =>
      expect(
        verifyReportSignature("", "abc", "RampSpec signer").valid
      ).toBe(false));

    it("includes reason on failure", () => {
      const result = verifyReportSignature("abc", "def", "RampSpec signer");
      expect(result.reason).toBe("Digest does not match the signed report.");
    });

    it("omits reason on success", () => {
      const result = verifyReportSignature("abc", "abc", "RampSpec signer");
      expect(result.reason).toBeUndefined();
    });
  });

  describe("isValidDigest", () => {
    it("accepts valid hex digests", () => {
      expect(isValidDigest("abc123")).toBe(true);
      expect(isValidDigest("ABC123")).toBe(true);
      expect(isValidDigest(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      )).toBe(true);
    });

    it("rejects empty digest", () => {
      expect(isValidDigest("")).toBe(false);
    });

    it("rejects non-hex characters", () => {
      expect(isValidDigest("gg1234")).toBe(false);
      expect(isValidDigest("abc-123")).toBe(false);
      expect(isValidDigest("abc 123")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidDigest("abc!123")).toBe(false);
    });
  });
});
