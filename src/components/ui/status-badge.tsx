import { cn } from "@/lib/utils";

const styles = { success: "bg-emerald-100 text-emerald-800", warning: "bg-amber-100 text-amber-800", danger: "bg-red-100 text-red-800", info: "bg-cyan-100 text-cyan-800", neutral: "bg-slate-100 text-slate-700" } as const;
export function StatusBadge({ status, children }: { status: keyof typeof styles; children: React.ReactNode }) { return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>{children}</span>; }
