import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { hashRequestValue } from "./admin-observability";
import type { TrpcContext } from "./_core/context";

const context = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {}, socket: { remoteAddress: "127.0.0.1" } } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("admin observability contracts", () => {
  it("hashes request identity deterministically without returning the source", () => {
    const first = hashRequestValue("203.0.113.4");
    expect(first).toHaveLength(64);
    expect(first).toBe(hashRequestValue("203.0.113.4"));
    expect(first).not.toContain("203.0.113.4");
  });

  it("accepts a privacy-safe public analytics event", async () => {
    const result = await appRouter.createCaller(context()).observability.track({ eventName: "page_view", path: "/search", metadata: { title: "بحث" } });
    expect(result).toEqual({ accepted: true });
  });

  it("rejects an incomplete DMCA request before persistence", async () => {
    await expect(appRouter.createCaller(context()).takedown.submit({ claimantName: "أ", claimantEmail: "invalid", reason: "قصير" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
