import express from "express";
import fs from "node:fs";
import path from "node:path";
import { findCatalogKeyword } from "./supabase";
import { formatDuration } from "./catalog";
import { findAlbumBySlug, findArtistBySlug, findSongBySlug, findSongsBySlugs } from "./db";

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

async function renderEntityShell(req: express.Request, template: string, kind: "song" | "artist" | "album") {
  const rawSlug = String(req.params.slug || "").trim();
  if (!rawSlug || rawSlug.length > 255) return { status: 404, html: template };

  let slug = rawSlug;
  try { slug = decodeURIComponent(rawSlug); } catch { return { status: 404, html: template }; }

  let title = "";
  let description = "";
  let canonical = "";
  let content = "";
  let jsonLd: Record<string, unknown>;

  if (kind === "song") {
    const song = await findSongBySlug(slug);
    if (!song) return { status: 404, html: template };
    title = `${song.title} Mp3 - تحميل واستماع | سمعها`;
    description = `استمع واكتشف ${song.title} على سمعها. معلومات الأغنية ونتائج موسيقية مرتبطة.`;
    canonical = absoluteUrl(req, `/song/${encodeURIComponent(song.slug)}`);
    const artistLink = song.artistSlug ? `<a href="/artists/${encodeURIComponent(song.artistSlug)}">${escapeHtml(song.artist || "الفنان")}</a>` : "";
    content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>سمعها</span><h1>${escapeHtml(song.title)}</h1><p>${artistLink}</p></div></section><section class="reference-results"><article class="reference-media-row"><div class="reference-media-thumb reference-media-thumb-area">${song.thumbnailUrl ? `<img src="${escapeHtml(song.thumbnailUrl)}" alt="${escapeHtml(song.title)}" loading="lazy">` : "<span aria-hidden=\"true\">♫</span>"}</div><div class="reference-media-copy"><h2>${escapeHtml(song.title)}</h2><p>مدة الفيديو: ${escapeHtml(formatDuration(song.durationSeconds ?? 0))}</p></div><div class="reference-media-actions reference-media-actions-area"><a class="reference-action" href="/media?d=${encodeURIComponent(song.opaqueToken)}">تحميل</a><a class="reference-watch" href="https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}" target="_blank" rel="noreferrer">مشاهدة</a></div></article></section></main>`;
    jsonLd = { "@context": "https://schema.org", "@type": "MusicRecording", name: song.title, url: canonical, image: song.thumbnailUrl || undefined, duration: song.durationSeconds ? `PT${Math.floor(song.durationSeconds / 60)}M${song.durationSeconds % 60}S` : undefined, byArtist: song.artist ? { "@type": "MusicGroup", name: song.artist, url: song.artistSlug ? absoluteUrl(req, `/artists/${encodeURIComponent(song.artistSlug)}`) : undefined } : undefined };
  } else if (kind === "artist") {
    const artist = await findArtistBySlug(slug);
    if (!artist?.songs?.length) return { status: 404, html: template };
    title = `اغاني ${artist.name} Mp3 - تحميل واستماع | سمعها`;
    description = `استكشف أغاني ${artist.name} واستمع إلى النتائج المتاحة عبر سمعها.`;
    canonical = absoluteUrl(req, `/artists/${encodeURIComponent(artist.slug)}`);
    const songs = artist.songs.slice(0, 20).map(song => `<article class="reference-media-row"><div class="reference-media-copy"><h2><a href="/song/${encodeURIComponent(song.slug)}">${escapeHtml(song.title)}</a></h2><p>مدة الفيديو: ${escapeHtml(formatDuration(song.durationSeconds ?? 0))}</p></div></article>`).join("");
    content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>الفنان</span><h1>${escapeHtml(artist.name)}</h1><p>أغاني الفنان المتاحة في سمعها</p></div></section><section class="reference-results" aria-label="أغاني الفنان">${songs}</section></main>`;
    jsonLd = { "@context": "https://schema.org", "@type": "MusicGroup", name: artist.name, url: canonical, image: artist.imageUrl || undefined };
  } else {
    const album = await findAlbumBySlug(slug);
    if (!album?.songs?.length) return { status: 404, html: template };
    title = `البوم ${album.title} - اغاني Mp3 | سمعها`;
    description = `استكشف ألبوم ${album.title} والأغاني المتاحة عبر سمعها.`;
    canonical = absoluteUrl(req, `/album/${encodeURIComponent(album.slug)}`);
    const songs = album.songs.slice(0, 50).map(song => `<article class="reference-media-row"><div class="reference-media-copy"><h2><a href="/song/${encodeURIComponent(song.slug)}">${escapeHtml(song.title)}</a></h2><p>مدة الفيديو: ${escapeHtml(formatDuration(song.durationSeconds ?? 0))}</p></div></article>`).join("");
    content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>الألبوم</span><h1>${escapeHtml(album.title)}</h1><p>الأغاني المتاحة في هذا الألبوم</p></div></section><section class="reference-results" aria-label="أغاني الألبوم">${songs}</section></main>`;
    jsonLd = { "@context": "https://schema.org", "@type": "MusicAlbum", name: album.title, url: canonical, image: album.imageUrl || undefined };
  }

  const ld = JSON.stringify(jsonLd, (_key, value) => value === undefined ? undefined : value).replace(/</g, "\\u003c");
  const html = template
    .replace(/<html[^>]*>/i, '<html lang="ar" dir="rtl">')
    .replace(/<title>[^<]*<\\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escapeHtml(description)}"`)
    .replace(/<meta name="robots" content="[^"]*"/i, '<meta name="robots" content="index,follow"')
    .replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escapeHtml(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escapeHtml(description)}"`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`)
    .replace("</head>", `<script type="application/ld+json" data-sm3ha-seo="true">${ld}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  return { status: 200, html };
}

export function serveStatic(app: express.Express) {
  const publicPath = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicPath)) console.error(`Could not find static directory: ${publicPath}`);

  app.use(express.static(publicPath));


  for (const [route, kind] of [["/song/:slug", "song"], ["/artists/:slug", "artist"], ["/album/:slug", "album"]] as const) {
    app.get(route, async (req, res, next) => {
      try {
        const template = await fs.promises.readFile(path.join(publicPath, "index.html"), "utf-8");
        const rendered = await renderEntityShell(req, template, kind);
        if (rendered.status === 404) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
          return res.status(404).send(rendered.html);
        }
        res.setHeader("X-Robots-Tag", "index, follow");
        return res.status(200).type("html").send(rendered.html);
      } catch (error) {
        console.warn(`[SEO] ${kind} server render failed:`, error);
        return next(error);
      }
    });
  }

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
