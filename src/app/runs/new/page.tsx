"use client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useWizardDraft, WizardProblem } from "@/components/run-wizard-state";
import { suites, targets } from "@/lib/domain/fixtures";
import { validateWizardDraft, wizardHref } from "@/lib/runs/wizard";

export default function NewRunPage() {
  const { draft, update, error, startNew } = useWizardDraft();
  const errors = draft ? validateWizardDraft(draft, "selection") : [];
  return <AppShell title="Start a verification run" description="Select the target and backend-defined suite to execute.">
    {!draft ? <WizardProblem error={error} onStartNew={startNew} /> : <section className="max-w-xl rounded-lg border border-line bg-surface p-6 shadow-panel">
      <label className="block text-sm font-semibold">Target<select value={draft.targetId} onChange={event => update({ targetId: event.target.value })} className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 font-normal">{targets.map(item => <option key={item.id} value={item.id}>{item.name} ({item.url})</option>)}</select></label>
      <label className="mt-5 block text-sm font-semibold">Suite<select value={draft.suiteId} onChange={event => update({ suiteId: event.target.value })} className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 font-normal">{suites.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {errors.length > 0 && <p role="alert" className="mt-4">{errors.join(" ")}</p>}
      <Button className="mt-6" disabled={errors.length > 0} onClick={() => { if (!validateWizardDraft(draft, "selection").length) window.location.assign(wizardHref("/runs/new/parameters", draft)); }}>Continue</Button>
      <button type="button" onClick={startNew} className="ml-4 underline">Start a new draft</button>
    </section>}
  </AppShell>;
}
