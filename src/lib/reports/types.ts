export type ReportVersionMetadata = {
  suiteVersion: string;
  schemaVersion: string;
  createdAt: string;
};

export type VersionCompatibility = {
  isStale: boolean;
  currentSuiteVersion: string;
  currentSchemaVersion: string;
  reportSuiteVersion: string;
  reportSchemaVersion: string;
};
