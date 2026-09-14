import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./index";

describe("ApiClient", () => {
  it("sends auth and idempotency headers", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = new ApiClient({ baseUrl: "https://api.example.test", fetcher, getToken: () => "token" });
    await client.post("/v1/runs", { suiteId: "suite" }, "key-1");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ authorization: "Bearer token", "Idempotency-Key": "key-1" }) });
  });
  it("normalizes RFC problem details", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ type: "https://example.test/problem", title: "Denied", status: 403 }), { status: 403 }));
    await expect(new ApiClient({ baseUrl: "https://api.example.test", fetcher }).get("/v1/projects")).rejects.toBeInstanceOf(ApiError);
  });
});
