const defaultTitle = "نغمة | اكتشاف الصوت";
const defaultDescription = "اكتشف أغاني وموسيقى عربية عبر مساحة نغمة الهادئة، مع صفحات فنانين وإصدارات وروابط تجريبية آمنة.";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
  return node;
}

function upsertCanonical(url: string) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", url);
  return node;
}

export function applySeo(input: { title: string; description: string; path: string; type?: "website" | "music.song"; noindex?: boolean; image?: string }) {
  const origin = window.location.origin;
  const canonical = new URL(input.path, origin).toString();
  document.title = input.title;
  upsertMeta("name", "description", input.description);
  upsertMeta("name", "robots", input.noindex ? "noindex,nofollow" : "index,follow");
  upsertMeta("property", "og:title", input.title);
  upsertMeta("property", "og:description", input.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", input.type ?? "website");
  upsertMeta("property", "og:locale", "ar_MA");
  upsertMeta("property", "og:site_name", "نغمة");
  if (input.image) upsertMeta("property", "og:image", input.image);
  upsertMeta("name", "twitter:card", input.image ? "summary_large_image" : "summary");
  upsertMeta("name", "twitter:title", input.title);
  upsertMeta("name", "twitter:description", input.description);
  upsertCanonical(canonical);
}

export function resetSeo() {
  applySeo({ title: defaultTitle, description: defaultDescription, path: "/" });
  document.head.querySelectorAll('script[data-naghma-seo="true"]').forEach(node => node.remove());
}
