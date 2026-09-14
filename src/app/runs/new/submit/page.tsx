"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
export default function SubmitRunPage() { const [status, setStatus] = useState<"idle" | "queued">("idle"); return <AppShell title="Submit run" description="Send the reviewed request to the backend queue."><section className="max-w-xl rounded-lg border border-line bg-surface p-6 shadow-panel"><p className="text-sm text-muted">A unique request key protects against duplicate submissions if the network retries.</p><code className="mt-4 block rounded-md bg-canvas p-3 text-xs">ramp-run-20260914-001</code><Button className="mt-6" onClick={() => setStatus("queued")} disabled={status === "queued"}>{status === "queued" ? "Run queued" : "Submit once"}</Button>{status === "queued" && <p className="mt-4 text-sm font-semibold text-emerald-700">Run accepted. Open the live timeline to monitor backend events.</p>}</section></AppShell>; }
