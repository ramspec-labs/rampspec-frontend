"use client";

import { ChevronsUpDown } from "lucide-react";
import { useOrganization } from "./organization-context";

export function OrganizationSwitcher() { const { organizations, current, select } = useOrganization(); return <label className="flex items-center gap-2 text-sm"><span className="sr-only">Organization</span><ChevronsUpDown size={15} className="text-muted" /><select aria-label="Organization" value={current.id} onChange={(event) => select(event.target.value)} className="max-w-48 bg-transparent font-semibold outline-none"><option value={current.id}>{current.name}</option>{organizations.filter((org) => org.id !== current.id).map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>; }
