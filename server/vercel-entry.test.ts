import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel entrypoint", () => {
  it("declares the root Vercel handler without starting a listener", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "index.ts"), "utf8");
    expect(source).toContain('import { createApp } from "./dist/app.js"');
    expect(source).toContain('import { serveStatic } from "./dist/static.js"');
    expect(source).toContain("const app = createApp()");
    expect(source).toContain("serveStatic(app)");
    expect(source).toContain("export default app");
  });

  it("uses the official root Express entrypoint and generated public output", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "index.ts"), "utf8");
    expect(source).toContain('import { createApp } from "./dist/app.js"');
    expect(source).toContain('import { serveStatic } from "./dist/static.js"');
    expect(source).toContain("const app = createApp()");
    expect(source).toContain("export default app");

    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")) as { scripts?: { build?: string } };
    expect(packageJson.scripts?.build).toContain("cp -R dist/public/. public/");
    expect(packageJson.scripts?.build).toContain("server/app.ts");
    expect(packageJson.scripts?.build).toContain("server/static.ts");

    const apiSource = fs.readFileSync(path.resolve(process.cwd(), "api/[...path].ts"), "utf8");
    expect(apiSource).toContain('import { createApp } from "../dist/app.js"');
    expect(apiSource).toContain('import { serveStatic } from "../dist/static.js"');
    expect(apiSource).toContain("const app = createApp()");
    expect(apiSource).toContain("serveStatic(app)");
    expect(apiSource).toContain("export default function handler");
    expect(apiSource).toContain("return app(req, res)");
  });

  it("includes the Google Search Console verification meta tag", () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), "client/index.html"), "utf8");
    expect(html).toContain('<meta name="google-site-verification" content="WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A" />');
  });

  it("keeps server routes outside the SPA fallback", () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8")) as {
      rewrites?: Array<{ source?: string; destination?: string }>;
      functions?: Record<string, { includeFiles?: string }>;
    };
    const rootRewrite = config.rewrites?.[0];
    const apiRewrite = config.rewrites?.[1];
    const spaRewrite = config.rewrites?.[2];
    const functionConfig = config.functions?.["api/[...path].ts"];
    expect(functionConfig?.includeFiles).toBe("public/**");
    expect(rootRewrite?.source).toBe("/");
    expect(rootRewrite?.destination).toBe("/api/[...path]");
    expect(apiRewrite?.source).toBe("/api/:path*");
    expect(apiRewrite?.destination).toBe("/api/[...path]");
    expect(spaRewrite?.source).toBe("/:path*");
    expect(spaRewrite?.destination).toBe("/api/[...path]");
  });
});
