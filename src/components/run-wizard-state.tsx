"use client";
import { useEffect, useState } from "react";
import { useOptionalOrganization } from "./organization-context";
import { createWizardDraft, draftKey, isDraftId, readWizardDraft, REFERENCE_ORGANIZATION, wizardHref, type WizardDraft, type WizardValues } from "@/lib/runs/wizard";

export function useWizardDraft() {
  const organization = useOptionalOrganization();
  const organizationId = organization?.current.id ?? REFERENCE_ORGANIZATION;
  const [loaded, setLoaded] = useState<{ scope: string; draft?: WizardDraft; error?: string }>();
  const draft = loaded?.scope === organizationId ? loaded.draft : undefined;
  useEffect(() => {
    try {
      const query = new URLSearchParams(window.location.search);
      const id = query.get("draft");
      if ((query.has("organization") && query.get("organization") !== organizationId) || (id && !isDraftId(id))) {
        setLoaded({ scope: organizationId, error: "This draft belongs to a different workspace or is invalid. Start a new draft." }); return;
      }
      const restored = id ? readWizardDraft(sessionStorage, organizationId, id) : createWizardDraft(organizationId);
      if (!restored) { setLoaded({ scope: organizationId, error: "This draft is missing or expired. Start a new draft." }); return; }
      sessionStorage.setItem(draftKey(organizationId, restored.id), JSON.stringify(restored));
      if (!id) window.history.replaceState(window.history.state, "", wizardHref(window.location.pathname, restored));
      setLoaded({ scope: organizationId, draft: restored });
    } catch { setLoaded({ scope: organizationId, error: "Draft storage is unavailable. Enable tab storage and start a new draft." }); }
  }, [organizationId]);
  function update(values: Partial<WizardValues>) {
    if (!draft) return;
    const next = { ...draft, ...values };
    try {
      sessionStorage.setItem(draftKey(organizationId, draft.id), JSON.stringify(next));
      setLoaded({ scope: organizationId, draft: next });
    } catch { setLoaded({ scope: organizationId, error: "Could not save this draft. Start a new draft before continuing." }); }
  }
  function startNew() {
    try {
      if (draft) sessionStorage.removeItem(draftKey(organizationId, draft.id));
      const next = createWizardDraft(organizationId);
      sessionStorage.setItem(draftKey(organizationId, next.id), JSON.stringify(next));
      window.location.assign(wizardHref("/runs/new", next));
    } catch { setLoaded({ scope: organizationId, error: "Draft storage is unavailable." }); }
  }
  return { draft, update, startNew, error: loaded?.scope === organizationId ? loaded.error : undefined };
}

export function WizardProblem({ error, onStartNew }: { error?: string; onStartNew: () => void }) {
  return error ? <div><p role="alert">{error}</p><button type="button" onClick={onStartNew} className="mt-4 underline">Start a new draft</button></div> : <p role="status">Loading run draft…</p>;
}
