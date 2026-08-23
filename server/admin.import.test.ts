import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin import preview", () => {
  it("generates a slug and flags duplicate provider IDs", async () => {
    const ctx: TrpcContext = {
      user: { id: 1, openId: "admin-test", email: "admin@example.com", name: "Admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.previewImport({ rows: [
      { title: "ليلة هادئة", artist: "نورا الورد", providerVideoId: "demo-one" },
      { title: "نسخة ثانية", artist: "نورا الورد", providerVideoId: "demo-one" },
    ] });
    expect(result.total).toBe(2);
    expect(result.duplicates).toBe(1);
    expect(result.rows[0]?.slug).toContain("نورا-الورد");
    expect(result.rows[1]?.duplicate).toBe(true);
  });
});
