export type Project = { id: string; name: string; slug: string; environment: "sandbox" | "production"; targetCount: number; lastRun: string; readiness: "ready" | "attention" | "blocked" };
export type Target = { id: string; projectId: string; name: string; url: string; kind: "web" | "api"; ownership: "verified" | "pending" | "failed"; status: "active" | "paused" };
export type Suite = { id: string; name: string; description: string; risk: "low" | "medium" | "high"; testCount: number };
export type Finding = { id: string; title: string; severity: "critical" | "high" | "medium" | "low"; status: "open" | "accepted" | "resolved"; evidenceCount: number };
