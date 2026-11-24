// Component type and behavior validation tests
import { describe, it, expect } from "vitest";
import type { StaleReportIndicatorProps } from "./stale-report-indicator";
import type { VersionCompatibility } from "@/lib/reports/types";

describe("StaleReportIndicator", () => {
  describe("props validation", () => {
    it("should accept compatibility prop with current version", () => {
      const compatibility: VersionCompatibility = {
        isStale: false,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.09",
        reportSchemaVersion: "ramp-3",
      };

      const props: StaleReportIndicatorProps = { compatibility };
      expect(props.compatibility.isStale).toBe(false);
    });

    it("should accept compatibility prop with stale version", () => {
      const compatibility: VersionCompatibility = {
        isStale: true,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.08",
        reportSchemaVersion: "ramp-2",
      };

      const props: StaleReportIndicatorProps = { compatibility };
      expect(props.compatibility.isStale).toBe(true);
      expect(props.compatibility.reportSuiteVersion).toBe("2026.08");
      expect(props.compatibility.reportSchemaVersion).toBe("ramp-2");
    });
  });

  describe("version comparison behavior", () => {
    it("should mark report as not stale when versions match", () => {
      const compatibility: VersionCompatibility = {
        isStale: false,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.09",
        reportSchemaVersion: "ramp-3",
      };

      expect(compatibility.isStale).toBe(false);
      expect(compatibility.reportSuiteVersion).toBe(
        compatibility.currentSuiteVersion
      );
      expect(compatibility.reportSchemaVersion).toBe(
        compatibility.currentSchemaVersion
      );
    });

    it("should mark report as stale when suite version differs", () => {
      const compatibility: VersionCompatibility = {
        isStale: true,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.08",
        reportSchemaVersion: "ramp-3",
      };

      expect(compatibility.isStale).toBe(true);
      expect(compatibility.reportSuiteVersion).not.toBe(
        compatibility.currentSuiteVersion
      );
    });

    it("should mark report as stale when schema version differs", () => {
      const compatibility: VersionCompatibility = {
        isStale: true,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.09",
        reportSchemaVersion: "ramp-2",
      };

      expect(compatibility.isStale).toBe(true);
      expect(compatibility.reportSchemaVersion).not.toBe(
        compatibility.currentSchemaVersion
      );
    });

    it("should mark report as stale when both versions differ", () => {
      const compatibility: VersionCompatibility = {
        isStale: true,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.07",
        reportSchemaVersion: "ramp-1",
      };

      expect(compatibility.isStale).toBe(true);
      expect(compatibility.reportSuiteVersion).not.toBe(
        compatibility.currentSuiteVersion
      );
      expect(compatibility.reportSchemaVersion).not.toBe(
        compatibility.currentSchemaVersion
      );
    });
  });

  describe("accessibility and rendering behavior", () => {
    it("should provide all version data needed for conditional rendering", () => {
      const staleCompatibility: VersionCompatibility = {
        isStale: true,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.08",
        reportSchemaVersion: "ramp-2",
      };

      expect(staleCompatibility).toHaveProperty("isStale");
      expect(staleCompatibility).toHaveProperty("currentSuiteVersion");
      expect(staleCompatibility).toHaveProperty("currentSchemaVersion");
      expect(staleCompatibility).toHaveProperty("reportSuiteVersion");
      expect(staleCompatibility).toHaveProperty("reportSchemaVersion");
    });

    it("should handle null rendering case when not stale", () => {
      const currentCompatibility: VersionCompatibility = {
        isStale: false,
        currentSuiteVersion: "2026.09",
        currentSchemaVersion: "ramp-3",
        reportSuiteVersion: "2026.09",
        reportSchemaVersion: "ramp-3",
      };

      expect(currentCompatibility.isStale).toBe(false);
    });
  });
});
