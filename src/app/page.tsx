import { ArrowUpRight, CheckCircle2, CircleDashed, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = ["Overview", "Projects", "Runs", "Reports"];
const readinessCards: Array<{ label: string; value: string; tone: "success" | "accent" | "warning"; Icon: LucideIcon }> = [
  { label: "Release readiness", value: "Ready with 2 notes", tone: "success", Icon: CheckCircle2 },
  { label: "Active runs", value: "1 in progress", tone: "accent", Icon: CircleDashed },
  { label: "Evidence coverage", value: "94% complete", tone: "warning", Icon: ShieldCheck },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <a href="/" className="text-lg font-bold tracking-tight">RampSpec</a>
            <nav aria-label="Primary" className="hidden gap-5 text-sm text-muted md:flex">
              {navigation.map((item, index) => (
                <a key={item} href={index === 0 ? "/" : `/${item.toLowerCase()}`} className={index === 0 ? "font-semibold text-ink" : "hover:text-ink"}>
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <Button variant="secondary" size="sm"><ShieldCheck size={16} /> Demo workspace</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">Acme Labs</p>
            <h1 className="text-3xl font-bold tracking-tight">Verification overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">Review release readiness, active runs, and the evidence that backs each decision.</p>
          </div>
          <Button><CircleDashed size={16} /> Start a run <ArrowUpRight size={16} /></Button>
        </div>
        <section aria-labelledby="readiness-heading" className="grid gap-4 md:grid-cols-3">
          <h2 id="readiness-heading" className="sr-only">Readiness summary</h2>
          {readinessCards.map(({ label, value, tone, Icon }) => (
            <article key={label as string} className="rounded-lg border border-line bg-surface p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{label}</p>
                <span className={`text-${tone}`}><Icon size={18} /></span>
              </div>
              <p className="mt-4 text-2xl font-bold">{value}</p>
            </article>
          ))}
        </section>
        <section className="mt-8 rounded-lg border border-line bg-surface shadow-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div><h2 className="font-semibold">Recent verification activity</h2><p className="mt-1 text-sm text-muted">Backend-authoritative run status</p></div>
            <a href="/runs" className="text-sm font-semibold text-accent hover:underline">View all</a>
          </div>
          <div className="divide-y divide-line">
            {["Checkout smoke suite", "Wallet recovery controls", "Identity handoff"].map((name, index) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div><p className="font-medium">{name}</p><p className="mt-1 text-xs text-muted">Run #{1204 - index} · 18 minutes ago</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index === 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{index === 1 ? "Needs review" : "Passed"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
