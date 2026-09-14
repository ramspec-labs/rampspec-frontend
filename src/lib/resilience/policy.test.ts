import { expect, it } from "vitest";
import { isFresh, retryDelay } from "./policy";
it("caps retry backoff", () => expect(retryDelay(20)).toBe(10_000));
it("rejects stale data", () => expect(isFresh("2020-01-01", 1000)).toBe(false));
