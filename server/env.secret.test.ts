import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("session secret configuration", () => {
  it("prefers the project secret over the empty built-in JWT secret", async () => {
    vi.stubEnv("NAGHMAHUB_JWT_SECRET", "project-session-secret");
    vi.stubEnv("JWT_SECRET", "");

    const { ENV } = await import("./_core/env");

    expect(ENV.cookieSecret).toBe("project-session-secret");
  });
});
