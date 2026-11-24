import { describe, it, expect } from "vitest";
import { checkVersionCompatibility } from "./compatibility";
import type { ReportVersionMetadata } from "./types";

describe("checkVersionCompatibility", () => {
  describe("current version", () => {
    it("should mark report as not stale when versions match current", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "2026.09",
        schemaVersion: "ramp-3",
        createdAt: "2026-11-20T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result.isStale).toBe(false);
      expect(result.currentSuiteVersion).toBe("2026.09");
      expect(result.currentSchemaVersion).toBe("ramp-3");
    });
  });

  describe("stale suite version", () => {
    it("should mark report as stale when suite version differs", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "2026.08",
        schemaVersion: "ramp-3",
        createdAt: "2026-11-10T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result.isStale).toBe(true);
      expect(result.reportSuiteVersion).toBe("2026.08");
      expect(result.currentSuiteVersion).toBe("2026.09");
    });
  });

  describe("stale schema version", () => {
    it("should mark report as stale when schema version differs", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "2026.09",
        schemaVersion: "ramp-2",
        createdAt: "2026-11-10T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result.isStale).toBe(true);
      expect(result.reportSchemaVersion).toBe("ramp-2");
      expect(result.currentSchemaVersion).toBe("ramp-3");
    });
  });

  describe("both versions stale", () => {
    it("should mark report as stale when both versions differ", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "2026.07",
        schemaVersion: "ramp-1",
        createdAt: "2026-10-20T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result.isStale).toBe(true);
      expect(result.reportSuiteVersion).toBe("2026.07");
      expect(result.reportSchemaVersion).toBe("ramp-1");
      expect(result.currentSuiteVersion).toBe("2026.09");
      expect(result.currentSchemaVersion).toBe("ramp-3");
    });
  });

  describe("boundary cases", () => {
    it("should handle empty string versions", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "",
        schemaVersion: "",
        createdAt: "2026-11-20T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result.isStale).toBe(true);
    });

    it("should return compatibility data for version comparison", () => {
      const metadata: ReportVersionMetadata = {
        suiteVersion: "2026.08",
        schemaVersion: "ramp-2",
        createdAt: "2026-11-15T10:00:00Z",
      };

      const result = checkVersionCompatibility(metadata);

      expect(result).toHaveProperty("currentSuiteVersion");
      expect(result).toHaveProperty("currentSchemaVersion");
      expect(result).toHaveProperty("reportSuiteVersion");
      expect(result).toHaveProperty("reportSchemaVersion");
    });
  });
});
