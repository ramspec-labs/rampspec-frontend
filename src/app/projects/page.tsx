import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { projects } from "@/lib/domain/fixtures";

export default function ProjectsPage() { return <AppShell title="Projects" description="Manage verification workspaces and their release context."><DataTable caption="Project inventory" rows={projects} columns={[{ key: "name", label: "Project", render: (project) => <a className="font-semibold text-accent hover:underline" href={`/projects/${project.id}/targets`}>{project.name}</a> }, { key: "environment", label: "Environment", render: (project) => <span className="capitalize">{project.environment}</span> }, { key: "targets", label: "Targets", render: (project) => project.targetCount }, { key: "readiness", label: "Readiness", render: (project) => <StatusBadge status={project.readiness === "ready" ? "success" : project.readiness === "attention" ? "warning" : "danger"}>{project.readiness}</StatusBadge> }, { key: "lastRun", label: "Last run", render: (project) => <span className="text-muted">{project.lastRun}</span> }]} /></AppShell>; }
