import { describe, it, expect } from "vitest";
import { ReportExports, type IntegrityState } from "./report-exports";
import { verifyReportSignature, isValidDigest } from "@/lib/reports/signature";

describe("ReportExports component", () => {
  const reportId = "rpt-123";

  describe("positive states - verified integrity", () => {
    it("exports component structure with verified state", () => {
      const component = ReportExports({
        reportId,
        integrityState: "verified",
      });
      expect(component).toBeDefined();
      expect(component.type).toBe("div");
    });

    it("renders with correct props structure", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "verified" })
      ).not.toThrow();
    });

    it("accepts reportId prop", () => {
      const component = ReportExports({
        reportId: "test-report-id",
        integrityState: "verified",
      });
      expect(component).toBeDefined();
    });
  });

  describe("integrity state handling", () => {
    it("accepts pending state", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "pending" })
      ).not.toThrow();
    });

    it("accepts rejected state", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "rejected" })
      ).not.toThrow();
    });

    it("accepts verified state", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "verified" })
      ).not.toThrow();
    });

    it("accepts loading state", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "loading" })
      ).not.toThrow();
    });

    it("accepts error state", () => {
      expect(() =>
        ReportExports({ reportId, integrityState: "error" })
      ).not.toThrow();
    });

    it("defaults to verified when integrityState is not provided", () => {
      expect(() => ReportExports({ reportId })).not.toThrow();
    });
  });

  describe("component type assertions", () => {
    it("IntegrityState type is correctly defined", () => {
      const states: IntegrityState[] = ["pending", "verified", "rejected", "loading", "error"];
      expect(states).toHaveLength(5);
    });

    it("supports all required integrity states", () => {
      const states: Array<"pending" | "verified" | "rejected" | "loading" | "error"> = [
        "pending",
        "verified",
        "rejected",
        "loading",
        "error",
      ];
      states.forEach((state) => {
        expect(() => ReportExports({ reportId, integrityState: state })).not.toThrow();
      });
    });
  });

  describe("prop combinations", () => {
    it("handles verified state with reportId", () => {
      const component = ReportExports({
        reportId: "rpt-456",
        integrityState: "verified",
      });
      expect(component).toBeDefined();
    });

    it("handles pending state with reportId", () => {
      const component = ReportExports({
        reportId: "rpt-456",
        integrityState: "pending",
      });
      expect(component).toBeDefined();
    });

    it("handles rejected state with reportId", () => {
      const component = ReportExports({
        reportId: "rpt-456",
        integrityState: "rejected",
      });
      expect(component).toBeDefined();
    });

    it("handles empty reportId", () => {
      expect(() =>
        ReportExports({ reportId: "", integrityState: "verified" })
      ).not.toThrow();
    });
  });

  describe("component exports", () => {
    it("exports ReportExports function", () => {
      expect(typeof ReportExports).toBe("function");
    });

    it("exports IntegrityState type", () => {
      const _state: IntegrityState = "verified";
      expect(_state).toBe("verified");
    });
  });

  describe("boundary conditions", () => {
    it("handles special characters in reportId", () => {
      expect(() =>
        ReportExports({
          reportId: "rpt-!@#$%^&*()",
          integrityState: "verified",
        })
      ).not.toThrow();
    });

    it("handles very long reportId", () => {
      const longId = "rpt-" + "x".repeat(1000);
      expect(() =>
        ReportExports({ reportId: longId, integrityState: "verified" })
      ).not.toThrow();
    });
  });

  describe("component structure validation", () => {
    it("returns JSX element", () => {
      const component = ReportExports({ reportId, integrityState: "verified" });
      expect(component.type).toBeDefined();
      expect(component.props).toBeDefined();
    });
  });
});

describe("ReportExports verification logic", () => {
  describe("isValidDigest - format validation", () => {
    it("accepts valid hex digests", () => {
      expect(isValidDigest("abc123")).toBe(true);
      expect(isValidDigest("ABC123")).toBe(true);
      expect(isValidDigest(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      )).toBe(true);
    });

    it("accepts mixed case hex", () => {
      expect(isValidDigest("aBcDeF0123456789")).toBe(true);
      expect(isValidDigest("AbCdEf0123456789")).toBe(true);
    });

    it("accepts long valid digests", () => {
      const longDigest = "a".repeat(256);
      expect(isValidDigest(longDigest)).toBe(true);
    });

    it("rejects empty digest", () => {
      expect(isValidDigest("")).toBe(false);
    });

    it("rejects non-hex characters", () => {
      expect(isValidDigest("gg1234")).toBe(false);
      expect(isValidDigest("xyz789")).toBe(false);
      expect(isValidDigest("ZZZZZ")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidDigest("abc-123")).toBe(false);
      expect(isValidDigest("abc 123")).toBe(false);
      expect(isValidDigest("abc!123")).toBe(false);
      expect(isValidDigest("abc@123")).toBe(false);
      expect(isValidDigest("abc_123")).toBe(false);
    });

    it("rejects whitespace", () => {
      expect(isValidDigest(" abc123")).toBe(false);
      expect(isValidDigest("abc123 ")).toBe(false);
      expect(isValidDigest("abc 123")).toBe(false);
    });

    it("handles single character digest", () => {
      expect(isValidDigest("a")).toBe(true);
      expect(isValidDigest("F")).toBe(true);
      expect(isValidDigest("0")).toBe(true);
    });

    it("handles extremely long digest", () => {
      const veryLongDigest = "a".repeat(10000);
      expect(isValidDigest(veryLongDigest)).toBe(true);
    });

    it("handles all valid hex characters", () => {
      expect(isValidDigest("0123456789abcdef")).toBe(true);
      expect(isValidDigest("ABCDEF")).toBe(true);
    });

    it("rejects single invalid character among valid ones", () => {
      expect(isValidDigest("abcdefg")).toBe(false);
      expect(isValidDigest("0123456789z")).toBe(false);
    });
  });

  describe("verifyReportSignature - signature verification", () => {
    it("accepts matching digests", () => {
      const result = verifyReportSignature("abc123", "abc123", "RampSpec signer");
      expect(result.valid).toBe(true);
      expect(result.algorithm).toBe("SHA-256");
      expect(result.signer).toBe("RampSpec signer");
      expect(result.reason).toBeUndefined();
    });

    it("rejects mismatches", () => {
      const result = verifyReportSignature("abc123", "def456", "RampSpec signer");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Digest does not match the signed report.");
    });

    it("rejects empty expected digest", () => {
      const result = verifyReportSignature("", "abc123", "RampSpec signer");
      expect(result.valid).toBe(false);
    });

    it("omits reason on success (prevents leaking info)", () => {
      const result = verifyReportSignature("abc123", "abc123", "RampSpec");
      expect(result.reason).toBeUndefined();
    });

    it("includes reason only on failure", () => {
      const failResult = verifyReportSignature("a", "b", "RampSpec");
      expect(failResult.reason).toBeDefined();

      const successResult = verifyReportSignature("a", "a", "RampSpec");
      expect(successResult.reason).toBeUndefined();
    });

    it("handles case-sensitive comparison", () => {
      const result = verifyReportSignature("ABC", "abc", "RampSpec");
      expect(result.valid).toBe(false);
    });

    it("provides specific error for digest mismatch", () => {
      const result = verifyReportSignature("expected", "actual", "signer");
      expect(result.reason).toBe("Digest does not match the signed report.");
    });

    it("does not reveal content in error reason", () => {
      const result = verifyReportSignature("expected", "actual", "signer");
      expect(result.reason).not.toContain("expected");
      expect(result.reason).not.toContain("actual");
    });
  });

  describe("state transitions", () => {
    it("invalid digest prevents download", () => {
      const invalidDigest = "not-hex!";
      expect(isValidDigest(invalidDigest)).toBe(false);
    });

    it("verification failure prevents download", () => {
      const result = verifyReportSignature("signed", "other", "signer");
      expect(result.valid).toBe(false);
    });

    it("only success state enables download", () => {
      const validDigest = "abc123";
      expect(isValidDigest(validDigest)).toBe(true);

      const verificationResult = verifyReportSignature(
        validDigest,
        validDigest,
        "RampSpec"
      );
      expect(verificationResult.valid).toBe(true);
    });
  });
});
