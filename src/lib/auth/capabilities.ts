import type { Role } from "./session";
export type Capability = "projects:read" | "projects:write" | "runs:create" | "runs:read" | "reports:read" | "reports:triage" | "settings:write";
const grants: Record<Role, Capability[]> = { owner: ["projects:read", "projects:write", "runs:create", "runs:read", "reports:read", "reports:triage", "settings:write"], admin: ["projects:read", "projects:write", "runs:create", "runs:read", "reports:read", "reports:triage", "settings:write"], operator: ["projects:read", "runs:create", "runs:read", "reports:read"], viewer: ["projects:read", "runs:read", "reports:read"] };
export function can(roles: Role[], capability: Capability) { return roles.some((role) => grants[role].includes(capability)); }
