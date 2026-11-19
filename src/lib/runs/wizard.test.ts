import { describe, expect, it } from "vitest";
import { createWizardDraft, draftKey, readWizardDraft, validateWizardDraft, wizardHref } from "./wizard";
const id = "00000000-0000-4000-8000-000000000001";
function storage() { const map = new Map<string, string>(); return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } }; }
describe("scoped wizard drafts", () => {
  it("restores only the requested organization and draft, stripping unknown data", () => {
    const store = storage(), draft = createWizardDraft("org-1", id, 100);
    store.setItem(draftKey("org-1", id), JSON.stringify({ ...draft, token: "synthetic" }));
    expect(readWizardDraft(store, "org-1", id, 101)).toEqual(draft);
    expect(readWizardDraft(store, "org-2", id, 101)).toBeNull();
    expect(readWizardDraft(store, "org-1", "00000000-0000-4000-8000-000000000002", 101)).toBeNull();
    store.setItem(draftKey("org-2", id), JSON.stringify(draft)); expect(readWizardDraft(store, "org-2", id, 101)).toBeNull();
  });
  it("rejects malformed, inaccessible and expired drafts at the exact boundary", () => {
    const store = storage(), draft = createWizardDraft("org-1", id, 100);
    for (const raw of ["invalid", "null", "[]", JSON.stringify({ ...draft, timeout: null })]) { store.setItem(draftKey("org-1", id), raw); expect(readWizardDraft(store, "org-1", id, 101)).toBeNull(); }
    store.setItem(draftKey("org-1", id), JSON.stringify(draft)); expect(readWizardDraft(store, "org-1", id, draft.expiresAt)).toBeNull();
    expect(readWizardDraft({ ...store, getItem: () => { throw new Error("disabled"); } }, "org-1", id)).toBeNull();
  });
  it("validates all restored selections and whole-second bounds before navigation", () => {
    const draft = createWizardDraft("org-1", id);
    for (const timeout of ["30", "600"]) expect(validateWizardDraft({ ...draft, timeout }, "submit")).toEqual([]);
    for (const timeout of ["", "29", "601", "1.5", "1e2", " 120 "]) expect(validateWizardDraft({ ...draft, timeout }, "parameters")).not.toEqual([]);
    expect(validateWizardDraft({ ...draft, targetId: "forged" }, "selection")).not.toEqual([]);
    expect(validateWizardDraft({ ...draft, suiteId: "forged" }, "submit")).not.toEqual([]);
    expect(validateWizardDraft({ ...draft, fixture: "forged" }, "parameters")).not.toEqual([]);
  });
  it("keeps the same draft scope in every step URL and starts fresh drafts independently", () => {
    const first = createWizardDraft("org-1", id), second = createWizardDraft("org-1");
    expect(second.id).not.toBe(first.id);
    for (const path of ["/runs/new", "/runs/new/parameters", "/runs/new/safety", "/runs/new/submit"]) {
      const query = new URL(wizardHref(path, first), "https://app.example").searchParams;
      expect(query.get("draft")).toBe(id); expect(query.get("organization")).toBe("org-1");
    }
  });
});
