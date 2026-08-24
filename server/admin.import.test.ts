import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { vi } from "vitest";
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

  it("accepts YouTube metadata fields on commit without persisting in this unit test", async () => {
    const previousSupabaseUrl = process.env.SUPABASE_URL;
    const previousSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;
    const ctx: TrpcContext = {
      user: { id: 1, openId: "admin-test", email: "admin@example.com", name: "Admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    try {
      const result = await appRouter.createCaller(ctx).admin.commitImport({ rows: [{ title: "أغنية YouTube", artist: "قناة عربية", providerVideoId: "yt-one", provider: "youtube", thumbnailUrl: "https://i.ytimg.com/vi/yt-one/hqdefault.jpg", durationSeconds: 192 }] });
      expect(result.status).toBe("database_unavailable");
    } finally {
      if (previousSupabaseUrl) process.env.SUPABASE_URL = previousSupabaseUrl;
      if (previousSupabaseKey) process.env.SUPABASE_SERVICE_ROLE_KEY = previousSupabaseKey;
      if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it("maps YouTube search metadata through the protected tRPC procedure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: { videoId: "yt-one" }, snippet: { title: "أغنية تجريبية", channelTitle: "قناة عربية", thumbnails: { high: { url: "https://i.ytimg.com/vi/yt-one/hqdefault.jpg" } } } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "yt-one", contentDetails: { duration: "PT3M12S" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const ctx: TrpcContext = {
      user: { id: 1, openId: "admin-test", email: "admin@example.com", name: "Admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    try {
      const result = await appRouter.createCaller(ctx).youtube.search({ query: "أغنية", limit: 1 });
      expect(result[0]).toMatchObject({ providerVideoId: "yt-one", artist: "قناة عربية", durationSeconds: 192, provider: "youtube" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
