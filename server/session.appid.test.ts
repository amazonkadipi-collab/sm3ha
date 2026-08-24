import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("session app id fallback", () => {
  it("verifies an admin session when VITE_APP_ID is empty", async () => {
    vi.stubEnv("NAGHMAHUB_JWT_SECRET", "project-session-secret");
    vi.stubEnv("VITE_APP_ID", "");

    const { LOCAL_ADMIN_OPEN_ID, sdk } = await import("./_core/sdk");
    const token = await sdk.signSession({
      openId: LOCAL_ADMIN_OPEN_ID,
      appId: "",
      name: "admin",
    });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: LOCAL_ADMIN_OPEN_ID,
      appId: "naghmahub",
      name: "admin",
    });
  });
});
