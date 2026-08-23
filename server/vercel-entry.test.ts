import { describe, expect, it } from "vitest";

describe("Vercel entrypoint", () => {
  it("creates an Express app without starting a local listener", async () => {
    process.env.VERCEL = "1";
    const { createApp } = await import("./_core/index");
    const app = createApp();
    expect(typeof app).toBe("function");
    expect(app).toHaveProperty("listen");

    const stack = (app as typeof app & { _router?: { stack?: Array<{ route?: { path?: string } }> } })._router?.stack ?? [];
    const paths = stack.map(layer => layer.route?.path).filter(Boolean);
    expect(paths).toContain("/api/demo-download/:token");
  });
});
