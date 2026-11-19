import { suites, targets } from "@/lib/domain/fixtures";

export const REFERENCE_ORGANIZATION = "organization_00000000-0000-4000-8000-000000000001";
export const FIXTURES = ["sanitized-checkout", "empty-wallet", "recovery-account"] as const;
export type WizardValues = { targetId: string; suiteId: string; fixture: string; timeout: string };
export type WizardDraft = WizardValues & { id: string; organizationId: string; expiresAt: number };
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const TTL = 24 * 60 * 60 * 1000;
export function isDraftId(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }
export function draftKey(organizationId: string, id: string) { return `rampspec.run-draft.${encodeURIComponent(organizationId)}.${id}`; }
export function createWizardDraft(organizationId: string, id = crypto.randomUUID(), now = Date.now()): WizardDraft {
  return { id, organizationId, targetId: targets[0].id, suiteId: suites[0].id, fixture: FIXTURES[0], timeout: "120", expiresAt: now + TTL };
}
export function readWizardDraft(storage: DraftStorage, organizationId: string, id: string, now = Date.now()): WizardDraft | null {
  if (!isDraftId(id)) return null;
  try {
    const raw = storage.getItem(draftKey(organizationId, id));
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (!draft || typeof draft !== "object") return null;
    const d = draft as Partial<WizardDraft>;
    if (d.id !== id || d.organizationId !== organizationId || typeof d.expiresAt !== "number" || !Number.isFinite(d.expiresAt) || now >= d.expiresAt) return null;
    if (![d.targetId, d.suiteId, d.fixture, d.timeout].every(value => typeof value === "string" && value.length <= 120)) return null;
    // Only allowlisted fields survive restoration. This is draft UI state,
    // never a stored token, role, or authoritative run result.
    return { id, organizationId, expiresAt: d.expiresAt, targetId: d.targetId!, suiteId: d.suiteId!, fixture: d.fixture!, timeout: d.timeout! };
  } catch { return null; }
}
export function validateWizardDraft(draft: WizardDraft, step: "selection" | "parameters" | "submit", now = Date.now()): string[] {
  const errors: string[] = [];
  if (!isDraftId(draft.id) || !draft.organizationId || now >= draft.expiresAt) errors.push("This draft expired. Start a new draft.");
  if (!targets.some(target => target.id === draft.targetId)) errors.push("Select an available target.");
  if (!suites.some(suite => suite.id === draft.suiteId)) errors.push("Select an available suite.");
  if (step !== "selection") {
    if (!(FIXTURES as readonly string[]).includes(draft.fixture)) errors.push("Select an available fixture set.");
    const timeout = Number(draft.timeout);
    if (!/^\d+$/.test(draft.timeout) || !Number.isInteger(timeout) || timeout < 30 || timeout > 600) errors.push("Timeout must be a whole number from 30 to 600 seconds.");
  }
  return errors;
}
export function wizardHref(path: string, draft: Pick<WizardDraft, "id" | "organizationId">): string {
  return `${path}?${new URLSearchParams({ draft: draft.id, organization: draft.organizationId })}`;
}
