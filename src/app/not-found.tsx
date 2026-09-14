import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback-state";

export default function NotFound() { return <main className="min-h-screen bg-canvas p-8"><ErrorState title="Page not found" description="The requested workspace page does not exist." action={<Button asChild><Link href="/">Return to overview</Link></Button>} /></main>; }
