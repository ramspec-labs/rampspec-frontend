import { Activity, FileCheck2, FolderKanban, LayoutDashboard, PlayCircle, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  ["Overview", "/", LayoutDashboard],
  ["Projects", "/projects", FolderKanban],
  ["Runs", "/runs", PlayCircle],
  ["Reports", "/reports", FileCheck2],
  ["Evidence", "/evidence", Activity],
] as const;

export function AppShell({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-line bg-surface lg:block">
        <div className="flex h-full flex-col px-4 py-5">
          <a href="/" className="px-3 text-lg font-bold tracking-tight">RampSpec</a>
          <p className="px-3 pt-1 text-xs text-muted">Acme Labs workspace</p>
          <nav aria-label="Workspace" className="mt-8 space-y-1">
            {items.map(([label, href, Icon]) => <a key={label} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"><Icon size={17} />{label}</a>)}
          </nav>
          <a href="/settings" className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"><Settings2 size={17} />Settings</a>
        </div>
      </aside>
      <div className="lg:pl-64"><header className="border-b border-line bg-surface px-6 py-5"><h1 className="text-xl font-bold">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</header><main className="mx-auto max-w-7xl px-6 py-8">{children}</main></div>
    </div>
  );
}
