import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { originValidationMessage, submitReferenceRun, validateTargetOrigin } from "./reference";
describe("HTTPS origins", () => {
  it.each([[" HTTPS://Anchor.Example:443/ ", "https://anchor.example"], ["https://anchor.example:8443", "https://anchor.example:8443"], ["https://[::1]/", "https://[::1]"]])("normalizes %s", (input, origin) => { expect(validateTargetOrigin(input)).toEqual({ origin }); });
  it.each(["", "http://anchor.example", "javascript:alert(1)", "https:anchor.example", "https:///anchor.example", "https://user:password@anchor.example", "https://@anchor.example", "https://anchor.example/path", "https://anchor.example?", "https://anchor.example#", "https://anchor.example/#fragment", "https://anchor.example\\evil", "https://anchor.\nexample", "https://anchor.example:99999", "https://127.1", "https://0x7f000001", "https://%61nchor.example", "https://anchor.example.", "https://аnchor.example"])('rejects ambiguous/unsafe input %s', input => { expect(validateTargetOrigin(input).error).toBeTruthy(); });
  it("validates before dispatch and normalizes the submitted value without mutating input", async () => {
    const post = vi.fn().mockResolvedValue({});
    const input = { projectId: "project", suiteId: "suite", suiteVersion: "1", targetId: "target", targetOrigin: " HTTPS://Anchor.Example:443/ " };
    await submitReferenceRun({ post }, input, "request-key");
    expect(post).toHaveBeenCalledWith("/v1/reference-runs", { ...input, targetOrigin: "https://anchor.example" }, "request-key");
    expect(input.targetOrigin).toBe(" HTTPS://Anchor.Example:443/ ");
    post.mockClear(); await expect(submitReferenceRun({ post }, { ...input, targetOrigin: "http://bad.example" }, "request-key")).rejects.toThrow(); expect(post).not.toHaveBeenCalled();
  });
  it.each(["https://anchor.example/.", "https://anchor.example/%2e", "https://anchor.example:"])("rejects normalized-away ambiguous input %s", input => { expect(validateTargetOrigin(input).error).toBeTruthy(); });
  it("maps origin rejection to the field without mislabelling unauthorized or network errors", () => {
    expect(originValidationMessage(new ApiError({ status: 400, title: "Bad request", detail: "Target origin is not approved", type: "about:blank" }))).toBe("Target origin is not approved");
    expect(originValidationMessage(new ApiError({ status: 401, title: "Target denied", type: "about:blank" }))).toBeUndefined();
    expect(originValidationMessage(new ApiError({ status: 400, title: "targetId is required", type: "about:blank" }))).toBeUndefined();
    expect(originValidationMessage(new Error("Network failed"))).toBeUndefined();
  });
});
