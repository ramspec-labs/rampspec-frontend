"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { suites, targets } from "@/lib/domain/fixtures";
export default function NewRunPage() { const [target, setTarget] = useState(targets[0].id); const [suite, setSuite] = useState(suites[0].id); return <AppShell title="Start a verification run" description="Select the target and backend-defined suite to execute."><section className="max-w-xl rounded-lg border border-line bg-surface p-6 shadow-panel"><label className="block text-sm font-semibold">Target<select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 font-normal">{targets.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.url})</option>)}</select></label><label className="mt-5 block text-sm font-semibold">Suite<select value={suite} onChange={(event) => setSuite(event.target.value)} className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 font-normal">{suites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Button className="mt-6" onClick={() => window.location.assign(`/runs/new/parameters?target=${target}&suite=${suite}`)}>Continue</Button></section></AppShell>; }
