import type { ReportVersionMetadata, VersionCompatibility } from "./types";
import { snapshot } from "@/lib/specs/snapshots";

export function checkVersionCompatibility(
  reportMetadata: ReportVersionMetadata
): VersionCompatibility {
  const currentSuiteVersion = snapshot.semanticVersion;
  const currentSchemaVersion = snapshot.rulePack;

  const isStale =
    reportMetadata.suiteVersion !== currentSuiteVersion ||
    reportMetadata.schemaVersion !== currentSchemaVersion;

  return {
    isStale,
    currentSuiteVersion,
    currentSchemaVersion,
    reportSuiteVersion: reportMetadata.suiteVersion,
    reportSchemaVersion: reportMetadata.schemaVersion,
  };
}
