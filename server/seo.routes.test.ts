import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (relative: string) => readFileSync(resolve(root, relative), "utf8");

describe("SEO and reference workflow contracts", () => {
  it("keeps metadata contracts for public and conversion pages", () => {
    const seo = read("client/src/lib/seo.ts");
    const home = read("client/src/pages/Home.tsx");
    const search = read("client/src/pages/SearchPage.tsx");
    const song = read("client/src/pages/SongPage.tsx");
    const conversion = read("client/src/pages/ConversionPage.tsx");
    expect(seo).toContain("canonical");
    expect(seo).toContain('"og:title"');
    expect(seo).toContain('"robots"');
    expect(home).toContain("تحميل واستماع أغاني عربية");
    expect(search).toContain("نتائج البحث عن");
    expect(song).toContain("MusicRecording");
    expect(song).toContain("تحميل واستماع");
    expect(conversion).toContain("noindex: true");
  });

  it("keeps the reference route sequence wired end to end", () => {
    const app = read("client/src/App.tsx");
    const search = read("client/src/pages/SearchPage.tsx");
    const song = read("client/src/pages/SongPage.tsx");
    const media = read("client/src/pages/MediaPage.tsx");
    const conversion = read("client/src/pages/ConversionPage.tsx");
    expect(app).toContain('path="/search"');
    expect(app).toContain('path="/s/:slug"');
    expect(app).toContain('path="/media"');
    expect(app).toContain('path="/videos_dl"');
    expect(search).toContain("navigate(workflowLinks.song(data[0].slug))");
    expect(song).toContain("workflowLinks.media(song.opaqueToken)");
    expect(media).toContain("workflowLinks.conversion(media.providerVideoId)");
    expect(conversion).toContain("اختيار الصيغة والجودة");
  });
});
