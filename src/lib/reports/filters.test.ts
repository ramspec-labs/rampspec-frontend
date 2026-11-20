import { describe, it, expect } from "vitest";
import {
  parseFilterParams,
  buildFilterParams,
  filterFindings,
  mergeFilters,
  type FilterState,
} from "./filters";
import type { Finding } from "@/lib/domain/types";

const mockFindings: Finding[] = [
  {
    id: "f-1",
    title: "High critical issue",
    severity: "critical",
    status: "open",
    evidenceCount: 5,
  },
  {
    id: "f-2",
    title: "High severity issue",
    severity: "high",
    status: "open",
    evidenceCount: 3,
  },
  {
    id: "f-3",
    title: "Medium severity resolved",
    severity: "medium",
    status: "resolved",
    evidenceCount: 2,
  },
  {
    id: "f-4",
    title: "Low severity accepted",
    severity: "low",
    status: "accepted",
    evidenceCount: 1,
  },
];

describe("parseFilterParams", () => {
  it("returns empty filters when no params provided", () => {
    const result = parseFilterParams({});
    expect(result).toEqual({ severity: [], status: [] });
  });

  it("parses single severity filter", () => {
    const result = parseFilterParams({ severity: "high" });
    expect(result.severity).toEqual(["high"]);
  });

  it("parses multiple severity filters from comma-separated string", () => {
    const result = parseFilterParams({ severity: "high,medium" });
    expect(result.severity).toEqual(["high", "medium"]);
  });

  it("parses multiple severity filters from array", () => {
    const result = parseFilterParams({ severity: ["high", "medium"] });
    expect(result.severity).toEqual(["high", "medium"]);
  });

  it("ignores invalid severity values", () => {
    const result = parseFilterParams({ severity: "high,invalid,medium" });
    expect(result.severity).toEqual(["high", "medium"]);
  });

  it("parses status filters", () => {
    const result = parseFilterParams({ status: "open,resolved" });
    expect(result.status).toEqual(["open", "resolved"]);
  });

  it("ignores invalid status values", () => {
    const result = parseFilterParams({ status: "open,invalid,resolved" });
    expect(result.status).toEqual(["open", "resolved"]);
  });

  it("parses both severity and status filters", () => {
    const result = parseFilterParams({
      severity: "high,medium",
      status: "open,accepted",
    });
    expect(result.severity).toEqual(["high", "medium"]);
    expect(result.status).toEqual(["open", "accepted"]);
  });

  it("ignores unknown parameters", () => {
    const result = parseFilterParams({
      severity: "high",
      unknownParam: "value",
      anotherUnknown: ["a", "b"],
    });
    expect(result).toEqual({ severity: ["high"], status: [] });
  });

  it("returns empty filters for undefined severity", () => {
    const result = parseFilterParams({ severity: undefined });
    expect(result.severity).toEqual([]);
  });

  it("handles malformed comma-separated values", () => {
    const result = parseFilterParams({ severity: "high,,medium," });
    expect(result.severity).toEqual(["high", "medium"]);
  });

  it("all valid severity values are parsed correctly", () => {
    const result = parseFilterParams({
      severity: "critical,high,medium,low",
    });
    expect(result.severity).toEqual(["critical", "high", "medium", "low"]);
  });

  it("all valid status values are parsed correctly", () => {
    const result = parseFilterParams({
      status: "open,accepted,resolved",
    });
    expect(result.status).toEqual(["open", "accepted", "resolved"]);
  });
});

describe("buildFilterParams", () => {
  it("returns empty object for empty filters", () => {
    const result = buildFilterParams({ severity: [], status: [] });
    expect(result).toEqual({});
  });

  it("builds severity param from array", () => {
    const result = buildFilterParams({
      severity: ["high", "medium"],
      status: [],
    });
    expect(result).toEqual({ severity: "high,medium" });
  });

  it("builds status param from array", () => {
    const result = buildFilterParams({
      severity: [],
      status: ["open", "resolved"],
    });
    expect(result).toEqual({ status: "open,resolved" });
  });

  it("builds both severity and status params", () => {
    const result = buildFilterParams({
      severity: ["high"],
      status: ["open"],
    });
    expect(result).toEqual({ severity: "high", status: "open" });
  });

  it("builds single severity value without comma", () => {
    const result = buildFilterParams({
      severity: ["high"],
      status: [],
    });
    expect(result).toEqual({ severity: "high" });
  });
});

describe("filterFindings", () => {
  it("returns all findings when no filters applied", () => {
    const result = filterFindings(mockFindings, { severity: [], status: [] });
    expect(result).toHaveLength(4);
  });

  it("filters by single severity", () => {
    const result = filterFindings(mockFindings, {
      severity: ["high"],
      status: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("f-2");
  });

  it("filters by multiple severities", () => {
    const result = filterFindings(mockFindings, {
      severity: ["high", "medium"],
      status: [],
    });
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(["f-2", "f-3"]);
  });

  it("filters by single status", () => {
    const result = filterFindings(mockFindings, {
      severity: [],
      status: ["resolved"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("f-3");
  });

  it("filters by multiple statuses", () => {
    const result = filterFindings(mockFindings, {
      severity: [],
      status: ["open", "accepted"],
    });
    expect(result).toHaveLength(3);
    expect(result.map((f) => f.id)).toEqual(["f-1", "f-2", "f-4"]);
  });

  it("filters by both severity and status (AND logic)", () => {
    const result = filterFindings(mockFindings, {
      severity: ["high", "medium"],
      status: ["open"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("f-2");
  });

  it("returns empty array when no findings match", () => {
    const result = filterFindings(mockFindings, {
      severity: ["low"],
      status: ["open"],
    });
    expect(result).toHaveLength(0);
  });

  it("preserves finding order", () => {
    const result = filterFindings(mockFindings, {
      severity: ["critical", "medium"],
      status: [],
    });
    expect(result.map((f) => f.id)).toEqual(["f-1", "f-3"]);
  });

  it("handles empty findings array", () => {
    const result = filterFindings([], { severity: ["high"], status: [] });
    expect(result).toHaveLength(0);
  });
});

describe("mergeFilters", () => {
  it("preserves current filters when no updates provided", () => {
    const current: FilterState = {
      severity: ["high"],
      status: ["open"],
    };
    const result = mergeFilters(current, {});
    expect(result).toEqual(current);
  });

  it("updates severity when provided", () => {
    const current: FilterState = {
      severity: ["high"],
      status: ["open"],
    };
    const result = mergeFilters(current, { severity: ["medium"] });
    expect(result).toEqual({
      severity: ["medium"],
      status: ["open"],
    });
  });

  it("updates status when provided", () => {
    const current: FilterState = {
      severity: ["high"],
      status: ["open"],
    };
    const result = mergeFilters(current, { status: ["resolved"] });
    expect(result).toEqual({
      severity: ["high"],
      status: ["resolved"],
    });
  });

  it("updates both severity and status", () => {
    const current: FilterState = {
      severity: ["high"],
      status: ["open"],
    };
    const result = mergeFilters(current, {
      severity: ["medium", "low"],
      status: ["resolved", "accepted"],
    });
    expect(result).toEqual({
      severity: ["medium", "low"],
      status: ["resolved", "accepted"],
    });
  });

  it("allows clearing filters", () => {
    const current: FilterState = {
      severity: ["high"],
      status: ["open"],
    };
    const result = mergeFilters(current, {
      severity: [],
      status: [],
    });
    expect(result).toEqual({
      severity: [],
      status: [],
    });
  });
});

describe("integration: parse → filter → build", () => {
  it("round-trips filter state through URL params", () => {
    const original: FilterState = {
      severity: ["high", "medium"],
      status: ["open"],
    };

    const params = buildFilterParams(original);
    const parsed = parseFilterParams(params);

    expect(parsed).toEqual(original);
  });

  it("filters findings and round-trips params", () => {
    const params = { severity: "high,critical", status: "open" };
    const filters = parseFilterParams(params);
    const filtered = filterFindings(mockFindings, filters);
    const rebuilt = buildFilterParams(filters);

    expect(filtered.map((f) => f.id)).toEqual(["f-1", "f-2"]);
    expect(rebuilt).toEqual(params);
  });

  it("handles empty filter result", () => {
    const params = { severity: "low", status: "open" };
    const filters = parseFilterParams(params);
    const filtered = filterFindings(mockFindings, filters);
    const rebuilt = buildFilterParams(filters);

    expect(filtered).toHaveLength(0);
    expect(rebuilt).toEqual(params);
  });
});
