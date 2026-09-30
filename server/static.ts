import express from "express";
import fs from "node:fs";
import path from "node:path";
import { findCatalogKeyword, listCatalogKeywords, persistImportedRows, upsertCatalogKeyword } from "./supabase";
import { ENV } from "./_core/env";
import { searchYouTubeVideos } from "./youtube";
import { formatDuration, isLikelyMusicTitle, makeSlug } from "./catalog";
import { findAlbumBySlug, findArtistBySlug, findSongBySlug, findSongs, findSongsBySlugs, listArtists } from "./db";

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



function renderNotFoundShell(req: express.Request, template: string) {
  const html = template
    .replace(/<title>[^<]*<\/title>/i, "<title>الصفحة غير موجودة | سمعها</title>")
    .replace(/<meta name="description" content="[^"]*"/i, '<meta name="description" content="الصفحة المطلوبة غير موجودة في سمعها."')
    .replace(/<meta name="robots" content="[^"]*"/i, '<meta name="robots" content="noindex,nofollow,noarchive"')
    .replace(/<meta property="og:title" content="[^"]*"/i, '<meta property="og:title" content="الصفحة غير موجودة | سمعها"')
    .replace(/<meta property="og:description" content="[^"]*"/i, '<meta property="og:description" content="الصفحة المطلوبة غير موجودة في سمعها."')
    .replace(/<link rel="canonical"[^>]*>/i, "")
    .replace(/<script type="application\/ld\+json" data-sm3ha-seo="true">[\s\S]*?<\/script>/gi, "")
    .replace('<div id="root"></div>', '<div id="root"><main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><h1>الصفحة غير موجودة</h1><p>هذه الصفحة غير متاحة.</p></main></div>');
  return { status: 404, html };
}

async function renderKeywordShell(req: express.Request, template: string) {
  const rawSlug = String(req.params[0] || "").replace(/^\/+|\/+$/g, "");
  if (!rawSlug) return null;

  let slug = rawSlug;
  try { slug = decodeURIComponent(rawSlug); } catch { return { status: 400, html: template }; }

  const keyword = slug.replace(/-/g, " ").trim();
  if (!keyword || keyword.length > 120) return { status: 404, html: renderNotFoundShell(req, template).html };

  // Match the v1 /s/* behavior: any meaningful query can resolve on first visit.
  const record = await findCatalogKeyword(slug);
  let rawSongs = record?.result_slugs?.length
    ? await findSongsBySlugs(record.result_slugs, 20)
    : await findSongs(keyword, 20);

  // Match v1-style discovery for new queries: when the local archive has no
  // usable results, perform one real provider search, persist the metadata,
  // then render the persisted rows so /s/* is useful to crawlers on first visit.
  if (!rawSongs.length && ENV.youtubeApiKey) {
    try {
      const youtubeRows = await searchYouTubeVideos(keyword, 20);
      if (youtubeRows.length) {
        const persisted = await persistImportedRows(youtubeRows);
        if (persisted.acceptedSlugs?.length) {
          rawSongs = await findSongsBySlugs(persisted.acceptedSlugs, 20);
          if (rawSongs.length) {
            await upsertCatalogKeyword(keyword, rawSongs.map(song => song.slug), "youtube-search", true);
          }
        }
      }
    } catch (error) {
      console.warn("[SEO] keyword provider search failed:", error instanceof Error ? error.message : error);
    }
  }

  const songs = rawSongs.slice(0, 20);


  const canonicalSlug = record?.slug || makeSlug(keyword);
  const resolvedQuery = record?.query || keyword;
  if (!record?.result_slugs?.length) {
    await upsertCatalogKeyword(keyword, songs.map(song => song.slug), "search", true);
  }

  const title = `تحميل ${resolvedQuery} Mp3 Mp4 سمعها`;
  const description = `نتائج ${resolvedQuery} في سمعها. إبحث واستكشف الأغاني والفيديوهات المتاحة.`;
  const canonical = absoluteUrl(req, `/s/${encodeURIComponent(canonicalSlug)}`);

  const resultHtml = songs.map(song => {
    const songTitle = escapeHtml(song.title);
    const artist = escapeHtml(song.artist || "فنان");
    const duration = escapeHtml(formatDuration(song.durationSeconds ?? 0));
    const thumb = song.thumbnailUrl
      ? `<img src="${escapeHtml(song.thumbnailUrl)}" alt="${songTitle}" loading="lazy">`
      : `<span aria-hidden="true">♫</span>`;
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}`;
    return `<article class="reference-media-row"><div class="reference-media-thumb reference-media-thumb-area">${thumb}</div><div class="reference-media-copy"><h2><a href="/song/${encodeURIComponent(song.slug)}">${songTitle}</a></h2><p>${artist}</p><p>▶ مدة الفيديو: ${duration}</p></div><div class="reference-media-actions reference-media-actions-area"><a class="reference-action" href="/media?d=${encodeURIComponent(song.opaqueToken)}">تحميل</a><a class="reference-watch" href="${watchUrl}" target="_blank" rel="noreferrer">مشاهدة</a></div></article>`;
  }).join("");

  const artists = Array.from(new Set(songs.map(song => song.artist).filter(Boolean))).slice(0, 8);
  const artistSummary = artists.length ? ` وتشمل النتائج أعمالاً مرتبطة بـ ${artists.map(escapeHtml).join("، ")}.` : "";
  const summary = `<section class="reference-results-summary" aria-label="نبذة عن النتائج"><p>هذه صفحة نتائج بحث عن «${escapeHtml(resolvedQuery)}» في سمعها. تعرض الصفحة ${songs.length} نتيجة متاحة من فهرس الوسائط، مع اسم العمل والفنان والمدة وروابط المشاهدة والتحميل حسب التوفر.${artistSummary} يمكنك فتح أي نتيجة للوصول إلى صفحة الأغنية ومعلوماتها والنتائج المرتبطة.</p></section>`;

  const relatedRows = await listCatalogKeywords(50);
  const keywordWords = new Set(keyword.toLocaleLowerCase("ar").split(/\s+/).filter(Boolean));
  const relatedHtml = relatedRows
    .filter(item => Boolean(item?.slug) && item.slug !== canonicalSlug && Number(item.result_count ?? 0) > 0 && Boolean(item?.query))
    .map(item => ({ item, overlap: String(item.query ?? "").toLocaleLowerCase("ar").split(/\s+/).filter(Boolean).filter(word => keywordWords.has(word)).length }))
    .filter(entry => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.item.query.localeCompare(b.item.query, "ar"))
    .slice(0, 12)
    .map(({ item }) => `<a href="/s/${encodeURIComponent(item.slug)}">تحميل ${escapeHtml(item.query)}</a>`)
    .join("");
  const relatedSection = relatedHtml ? `<section class="mt-8 border-t border-black/10 pt-5" aria-label="كلمات مرتبطة"><div class="mb-3 text-sm font-semibold">مواضيع مرتبطة</div><div class="flex flex-wrap gap-2">${relatedHtml}</div></section>` : "";
  const content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>سمعها</span><h1>${escapeHtml(title)}</h1></div></section>${summary}<section class="reference-results" aria-label="${escapeHtml(`نتائج ${resolvedQuery}`)}"><div class="reference-results-title">نتائج «${escapeHtml(resolvedQuery)}»</div>${resultHtml}</section>${relatedSection}</main>`;

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
    .replace(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${escapeHtml(canonical)}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${escapeHtml(title)}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${escapeHtml(description)}"` )
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
    const song = await findSongBySlug(slug) as any;
    if (!song || !isLikelyMusicTitle(song.title, song.artist ?? "")) return { status: 404, html: template };
    title = `${song.title} Mp3 - تحميل واستماع | سمعها`;
    description = `استمع واكتشف ${song.title} على سمعها. معلومات الأغنية ونتائج موسيقية مرتبطة.`;
    canonical = absoluteUrl(req, `/song/${encodeURIComponent(song.slug)}`);
    const artistLink = song.artistSlug ? `<a href="/artists/${encodeURIComponent(song.artistSlug)}">${escapeHtml(song.artist || "الفنان")}</a>` : "";
    content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>سمعها</span><h1>${escapeHtml(song.title)}</h1><p>${artistLink}</p></div></section><section class="reference-results"><article class="reference-media-row"><div class="reference-media-thumb reference-media-thumb-area">${song.thumbnailUrl ? `<img src="${escapeHtml(song.thumbnailUrl)}" alt="${escapeHtml(song.title)}" loading="lazy">` : "<span aria-hidden=\"true\">♫</span>"}</div><div class="reference-media-copy"><h2>${escapeHtml(song.title)}</h2><p>مدة الفيديو: ${escapeHtml(formatDuration(song.durationSeconds ?? 0))}</p></div><div class="reference-media-actions reference-media-actions-area"><a class="reference-action" href="/media?d=${encodeURIComponent(song.opaqueToken)}">تحميل</a><a class="reference-watch" href="https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}" target="_blank" rel="noreferrer">مشاهدة</a></div></article></section></main>`;
    jsonLd = { "@context": "https://schema.org", "@type": "MusicRecording", name: song.title, url: canonical, image: song.thumbnailUrl || undefined, duration: song.durationSeconds ? `PT${Math.floor(song.durationSeconds / 60)}M${song.durationSeconds % 60}S` : undefined, byArtist: song.artist ? { "@type": "MusicGroup", name: song.artist, url: song.artistSlug ? absoluteUrl(req, `/artists/${encodeURIComponent(song.artistSlug)}`) : undefined } : undefined };
  } else if (kind === "artist") {
    const artist = await findArtistBySlug(slug) as any;
    if (!artist?.songs?.length) return { status: 404, html: template };
    title = `اغاني ${artist.name} Mp3 - تحميل واستماع | سمعها`;
    description = `استكشف أغاني ${artist.name} واستمع إلى النتائج المتاحة عبر سمعها.`;
    canonical = absoluteUrl(req, `/artists/${encodeURIComponent(artist.slug)}`);
    const songs = artist.songs.slice(0, 20).map(song => `<article class="reference-media-row"><div class="reference-media-copy"><h2><a href="/song/${encodeURIComponent(song.slug)}">${escapeHtml(song.title)}</a></h2><p>مدة الفيديو: ${escapeHtml(formatDuration(song.durationSeconds ?? 0))}</p></div></article>`).join("");
    content = `<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>الفنان</span><h1>${escapeHtml(artist.name)}</h1><p>أغاني الفنان المتاحة في سمعها</p></div></section><section class="reference-results" aria-label="أغاني الفنان">${songs}</section></main>`;
    jsonLd = { "@context": "https://schema.org", "@type": "MusicGroup", name: artist.name, url: canonical, image: artist.imageUrl || undefined };
  } else {
    const album = await findAlbumBySlug(slug) as any;
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
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escapeHtml(description)}"`)
    .replace(/<meta name="robots" content="[^"]*"/i, '<meta name="robots" content="index,follow"')
    .replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escapeHtml(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escapeHtml(description)}"`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`)
    .replace("</head>", `<script type="application/ld+json" data-sm3ha-seo="true">${ld}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  return { status: 200, html };
}

async function renderArtistsArchiveShell(req: express.Request, template: string) {
  const artists = await listArtists(50);
  if (!artists.length) return { status: 404, html: renderNotFoundShell(req, template).html };
  const title = "الفنانون Mp3 - سمعها";
  const description = "أرشيف الفنانين في سمعها مع روابط مباشرة إلى صفحات الفنانين وأغانيهم.";
  const canonical = absoluteUrl(req, "/artists");
  const cards = artists.map((artist: any) => '<article class="reference-media-row"><div class="reference-media-thumb reference-media-thumb-area">' + (artist.imageUrl ? '<img src="' + escapeHtml(artist.imageUrl) + '" alt="' + escapeHtml(artist.name) + '" loading="lazy">' : '<span aria-hidden="true">♫</span>') + '</div><div class="reference-media-copy"><h2><a href="/artists/' + encodeURIComponent(artist.slug) + '">' + escapeHtml(artist.name) + '</a></h2><p>' + Number(artist.songCount ?? 0) + ' إصدار</p></div></article>').join("");
  const content = '<main dir="rtl" class="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><a href="/" class="reference-back">الرئيسية</a><section class="reference-page-head"><div><span>سمعها</span><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p></div></section><section class="reference-results" aria-label="أرشيف الفنانين">' + cards + '</section></main>';
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: canonical, mainEntity: { "@type": "ItemList", itemListElement: artists.map((artist: any, index: number) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(req, "/artists/" + encodeURIComponent(artist.slug)), name: artist.name })) } }).replace(/</g, "\\u003c");
  const html = template.replace(/<html[^>]*>/i, '<html lang="ar" dir="rtl">').replace(/<title>[^<]*<\/title>/i, '<title>' + escapeHtml(title) + '</title>').replace(/<meta name="description" content="[^"]*"/i, '<meta name="description" content="' + escapeHtml(description) + '"').replace(/<meta name="robots" content="[^"]*"/i, '<meta name="robots" content="index,follow"').replace(/<meta property="og:title" content="[^"]*"/i, '<meta property="og:title" content="' + escapeHtml(title) + '"').replace(/<meta property="og:description" content="[^"]*"/i, '<meta property="og:description" content="' + escapeHtml(description) + '"').replace(/<meta property="og:url" content="[^"]*"/i, '<meta property="og:url" content="' + escapeHtml(canonical) + '"').replace(/<link rel="canonical"[^>]*>/i, '<link rel="canonical" href="' + escapeHtml(canonical) + '">').replace("</head>", '<script type="application/ld+json" data-sm3ha-seo="true">' + jsonLd + '</script></head>').replace('<div id="root"></div>', '<div id="root">' + content + '</div>');
  return { status: 200, html };
}

export function serveStatic(app: express.Express) {
  const publicPath = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicPath)) console.error(`Could not find static directory: ${publicPath}`);

  app.use(express.static(publicPath));


  app.get("/artists", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.join(publicPath, "index.html"), "utf-8");
      const rendered = await renderArtistsArchiveShell(req, template);
      if (rendered.status === 404) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        return res.status(404).type("html").send(rendered.html);
      }
      res.setHeader("X-Robots-Tag", "index, follow");
      return res.status(200).type("html").send(rendered.html);
    } catch (error) {
      console.warn("[SEO] artists archive render failed:", error);
      return next(error);
    }
  });

  for (const [route, kind] of [["/song/:slug", "song"], ["/artists/:slug", "artist"], ["/album/:slug", "album"]] as const) {
    app.get(route, async (req, res, next) => {
      try {
        const template = await fs.promises.readFile(path.join(publicPath, "index.html"), "utf-8");
        const rendered = await renderEntityShell(req, template, kind);
        if (rendered.status === 404) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
          return res.status(404).type("html").send(renderNotFoundShell(req, template).html);
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

  // Client-side routes such as /login must load the SPA shell with HTTP 200.
  // Unknown SEO entity routes are handled above and can still return 404.
  app.use("*", (_req, res) => {
    res.status(200).sendFile(path.join(publicPath, "index.html"));
  });
}
