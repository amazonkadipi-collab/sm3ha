import { describe, expect, it } from "vitest";
import { createOpaqueToken, isRelevantSearchResult, makeSlug, normalizeArabic, normalizeSearchQuery } from "./catalog";

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
});

describe("v1-style search archive normalization", () => {
  it("removes download utility words and generic music categories from a specific song query", () => {
    const query = normalizeSearchQuery("تحميل اغاني عمرو دياب MP3");
    expect(query).toBe("عمرو دياب");
    expect(makeSlug(query)).toBe("عمرو-دياب");
  });

  it("keeps a generic music query usable when no specific term remains", () => {
    expect(normalizeSearchQuery("تحميل اغاني")).toBe("اغاني");
    expect(makeSlug(normalizeSearchQuery("تحميل اغاني"))).toBe("اغاني");
  });

  it("normalizes Arabic hamza variants before creating an archive slug", () => {
    expect(makeSlug(normalizeSearchQuery("تنزيل أغاني إيمان"))).toBe("ايمان");
  });

  it("filters stale cached results that do not match a multi-word artist query", () => {
    expect(isRelevantSearchResult("تحميل اغاني عمرو دياب", "يا أنا يا لأ", "عمرو دياب", "عمرو-دياب-يا-انا")).toBe(true);
    expect(isRelevantSearchResult("تحميل اغاني عمرو دياب", "نمبر وان", "محمد رمضان", "محمد-رمضان-نمبر-وان")).toBe(false);
  });

  it("keeps generic music archives broad", () => {
    expect(isRelevantSearchResult("تحميل اغاني", "أغنية جديدة", "فنان", "اغنيه-جديده")).toBe(true);
  });

  it("does not erase a specific query when it already contains no utility words", () => {
    expect(normalizeSearchQuery("يزن حمدان")).toBe("يزن حمدان");
    expect(makeSlug(normalizeSearchQuery("يزن حمدان"))).toBe("يزن-حمدان");
  });
});
