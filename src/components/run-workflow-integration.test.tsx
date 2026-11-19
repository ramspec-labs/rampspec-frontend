// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Parameters from "@/app/runs/new/parameters/page";
import Submit from "@/app/runs/new/submit/page";
import { OrganizationProvider, useOrganization } from "./organization-context";
import { createWizardDraft, draftKey, wizardHref } from "@/lib/runs/wizard";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async original => ({ ...await original<object>(), ApiClient: class { post = post; } }));
const organizations = [{ id:"org-1",name:"Synthetic one",slug:"one",role:"operator" as const },{ id:"org-2",name:"Synthetic two",slug:"two",role:"viewer" as const }];
function Shell({children}:{children:React.ReactNode}) { return <OrganizationProvider organizations={organizations}>{children}</OrganizationProvider>; }
function Switch() { const {select}=useOrganization();return <button onClick={()=>select("org-2")}>Switch organization</button>; }
beforeEach(()=>{post.mockReset();sessionStorage.clear();window.history.replaceState(null,"","/runs/new");});
afterEach(cleanup);

it("restores a non-default draft without warning, warns for new edits and preserves tab-local changes",async()=>{
  const draft={...createWizardDraft("org-1"),timeout:"300",fixture:"empty-wallet"};
  sessionStorage.setItem(draftKey(draft.organizationId,draft.id),JSON.stringify(draft));
  window.history.replaceState(null,"",wizardHref("/runs/new/parameters",draft));
  render(<Shell><Parameters/></Shell>);
  const field=await screen.findByLabelText("Timeout (seconds)");
  expect((field as HTMLInputElement).value).toBe("300");
  expect(window.dispatchEvent(new Event("beforeunload",{cancelable:true}))).toBe(true);
  fireEvent.change(field,{target:{value:"400"}});
  expect(window.dispatchEvent(new Event("beforeunload",{cancelable:true}))).toBe(false);
  expect(JSON.parse(sessionStorage.getItem(draftKey(draft.organizationId,draft.id))!).timeout).toBe("400");
  fireEvent.click(screen.getByRole("link",{name:"Back to selection"}));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Stay and edit"}));
  expect((field as HTMLInputElement).value).toBe("400");
  fireEvent.change(field,{target:{value:"300"}});
  expect(window.dispatchEvent(new Event("beforeunload",{cancelable:true}))).toBe(true);
});

it("submits validated origins with restored parameters and ignores a late result after switching organization",async()=>{
  const draft={...createWizardDraft("org-1"),timeout:"300",fixture:"empty-wallet"};
  sessionStorage.setItem(draftKey(draft.organizationId,draft.id),JSON.stringify(draft));
  window.history.replaceState(null,"",wizardHref("/runs/new/submit",draft));
  let complete!:(value:unknown)=>void;
  post.mockImplementation(()=>new Promise(resolve=>{complete=resolve;}));
  render(<Shell><Switch/><Submit/></Shell>);
  const field=await screen.findByLabelText("Target origin");
  fireEvent.change(field,{target:{value:"http://invalid.example"}});
  fireEvent.click(screen.getByRole("button",{name:"Run reference check"}));expect(post).not.toHaveBeenCalled();
  fireEvent.change(field,{target:{value:"HTTPS://Anchor.Example:443/"}});
  fireEvent.click(screen.getByRole("button",{name:"Run reference check"}));
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][1]).toMatchObject({targetOrigin:"https://anchor.example",effectiveConfig:{fixture:"empty-wallet",timeoutSeconds:300,selectedTargetId:draft.targetId,selectedSuiteId:draft.suiteId}});
  fireEvent.click(screen.getByRole("button",{name:"Switch organization"}));
  await screen.findByRole("alert");
  await act(async()=>complete({run:{id:"old-organization-result",state:"completed"}}));
  await waitFor(()=>expect(screen.queryByText("old-organization-result")).toBeNull());
  expect(screen.queryByLabelText("Target origin")).toBeNull();
});
