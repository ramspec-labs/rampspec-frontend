"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

const steps = ["Create project", "Configure target", "Verify ownership", "Run readiness check"];
export default function OnboardingPage() { const [current, setCurrent] = useState(0); return <AppShell title="Workspace onboarding" description="Complete the required setup checks before your first run."><ol className="grid gap-3 md:grid-cols-4">{steps.map((step, index) => <li key={step} className={`rounded-lg border p-4 ${index === current ? "border-accent bg-cyan-50" : "border-line bg-surface"}`}><span className="text-xs font-bold text-muted">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 font-semibold">{step}</p><p className="mt-1 text-xs text-muted">{index < current ? "Complete" : index === current ? "In progress" : "Pending"}</p></li>)}</ol><section className="mt-8 max-w-2xl rounded-lg border border-line bg-surface p-6 shadow-panel"><h2 className="text-lg font-bold">{steps[current]}</h2><p className="mt-2 text-sm text-muted">Follow the backend-validated checklist for this setup step. Nothing is marked complete until the server confirms it.</p><div className="mt-6 flex justify-between"><Button variant="secondary" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}>Back</Button><Button onClick={() => setCurrent((value) => Math.min(steps.length - 1, value + 1))}>{current === steps.length - 1 ? "Finish" : "Continue"}</Button></div></section></AppShell>; }
