import { describe, expect, it } from "vitest";
import { createOpaqueToken, makeSlug, normalizeArabic, searchDemoSongs } from "./catalog";

describe("catalog utilities", () => {
  it("normalizes common Arabic variants", () => {
    expect(normalizeArabic("إِختبار ة ى")).toBe("اختبار ه ي");
  });

  it("creates readable stable slugs", () => {
    expect(makeSlug("ليلة هادئة")).toBe("ليله-هاديه");
    expect(makeSlug("Soft Song 2026")).toBe("soft-song-2026");
  });

  it("creates opaque non-sequential tokens", () => {
    const token = createOpaqueToken();
    expect(token).toMatch(/^d_[a-f0-9]{32}$/);
    expect(createOpaqueToken()).not.toBe(token);
    expect(createOpaqueToken("demo-layla")).toBe(createOpaqueToken("demo-layla"));
  });

  it("searches demo catalog by title or artist", () => {
    expect(searchDemoSongs("ليلة").length).toBeGreaterThan(0);
    expect(searchDemoSongs("نورا")[0]?.artist).toContain("نورا");
    expect(searchDemoSongs("does-not-exist")).toHaveLength(0);
  });
});
