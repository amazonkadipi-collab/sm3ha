import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (relative: string) => readFileSync(resolve(root, relative), "utf8");

describe("SEO and reference workflow contracts", () => {
  it("keeps SEO metadata and page workflows aligned with current routes", () => {
    const seo = read("client/src/lib/seo.ts");
    const home = read("client/src/pages/Home.tsx");
    const search = read("client/src/pages/SearchPage.tsx");
    const song = read("client/src/pages/SongPage.tsx");
    const conversion = read("client/src/pages/ConversionPage.tsx");

    expect(seo).toContain("canonical");
    expect(seo).toContain('"og:title"');
    expect(seo).toContain('"robots"');
    expect(home).toContain("trpc.catalog.keywords.useQuery");
    expect(home).toContain("workflowLinks.keyword(value)");
    expect(search).toContain("applySeo");
    expect(search).toContain("workflowLinks.search(query)");
    expect(song).toContain('"@type": "MusicRecording"');
    expect(song).toContain("workflowLinks.media(song.opaqueToken)");
    expect(conversion).toContain("noindex: true");
    expect(conversion).toContain("/api/youtube/info?d=");
  });

  it("keeps opaque catalog tokens wired through the authorized conversion flow", () => {
    const app = read("client/src/App.tsx");
    const search = read("client/src/pages/SearchPage.tsx");
    const song = read("client/src/pages/SongPage.tsx");
    const media = read("client/src/pages/MediaPage.tsx");
    const conversion = read("client/src/pages/ConversionPage.tsx");
    const flow = read("client/src/lib/flow.ts");
    const routers = read("server/routers.ts");

    expect(app).toContain('path="/search"');
    expect(app).toContain('path="/s/:slug"');
    expect(app).toContain('path="/media"');
    expect(app).toContain('path="/videos_dl"');
    expect(search).toContain("navigate(workflowLinks.search(query))");
    expect(song).toContain("workflowLinks.media(song.opaqueToken)");
    expect(media).toContain("workflowLinks.conversion(media.opaqueToken)");
    expect(flow).toContain("/videos_dl?d=");
    expect(conversion).toContain("startConversion.mutateAsync({ token, format, quality: selectedQuality })");
    expect(routers).toContain("startConversion: publicProcedure");
    expect(routers).toContain("token: z.string().min(8).max(128)");
  });
});
