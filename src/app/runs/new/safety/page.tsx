"use client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useWizardDraft, WizardProblem } from "@/components/run-wizard-state";
import { validateWizardDraft, wizardHref } from "@/lib/runs/wizard";

export default function SafetyPage() {
  const { draft, error, startNew } = useWizardDraft();
  const errors = draft ? validateWizardDraft(draft, "parameters") : [];
  return <AppShell title="Safety preview" description="Confirm the exact bounded operation before submission.">
    {!draft ? <WizardProblem error={error} onStartNew={startNew} /> : <section className="max-w-2xl rounded-lg border border-line bg-surface p-6 shadow-panel">
      <dl className="grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-muted">Fixture</dt><dd className="mt-1 font-semibold">{draft.fixture}</dd></div><div><dt className="text-muted">Timeout</dt><dd className="mt-1 font-semibold">{draft.timeout} seconds</dd></div><div><dt className="text-muted">Write access</dt><dd className="mt-1 font-semibold">Disabled by default</dd></div><div><dt className="text-muted">Evidence</dt><dd className="mt-1 font-semibold">Captured per backend policy</dd></div></dl>
      <div className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">This preview is informational. The backend validates permissions, target ownership, and safety constraints again at submission.</div>
      {errors.length > 0 && <p role="alert" className="mt-4">{errors.join(" ")}</p>}
      <div className="mt-6 flex items-center gap-4"><a href={wizardHref("/runs/new/parameters", draft)} className="underline">Back to parameters</a><Button disabled={errors.length > 0} onClick={() => { if (!validateWizardDraft(draft, "parameters").length) window.location.assign(wizardHref("/runs/new/submit", draft)); }}>Submit run</Button></div>
    </section>}
  </AppShell>;
}
