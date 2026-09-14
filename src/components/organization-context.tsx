"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Organization } from "@/lib/org/types";

const OrganizationContext = createContext<{ organizations: Organization[]; current: Organization; select: (id: string) => void } | null>(null);
export function OrganizationProvider({ organizations, children }: { organizations: Organization[]; children: ReactNode }) {
  const [currentId, setCurrentId] = useState(organizations[0]?.id ?? "");
  const current = organizations.find((org) => org.id === currentId) ?? organizations[0];
  if (!current) throw new Error("At least one organization is required");
  const value = useMemo(() => ({ organizations, current, select: setCurrentId }), [organizations, current]);
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
export function useOrganization() { const value = useContext(OrganizationContext); if (!value) throw new Error("useOrganization must be used within OrganizationProvider"); return value; }
