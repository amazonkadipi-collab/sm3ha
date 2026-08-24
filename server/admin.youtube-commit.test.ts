import { beforeAll, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistImportedRows = vi.fn(async (rows: unknown[]) => ({ accepted: rows.length, status: "persisted_demo" as const }));
vi.mock("./supabase", async () => {
  const actual = await vi.importActual<typeof import("./supabase")>("./supabase");
  return { ...actual, getSupabaseAdmin: vi.fn(() => ({})), persistImportedRows };
});

let appRouter: typeof import("./routers").appRouter;

beforeAll(async () => {
  ({ appRouter } = await import("./routers"));
});

describe("admin YouTube commit", () => {
  it("passes provider metadata to the persistence layer", async () => {
    const ctx: TrpcContext = {
      user: { id: 1, openId: "admin-test", email: "admin@example.com", name: "Admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const row = { title: "أغنية YouTube", artist: "قناة عربية", providerVideoId: "yt-one", provider: "youtube", thumbnailUrl: "https://i.ytimg.com/vi/yt-one/hqdefault.jpg", durationSeconds: 192 };
    const result = await appRouter.createCaller(ctx).admin.commitImport({ rows: [row] });
    expect(result.accepted).toBe(1);
    expect(persistImportedRows).toHaveBeenCalledWith([row]);
  });
});
