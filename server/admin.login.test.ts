import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "@shared/const";
import type { TrpcContext } from "./_core/context";

describe("admin credential login", () => {
  it("accepts the configured secret, sets a session, then clears it on logout", async () => {
    expect(process.env.ADMIN_USERNAME).toBeTruthy();
    expect(process.env.ADMIN_PASSWORD).toBeTruthy();
    const cookie = { set: "", cleared: "", options: undefined as unknown };
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: unknown) => { cookie.set = `${name}=${value}`; cookie.options = options; }, clearCookie: (name: string) => { cookie.cleared = name; } } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminLogin({ username: process.env.ADMIN_USERNAME!, password: process.env.ADMIN_PASSWORD! });
    expect(result.success).toBe(true);
    expect(cookie.set.startsWith(`${COOKIE_NAME}=`)).toBe(true);
    expect(cookie.options).toMatchObject({ httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
    await caller.auth.logout();
    expect(cookie.cleared).toBe(COOKIE_NAME);
  });

  it("rejects an incorrect password", async () => {
    expect(process.env.ADMIN_USERNAME).toBeTruthy();
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    await expect(appRouter.createCaller(ctx).auth.adminLogin({ username: process.env.ADMIN_USERNAME!, password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
