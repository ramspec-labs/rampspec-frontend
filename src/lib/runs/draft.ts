import type { Organization } from "@/lib/org/types";

export type RunDraft = {
  target?: string;
  suite?: string;
  fixture?: string;
  timeout?: string;
  organizationId?: string;
};

const STORAGE_KEY = "rampspec:run-draft";

/**
 * Saves a run draft to session storage, scoped to the current organization.
 * Drafts are versioned to ensure future schema changes don't break loading.
 */
export function saveDraft(draft: RunDraft, organization: Organization): void {
  const versionedDraft = {
    v: 1,
    organizationId: organization.id,
    data: {
      target: draft.target,
      suite: draft.suite,
      fixture: draft.fixture,
      timeout: draft.timeout,
    },
  };

  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(versionedDraft));
    }
  } catch (error) {
    // Silently fail if storage is unavailable or quota exceeded
    // This should not interrupt the user's workflow
    console.error("Failed to save run draft:", error);
  }
}

/**
 * Loads a run draft from session storage if it exists and belongs to the current organization.
 * Returns null if:
 * - No draft exists
 * - The draft belongs to a different organization (security boundary)
 * - The draft is stale or corrupted
 */
export function loadDraft(organization: Organization): RunDraft | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Version 1: Check organization boundary
    if (parsed.v === 1) {
      if (parsed.organizationId !== organization.id) {
        // Draft belongs to a different organization, fail closed
        return null;
      }

      const data = parsed.data;
      if (!data || typeof data !== "object") {
        return null;
      }

      return {
        target:
          typeof data.target === "string" && data.target.length > 0
            ? data.target
            : undefined,
        suite:
          typeof data.suite === "string" && data.suite.length > 0
            ? data.suite
            : undefined,
        fixture:
          typeof data.fixture === "string" && data.fixture.length > 0
            ? data.fixture
            : undefined,
        timeout:
          typeof data.timeout === "string" && data.timeout.length > 0
            ? data.timeout
            : undefined,
      };
    }

    // Unknown version, return null
    return null;
  } catch (error) {
    // Silently fail on parse errors or other issues
    // Corrupted drafts should not interrupt the user's workflow
    return null;
  }
}

/**
 * Clears the run draft from session storage.
 * Called after successful submission or when user explicitly discards the draft.
 */
export function clearDraft(): void {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    // Silently fail if storage is unavailable
    console.error("Failed to clear run draft:", error);
  }
}
