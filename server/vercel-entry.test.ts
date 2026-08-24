import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel entrypoint", () => {
  it("exports the Express app from the root entrypoint without starting a listener", async () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";

    try {
      const { createApp } = await import("./_core/index");
      const { default: handler } = await import("../index");
      const app = createApp();

      expect(typeof handler).toBe("function");
      expect(handler).toHaveProperty("listen");
      expect(app).toHaveProperty("listen");

      const stack = (handler as typeof handler & { _router?: { stack?: Array<{ route?: { path?: string } }> } })._router?.stack ?? [];
      const paths = stack.map(layer => layer.route?.path).filter(Boolean);
      expect(paths).toContain("/api/demo-download/:token");
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });

  it("exposes the API catch-all entrypoint for Vercel", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "api/[...path].ts"), "utf8");
    expect(source).toContain('import { createApp } from "../server/_core/index"');
    expect(source).toContain("const app = createApp()");
    expect(source).toContain("export default app");
  });

  it("keeps server routes outside the SPA fallback", () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8")) as {
      rewrites?: Array<{ source?: string; destination?: string }>;
    };
    const source = config.rewrites?.[0]?.source ?? "";
    expect(source).toContain("api");
    expect(source).toContain("manus-storage");
    expect(config.rewrites?.[0]?.destination).toBe("/index.html");
  });
});
