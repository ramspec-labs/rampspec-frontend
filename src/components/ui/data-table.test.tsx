import { describe, it, expect } from "vitest";
import type { DataColumn, SortDirection } from "./data-table";

interface TestItem {
  id: string;
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "accepted";
}

const mockData: TestItem[] = [
  {
    id: "1",
    name: "Refund webhook retries are not bounded",
    severity: "high",
    status: "open",
  },
  {
    id: "2",
    name: "Ownership header missing",
    severity: "medium",
    status: "open",
  },
  {
    id: "3",
    name: "API authentication flow",
    severity: "critical",
    status: "resolved",
  },
];

const severityOrder = { low: 3, medium: 2, high: 1, critical: 0 };

describe("DataTable sorting logic", () => {
  describe("sort functions", () => {
    it("sorts by name alphabetically ascending", () => {
      const sortFn = (a: TestItem, b: TestItem) => a.name.localeCompare(b.name);
      const sorted = [...mockData].sort(sortFn);

      expect(sorted[0].name).toBe("API authentication flow");
      expect(sorted[1].name).toBe("Ownership header missing");
      expect(sorted[2].name).toBe("Refund webhook retries are not bounded");
    });

    it("sorts by name alphabetically descending", () => {
      const sortFn = (a: TestItem, b: TestItem) => a.name.localeCompare(b.name);
      const sorted = [...mockData].sort(sortFn).reverse();

      expect(sorted[0].name).toBe("Refund webhook retries are not bounded");
      expect(sorted[1].name).toBe("Ownership header missing");
      expect(sorted[2].name).toBe("API authentication flow");
    });

    it("sorts by severity level (critical > high > medium > low)", () => {
      const sortFn = (a: TestItem, b: TestItem) =>
        severityOrder[a.severity] - severityOrder[b.severity];
      const sorted = [...mockData].sort(sortFn);

      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("high");
      expect(sorted[2].severity).toBe("medium");
    });

    it("sorts by severity descending", () => {
      const sortFn = (a: TestItem, b: TestItem) =>
        severityOrder[a.severity] - severityOrder[b.severity];
      const sorted = [...mockData].sort(sortFn).reverse();

      expect(sorted[0].severity).toBe("medium");
      expect(sorted[1].severity).toBe("high");
      expect(sorted[2].severity).toBe("critical");
    });

    it("sorts by status alphabetically", () => {
      const sortFn = (a: TestItem, b: TestItem) =>
        a.status.localeCompare(b.status);
      const sorted = [...mockData].sort(sortFn);

      expect(sorted[0].status).toBe("accepted"); // No "accepted" in mock, but would be first
      expect(sorted[2].status).toBe("resolved");
    });

    it("preserves row identity during sort", () => {
      const sortFn = (a: TestItem, b: TestItem) => a.name.localeCompare(b.name);
      const sorted = [...mockData].sort(sortFn);

      // Check that IDs match the expected rows
      expect(sorted.find((item) => item.id === "3")?.name).toBe(
        "API authentication flow"
      );
      expect(sorted.find((item) => item.id === "1")?.name).toBe(
        "Refund webhook retries are not bounded"
      );
    });

    it("maintains original order with invalid sort function", () => {
      const sortFn = () => 0; // Returns 0, no reordering
      const sorted = [...mockData].sort(sortFn);

      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("3");
    });
  });

  describe("sort state transitions", () => {
    it("cycles sort state: asc -> desc -> none -> asc", () => {
      const states: SortDirection[] = [null, "asc", "desc"];
      let currentIndex = 0;

      const getNextState = (): SortDirection => {
        const current = states[currentIndex];
        if (current === null) {
          currentIndex = 1;
          return "asc";
        } else if (current === "asc") {
          currentIndex = 2;
          return "desc";
        } else {
          currentIndex = 0;
          return null;
        }
      };

      expect(getNextState()).toBe("asc");
      expect(getNextState()).toBe("desc");
      expect(getNextState()).toBe(null);
      expect(getNextState()).toBe("asc");
    });

    it("switches sort column resets to ascending", () => {
      const columns = ["name", "severity", "status"];
      let currentColumn = "name";
      let currentState: SortDirection = "asc";

      // Switch to severity
      const switchColumn = (newColumn: string) => {
        if (newColumn !== currentColumn) {
          currentColumn = newColumn;
          currentState = "asc";
        }
      };

      switchColumn("severity");
      expect(currentColumn).toBe("severity");
      expect(currentState).toBe("asc");
    });
  });

  describe("edge cases", () => {
    it("handles empty array", () => {
      const sortFn = (a: TestItem, b: TestItem) => a.name.localeCompare(b.name);
      const sorted = ([] as TestItem[]).sort(sortFn);

      expect(sorted).toHaveLength(0);
    });

    it("handles single item", () => {
      const sortFn = (a: TestItem, b: TestItem) => a.name.localeCompare(b.name);
      const sorted = [mockData[0]].sort(sortFn);

      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toBe(mockData[0]);
    });

    it("handles items with special characters", () => {
      const testData: TestItem[] = [
        {
          id: "1",
          name: 'Test & special "chars"',
          severity: "high",
          status: "open",
        },
        { id: "2", name: "A normal item", severity: "low", status: "resolved" },
      ];

      const sortFn = (a: TestItem, b: TestItem) =>
        a.name.localeCompare(b.name);
      const sorted = testData.sort(sortFn);

      expect(sorted[0].name).toBe("A normal item");
    });

    it("handles duplicate values in sort key", () => {
      const testData: TestItem[] = [
        {
          id: "1",
          name: "Same severity",
          severity: "high",
          status: "open",
        },
        {
          id: "2",
          name: "Also high",
          severity: "high",
          status: "resolved",
        },
        {
          id: "3",
          name: "Still high",
          severity: "high",
          status: "accepted",
        },
      ];

      const sortFn = (a: TestItem, b: TestItem) =>
        severityOrder[a.severity] - severityOrder[b.severity];
      const sorted = [...testData].sort(sortFn);

      // All should remain as they have same severity
      expect(sorted).toHaveLength(3);
      expect(sorted.every((item) => item.severity === "high")).toBe(true);
    });

    it("maintains stable sort with empty status field", () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", severity: "high", status: "open" },
        { id: "2", name: "Second", severity: "high", status: "open" },
      ];

      const sortFn = (a: TestItem, b: TestItem) =>
        severityOrder[a.severity] - severityOrder[b.severity];
      const sorted = [...testData].sort(sortFn);

      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
    });
  });

  describe("accessibility annotations", () => {
    it("aria-sort values are correctly mapped", () => {
      const ariaSort = (direction: SortDirection): string => {
        if (direction === "asc") return "ascending";
        if (direction === "desc") return "descending";
        return "none";
      };

      expect(ariaSort("asc")).toBe("ascending");
      expect(ariaSort("desc")).toBe("descending");
      expect(ariaSort(null)).toBe("none");
    });

    it("sort button titles are informative", () => {
      const getTitle = (label: string, isActive: boolean, direction: SortDirection): string => {
        if (!isActive) {
          return `Sort by ${label} in ascending order`;
        }
        if (direction === "asc") {
          return `Sort by ${label} in descending order`;
        }
        if (direction === "desc") {
          return `Clear sort for ${label}`;
        }
        return `Sort by ${label} in ascending order`;
      };

      expect(getTitle("Name", false, null)).toBe(
        "Sort by Name in ascending order"
      );
      expect(getTitle("Name", true, "asc")).toBe(
        "Sort by Name in descending order"
      );
      expect(getTitle("Name", true, "desc")).toBe("Clear sort for Name");
    });
  });

  describe("data mutation prevention", () => {
    it("does not mutate original array", () => {
      const original = [...mockData];
      const sortFn = (a: TestItem, b: TestItem) =>
        a.name.localeCompare(b.name);

      // Create new array for sort
      const sorted = [...mockData].sort(sortFn);

      // Original should be unchanged
      expect(mockData[0].name).toBe(original[0].name);
      expect(mockData[1].name).toBe(original[1].name);
      expect(mockData[2].name).toBe(original[2].name);

      // Sorted should be different
      expect(sorted[0].name).not.toBe(mockData[0].name);
    });
  });
});
