// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import { applySeo, resetSeo } from "./seo";

beforeEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

describe("runtime SEO metadata", () => {
  it.each([
    ["home", "تحميل واستماع أغاني عربية — نغمة", "/", "index,follow"],
    ["search", "نتائج البحث عن راب — نغمة", "/search?q=راب", "index,follow"],
    ["song", "ليلة هادئة — تحميل واستماع | نغمة", "/s/layla-hadia", "index,follow"],
    ["conversion", "اختيار الصيغة والجودة — نغمة", "/videos_dl?v=demo", "noindex,nofollow"],
  ])("writes metadata for %s", (_name, title, path, robots) => {
    applySeo({ title, description: `وصف ${title}`, path, noindex: robots.startsWith("noindex") });
    expect(document.title).toBe(title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(`وصف ${title}`);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(robots);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(new URL(path, window.location.origin).toString());
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(title);
  });

  it("resets the document to the public home metadata", () => {
    applySeo({ title: "صفحة خاصة", description: "مؤقت", path: "/videos_dl?v=demo", noindex: true });
    resetSeo();
    expect(document.title).toBe("نغمة | اكتشاف الصوت");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("index,follow");
  });
});
