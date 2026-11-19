// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import Parameters from "@/app/runs/new/parameters/page";
import Safety from "@/app/runs/new/safety/page";
import Selection from "@/app/runs/new/page";
import { OrganizationProvider, useOrganization } from "./organization-context";
import { draftKey, createWizardDraft, wizardHref } from "@/lib/runs/wizard";
const orgs = [{ id: "org-1", name: "Synthetic one", slug: "one", role: "operator" as const }, { id: "org-2", name: "Synthetic two", slug: "two", role: "viewer" as const }];
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/runs/new"); }); afterEach(cleanup);
function Shell({ children }: { children: React.ReactNode }) { return <OrganizationProvider organizations={orgs}>{children}</OrganizationProvider>; }
it("restores edited parameters through selection, safety and backward navigation", async () => {
  let view = render(<Shell><Selection /></Shell>); await screen.findByLabelText("Suite");
  fireEvent.change(screen.getByLabelText("Suite"), { target: { value: "suite-wallet" } });
  const query = window.location.search; view.unmount(); window.history.replaceState(null, "", "/runs/new/parameters" + query);
  view = render(<Shell><Parameters /></Shell>); await screen.findByLabelText("Timeout (seconds)");
  fireEvent.change(screen.getByLabelText("Timeout (seconds)"), { target: { value: "300" } }); fireEvent.change(screen.getByLabelText("Fixture set"), { target: { value: "empty-wallet" } });
  view.unmount(); window.history.replaceState(null, "", "/runs/new/safety" + query);
  view = render(<Shell><Safety /></Shell>); await screen.findByText("300 seconds"); expect(screen.getByText("empty-wallet")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Back to parameters" }).getAttribute("href")).toContain(query);
  view.unmount(); window.history.replaceState(null, "", "/runs/new/parameters" + query);
  view = render(<Shell><Parameters /></Shell>); await waitFor(() => expect((screen.getByLabelText("Timeout (seconds)") as HTMLInputElement).value).toBe("300"));
  expect((screen.getByLabelText("Fixture set") as HTMLSelectElement).value).toBe("empty-wallet");
  view.unmount(); window.history.replaceState(null, "", "/runs/new" + query); render(<Shell><Selection /></Shell>);
  await waitFor(() => expect((screen.getByLabelText("Suite") as HTMLSelectElement).value).toBe("suite-wallet"));
});
it("blocks malformed restored values at each step", async () => {
  const draft = { ...createWizardDraft("org-1"), fixture: "forged", timeout: "601" };
  sessionStorage.setItem(draftKey(draft.organizationId, draft.id), JSON.stringify(draft)); window.history.replaceState(null, "", wizardHref("/runs/new/safety", draft));
  render(<Shell><Safety /></Shell>); await screen.findByRole("alert"); expect((screen.getByRole("button", { name: "Submit run" }) as HTMLButtonElement).disabled).toBe(true);
});
function Switch() { const { select } = useOrganization(); return <button onClick={() => select("org-2")}>Switch organization</button>; }
it("never restores the old organization's draft after an organization change", async () => {
  render(<Shell><Switch /><Parameters /></Shell>); await screen.findByLabelText("Timeout (seconds)");
  fireEvent.change(screen.getByLabelText("Timeout (seconds)"), { target: { value: "500" } });
  act(() => fireEvent.click(screen.getByRole("button", { name: "Switch organization" })));
  await screen.findByRole("alert"); expect(screen.queryByLabelText("Timeout (seconds)")).toBeNull();
});
