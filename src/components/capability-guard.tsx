import type { ReactNode } from "react";
import { can, type Capability } from "@/lib/auth/capabilities";
import type { Role } from "@/lib/auth/session";
import { DeniedState } from "./feedback-state";

export function CapabilityGuard({ roles, capability, children }: { roles: Role[]; capability: Capability; children: ReactNode }) { return can(roles, capability) ? children : <DeniedState title="Access restricted" description="Your organization role does not allow this action." />; }
