"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { validateScenarioSource } from "@/lib/scenarios/validate";
const initial = "name: checkout-smoke\nsteps:\n  - capability: checkout.create";
export default function ScenariosPage() { const [source, setSource] = useState(initial); const result = validateScenarioSource(source); return <AppShell title="Scenario editor" description="Author declarative scenarios with client-side safety checks before server validation."><section className="grid gap-5 lg:grid-cols-[1fr_320px]"><textarea aria-label="Scenario YAML" value={source} onChange={(event) => setSource(event.target.value)} className="min-h-[420px] rounded-lg border border-line bg-slate-950 p-5 font-mono text-sm text-slate-100" /><aside className="rounded-lg border border-line bg-surface p-5 shadow-panel"><h2 className="font-semibold">Validation</h2>{result.valid ? <p className="mt-3 text-sm text-emerald-700">No client-side policy errors.</p> : <ul className="mt-3 space-y-2 text-sm text-red-700">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>}<Button className="mt-6" disabled={!result.valid}>Validate with backend</Button></aside></section></AppShell>; }
