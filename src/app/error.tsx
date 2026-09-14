"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback-state";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="min-h-screen bg-canvas p-8"><ErrorState title="Workspace unavailable" description="The workspace could not be loaded. Retry the request or contact an administrator if it continues." action={<Button onClick={reset}>Retry</Button>} /></main>; }
