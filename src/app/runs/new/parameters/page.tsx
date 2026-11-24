"use client";
import { useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useWizardDraft, WizardProblem } from "@/components/run-wizard-state";
import { parametersChanged, useUnsavedChanges } from "@/components/unsaved-changes-dialog";
import { validateWizardDraft, wizardHref, type WizardDraft, type WizardValues } from "@/lib/runs/wizard";

function ParameterEditor({ draft, update }: { draft: WizardDraft; update: (values: Partial<WizardValues>) => void }) {
  const initial = useRef({ fixture: draft.fixture, timeout: draft.timeout });
  const dirty = parametersChanged(initial.current, draft);
  const { dialog, allowNavigation } = useUnsavedChanges(dirty);
  const errors = validateWizardDraft(draft, "parameters");
  return <>
    <section className="max-w-xl rounded-lg border border-line bg-surface p-6 shadow-panel">
      <form onSubmit={event => {
        event.preventDefault();
        if (validateWizardDraft(draft, "parameters").length) return;
        allowNavigation();
        window.location.assign(wizardHref("/runs/new/safety", draft));
      }}>
        <label className="block text-sm font-semibold">Fixture set<select value={draft.fixture} onChange={event => update({ fixture: event.target.value })} className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 font-normal"><option value="sanitized-checkout">Sanitized checkout</option><option value="empty-wallet">Empty wallet</option><option value="recovery-account">Recovery account</option></select></label>
        <label className="mt-5 block text-sm font-semibold">Timeout (seconds)<input type="number" min="30" max="600" step="1" required value={draft.timeout} onChange={event => update({ timeout: event.target.value })} className="mt-2 w-full rounded-md border border-line px-3 py-2 font-normal" /></label>
        {errors.length > 0 && <p role="alert" className="mt-4">{errors.join(" ")}</p>}
        <div className="mt-6 flex items-center gap-4"><a href={wizardHref("/runs/new", draft)} className="underline">Back to selection</a><Button type="submit" disabled={errors.length > 0}>Review safety</Button></div>
      </form>
    </section>{dialog}
  </>;
}

export default function RunParametersPage() {
  const { draft, update, error, startNew } = useWizardDraft();
  return <AppShell title="Run parameters" description="Choose deterministic fixtures and bounded execution settings.">
    {!draft ? <WizardProblem error={error} onStartNew={startNew} /> : <ParameterEditor key={`${draft.organizationId}:${draft.id}`} draft={draft} update={update} />}
  </AppShell>;
}
