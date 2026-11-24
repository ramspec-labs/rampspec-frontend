import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { saveDraft, loadDraft, clearDraft, type RunDraft } from "./draft";
import type { Organization } from "@/lib/org/types";

const mockOrganization: Organization = {
  id: "org_test_1",
  name: "Test Org",
  slug: "test-org",
  role: "owner",
};

const anotherOrganization: Organization = {
  id: "org_test_2",
  name: "Another Org",
  slug: "another-org",
  role: "operator",
};

describe("run draft persistence", () => {
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    sessionStorageMock = {};
    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: (key: string) => sessionStorageMock[key] ?? null,
        setItem: (key: string, value: string) => {
          sessionStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete sessionStorageMock[key];
        },
        clear: () => {
          sessionStorageMock = {};
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    sessionStorageMock = {};
  });

  describe("saveDraft", () => {
    it("stores complete draft parameters with organization context", () => {
      const draft: RunDraft = {
        target: "target_1",
        suite: "suite_1",
        fixture: "sanitized-checkout",
        timeout: "120",
      };

      saveDraft(draft, mockOrganization);

      const stored = sessionStorageMock["rampspec:run-draft"];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.v).toBe(1);
      expect(parsed.organizationId).toBe("org_test_1");
      expect(parsed.data).toEqual({
        target: "target_1",
        suite: "suite_1",
        fixture: "sanitized-checkout",
        timeout: "120",
      });
    });

    it("stores partial draft parameters", () => {
      const draft: RunDraft = {
        target: "target_1",
        suite: "suite_1",
      };

      saveDraft(draft, mockOrganization);

      const parsed = JSON.parse(sessionStorageMock["rampspec:run-draft"]!);
      expect(parsed.data.target).toBe("target_1");
      expect(parsed.data.suite).toBe("suite_1");
      expect(parsed.data.fixture).toBeUndefined();
      expect(parsed.data.timeout).toBeUndefined();
    });

    it("stores empty draft", () => {
      const draft: RunDraft = {};

      saveDraft(draft, mockOrganization);

      const stored = sessionStorageMock["rampspec:run-draft"];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.organizationId).toBe("org_test_1");
    });

    it("overwrites previous draft", () => {
      saveDraft({ target: "target_1" }, mockOrganization);
      saveDraft({ target: "target_2", suite: "suite_1" }, mockOrganization);

      const parsed = JSON.parse(sessionStorageMock["rampspec:run-draft"]!);
      expect(parsed.data.target).toBe("target_2");
      expect(parsed.data.suite).toBe("suite_1");
    });

    it("handles storage quota exceeded gracefully", () => {
      const mockError = new Error("QuotaExceededError");
      const setItemSpy = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      Object.defineProperty(window, "sessionStorage", {
        value: {
          setItem: setItemSpy,
          getItem: () => null,
          removeItem: () => {},
        },
        writable: true,
      });

      const consoleErrorSpy = vi.spyOn(console, "error");
      expect(() => saveDraft({ target: "target_1" }, mockOrganization)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("handles missing window.sessionStorage gracefully", () => {
      Object.defineProperty(window, "sessionStorage", {
        value: undefined,
        writable: true,
      });

      expect(() => saveDraft({ target: "target_1" }, mockOrganization)).not.toThrow();
    });
  });

  describe("loadDraft", () => {
    it("loads complete draft from storage", () => {
      const draft: RunDraft = {
        target: "target_1",
        suite: "suite_1",
        fixture: "sanitized-checkout",
        timeout: "120",
      };

      saveDraft(draft, mockOrganization);
      const loaded = loadDraft(mockOrganization);

      expect(loaded).toEqual(draft);
    });

    it("loads partial draft from storage", () => {
      const draft: RunDraft = {
        target: "target_1",
        suite: "suite_1",
      };

      saveDraft(draft, mockOrganization);
      const loaded = loadDraft(mockOrganization);

      expect(loaded?.target).toBe("target_1");
      expect(loaded?.suite).toBe("suite_1");
      expect(loaded?.fixture).toBeUndefined();
      expect(loaded?.timeout).toBeUndefined();
    });

    it("returns null when no draft exists", () => {
      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });

    it("returns null when organization does not match", () => {
      saveDraft({ target: "target_1" }, mockOrganization);
      const loaded = loadDraft(anotherOrganization);
      expect(loaded).toBeNull();
    });

    it("returns null for invalid JSON in storage", () => {
      sessionStorageMock["rampspec:run-draft"] = "invalid json {";
      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });

    it("returns null for malformed draft structure", () => {
      sessionStorageMock["rampspec:run-draft"] = JSON.stringify({
        v: 1,
        organizationId: "org_test_1",
        data: null,
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });

    it("returns null for unknown version", () => {
      sessionStorageMock["rampspec:run-draft"] = JSON.stringify({
        v: 999,
        organizationId: "org_test_1",
        data: { target: "target_1" },
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });

    it("filters out empty string values", () => {
      sessionStorageMock["rampspec:run-draft"] = JSON.stringify({
        v: 1,
        organizationId: "org_test_1",
        data: {
          target: "target_1",
          suite: "",
          fixture: "sanitized-checkout",
          timeout: "",
        },
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded?.target).toBe("target_1");
      expect(loaded?.suite).toBeUndefined();
      expect(loaded?.fixture).toBe("sanitized-checkout");
      expect(loaded?.timeout).toBeUndefined();
    });

    it("filters out non-string values", () => {
      sessionStorageMock["rampspec:run-draft"] = JSON.stringify({
        v: 1,
        organizationId: "org_test_1",
        data: {
          target: 123,
          suite: null,
          fixture: true,
          timeout: "120",
        },
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded?.target).toBeUndefined();
      expect(loaded?.suite).toBeUndefined();
      expect(loaded?.fixture).toBeUndefined();
      expect(loaded?.timeout).toBe("120");
    });

    it("handles missing window gracefully", () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();

      (global as any).window = originalWindow;
    });

    it("handles missing window.sessionStorage gracefully", () => {
      Object.defineProperty(window, "sessionStorage", {
        value: undefined,
        writable: true,
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });

    it("returns null when organizationId mismatches in v1 draft", () => {
      sessionStorageMock["rampspec:run-draft"] = JSON.stringify({
        v: 1,
        organizationId: "org_different",
        data: {
          target: "target_1",
          suite: "suite_1",
        },
      });

      const loaded = loadDraft(mockOrganization);
      expect(loaded).toBeNull();
    });
  });

  describe("clearDraft", () => {
    it("removes draft from storage", () => {
      saveDraft({ target: "target_1" }, mockOrganization);
      expect(sessionStorageMock["rampspec:run-draft"]).toBeDefined();

      clearDraft();

      expect(sessionStorageMock["rampspec:run-draft"]).toBeUndefined();
    });

    it("succeeds when no draft exists", () => {
      expect(() => clearDraft()).not.toThrow();
    });

    it("handles storage errors gracefully", () => {
      const removeItemSpy = vi.fn().mockImplementation(() => {
        throw new Error("Storage error");
      });

      Object.defineProperty(window, "sessionStorage", {
        value: {
          removeItem: removeItemSpy,
          getItem: () => null,
          setItem: () => {},
        },
        writable: true,
      });

      const consoleErrorSpy = vi.spyOn(console, "error");
      expect(() => clearDraft()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("handles missing window.sessionStorage gracefully", () => {
      Object.defineProperty(window, "sessionStorage", {
        value: undefined,
        writable: true,
      });

      expect(() => clearDraft()).not.toThrow();
    });
  });

  describe("security boundaries", () => {
    it("never exposes drafts across organizations", () => {
      saveDraft(
        { target: "secret_target", suite: "secret_suite" },
        mockOrganization
      );

      const loadedByOther = loadDraft(anotherOrganization);
      expect(loadedByOther).toBeNull();
    });

    it("does not store credentials or secrets", () => {
      const draft: RunDraft = {
        target: "target_1",
        suite: "suite_1",
      };

      saveDraft(draft, mockOrganization);

      const stored = sessionStorageMock["rampspec:run-draft"];
      // Ensure no sensitive fields like tokens, passwords, API keys are stored
      expect(stored).not.toContain("token");
      expect(stored).not.toContain("password");
      expect(stored).not.toContain("secret");
    });
  });

  describe("edge cases", () => {
    it("handles special characters in draft values", () => {
      const draft: RunDraft = {
        target: "target_with-special.chars_123",
        suite: 'suite"with\'quotes',
      };

      saveDraft(draft, mockOrganization);
      const loaded = loadDraft(mockOrganization);

      expect(loaded?.target).toBe(draft.target);
      expect(loaded?.suite).toBe(draft.suite);
    });

    it("preserves numeric-like strings", () => {
      const draft: RunDraft = {
        timeout: "300",
        target: "0",
      };

      saveDraft(draft, mockOrganization);
      const loaded = loadDraft(mockOrganization);

      expect(loaded?.timeout).toBe("300");
      expect(loaded?.target).toBe("0");
    });

    it("handles very long parameter values", () => {
      const longValue = "x".repeat(1000);
      const draft: RunDraft = {
        target: longValue,
      };

      saveDraft(draft, mockOrganization);
      const loaded = loadDraft(mockOrganization);

      expect(loaded?.target).toBe(longValue);
    });
  });
});
