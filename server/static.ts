import express from "express";
import fs from "node:fs";
import path from "node:path";
import { findCatalogKeyword } from "./supabase";
import { formatDuration } from "./catalog";
import { findSongsBySlugs } from "./db";

const PUBLIC_ORIGIN = "https://www.sm3ha.online";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const getOrigin = (_req: express.Request) => {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return configured || PUBLIC_ORIGIN;
};

const absoluteUrl = (req: express.Request, pathname: string) =>
  new URL(pathname, getOrigin(req)).toString();

async function renderKeywordShell(req: express.Request, template: string) {
  const rawSlug = String(req.params[0] || "").replace(/^\/+|\/+$/g, "");
  if (!rawSlug) return null;

  let slug = rawSlug;
  try { slug = decodeURIComponent(rawSlug); } catch { return { status: 400, html: template }; }

  const keyword = slug.replace(/-/g, " ").trim();
  if (!keyword || keyword.length > 120) return { status: 404, html: template };

  const record = await findCatalogKeyword(slug);
  if (!record?.result_slugs?.length) return { status: 404, html: template };

  const songs = await findSongsBySlugs(record.result_slugs, 10);
  if (!songs.length) return { status: 404, html: template };

  const title = `تحميل ${record.query || keyword} Mp3 Mp4 سمعها`;
  const description = `نتائج ${record.query || keyword} في سمعها. إبحث واستكشف الأغاني والفيديوهات المتاحة.`;
  const canonical = absoluteUrl(req, `/s/${encodeURIComponent(record.slug)}`);

  const resultHtml = songs.map(song => {
    const songTitle = escapeHtml(song.title);
    const duration = escapeHtml(formatDuration(song.durationSeconds ?? 0));
    const thumb = song.thumbnailUrl
      ? `<img src="${escapeHtml(song.thumbnailUrl)}" alt="${songTitle}" loading="lazy">`
      : `<span aria-hidden="true">♫</span>`;
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}`;
    return `<article class="reference-media-row"><div class="reference-media-thumb reference-media-thumb-area">${thumb}</div><div class="reference-media-copy"><h2>${songTitle}</h2><p>▶ مدة الفيديو: ${duration}</p></div><div class="reference-media-actions reference-media-actions-area"><a class="reference-action" href="/media?d=${encodeURIComponent(song.opaqueToken)}">تحميل</a><a class="reference-watch" href="${watchUrl}" target="_blank" rel="noreferrer">مشاهدة</a></div></article>`;
  }).join("");

  const content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>سمعها</span><h1>${escapeHtml(title)}</h1></div></section><section class="reference-results" aria-label="${escapeHtml(`نتائج ${record.query || keyword}`)}"><div class="reference-results-title">نتائج «${escapeHtml(record.query || keyword)}»</div>${resultHtml}</section></main>`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "سمعها", url: absoluteUrl(req, "/") },
  }).replace(/</g, "\\u003c");

  const html = template
    .replace(/<html[^>]*>/i, '<html lang="ar" dir="rtl">')
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escapeHtml(description)}"`)
    .replace(/<meta name="robots" content="[^"]*"/i, '<meta name="robots" content="index,follow"')
    .replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escapeHtml(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escapeHtml(description)}"`)
    .replace(/<meta property="og:type" content="[^"]*"/i, '<meta property="og:type" content="website"')
    .replace(/<meta property="og:locale" content="[^"]*"/i, '<meta property="og:locale" content="ar_MA"')
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`)
    .replace("</head>", `<script type="application/ld+json" data-sm3ha-seo="true">${jsonLd}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  return { status: 200, html };
}

export function serveStatic(app: express.Express) {
  const publicPath = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicPath)) console.error(`Could not find static directory: ${publicPath}`);

  app.use(express.static(publicPath));

  app.get("/s/*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.join(publicPath, "index.html"), "utf-8");
      const rendered = await renderKeywordShell(req, template);
      if (!rendered) return next();
      if (rendered.status === 404) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        return res.status(404).send(rendered.html);
      }
      res.setHeader("X-Robots-Tag", "index, follow");
      return res.status(rendered.status).type("html").send(rendered.html);
    } catch (error) {
      console.warn("[SEO] keyword server render failed:", error);
      return next(error);
    }
  });

  app.use("*", (_req, res) => {
    res.status(404).sendFile(path.join(publicPath, "index.html"));
  });
}
