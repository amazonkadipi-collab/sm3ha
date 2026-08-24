import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("admin session HTTP flow", () => {
  it("keeps the admin session usable through auth.me without VITE_APP_ID", async () => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "111111");
    vi.stubEnv("NAGHMAHUB_JWT_SECRET", "project-session-secret");
    vi.stubEnv("VITE_APP_ID", "");

    const { createApp } = await import("./app");
    const server = http.createServer(createApp());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const loginResponse = await fetch(`${baseUrl}/api/trpc/auth.adminLogin?batch=1`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { username: "admin", password: "111111" } } }),
      });
      expect(loginResponse.status).toBe(200);
      expect((await loginResponse.json())[0].result.data.json).toMatchObject({ success: true });

      const setCookie = loginResponse.headers.get("set-cookie");
      expect(setCookie).toContain("app_session_id=");
      const cookie = setCookie!.split(";", 1)[0];

      const meResponse = await fetch(`${baseUrl}/api/trpc/auth.me?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: null } }))}`, {
        headers: { cookie },
      });
      expect(meResponse.status).toBe(200);
      expect((await meResponse.json())[0].result.data.json).toMatchObject({ openId: "local_admin", role: "admin" });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
