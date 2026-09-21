import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { verifyDemoDownloadToken } from "./download";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { countIndexableKeywords, listSitemapKeywords, countIndexableSongs, listSitemapSongs, countSitemapArtists, listSitemapArtists, countSitemapAlbums, listSitemapAlbums } from "./supabase";

const PUBLIC_ORIGIN = "https://www.sm3ha.online";
const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
const getOrigin = (req: express.Request) => process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || PUBLIC_ORIGIN;

export function createApp() {
  const app = express();
  const requestWindow = new Map<string, { count: number; resetAt: number }>();
  const adminLoginWindow = new Map<string, { count: number; resetAt: number }>();

  const allowRequest = (window: Map<string, { count: number; resetAt: number }>, key: string, limit: number, windowMs: number) => {
    const now = Date.now();
    const current = window.get(key);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    entry.count += 1;
    window.set(key, entry);
    if (window.size > 10_000) window.forEach((storedEntry, storedKey) => { if (storedEntry.resetAt <= now) window.delete(storedKey); });
    return entry.count <= limit;
  };

  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()" );
    const forwardedProto = req.headers["x-forwarded-proto"];
    const secureRequest = req.protocol === "https" || (typeof forwardedProto === "string" && forwardedProto.split(",")[0].trim().toLowerCase() === "https");
    const originalCookie = res.cookie.bind(res);
    res.cookie = ((name: string, value: unknown, options: any = {}) => {
      if (name === COOKIE_NAME) return originalCookie(name, value, { ...options, sameSite: "lax", secure: secureRequest });
      return originalCookie(name, value, options);
    }) as typeof res.cookie;
    if (req.path.startsWith("/api/")) {
      const key = req.ip || "anonymous";
      if (!allowRequest(requestWindow, key, 120, 60_000)) return res.status(429).json({ error: "Too many requests" });
    }
    next();
  });

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  app.get("/favicon.ico", (_req, res) => {
    res.type("image/svg+xml").send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#756590"/><path d="M38 14v24.2a9.5 9.5 0 1 1-6-8.8V20l18-5v18.2a9.5 9.5 0 1 1-6-8.8V14H38z" fill="white"/></svg>`);
  });

  app.get("/robots.txt", (req, res) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /media\nSitemap: ${getOrigin(req)}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    const origin = getOrigin(req);
    const pageSize = 45000;
    const [keywords, songs, artists, albums] = await Promise.all([
      countIndexableKeywords(), countIndexableSongs(), countSitemapArtists(), countSitemapAlbums()
    ]);
    const groups = [
      { name: "static", count: 4 },
      { name: "keywords", count: keywords },
      { name: "songs", count: songs },
      { name: "artists", count: artists },
      { name: "albums", count: albums },
    ];
    const entries = groups.flatMap(group => {
      const pages = Math.max(1, Math.ceil(group.count / pageSize));
      return Array.from({ length: pages }, (_, i) => {
        const suffix = pages === 1 ? "" : `-${i + 1}`;
        return `<sitemap><loc>${xmlEscape(`${origin}/sitemap-${group.name}${suffix}.xml`)}</loc></sitemap>`;
      });
    }).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`);
  });

  const sendEntitySitemap = async (req: express.Request, res: express.Response, kind: "keywords" | "songs" | "artists" | "albums") => {
    const page = req.params.page ? Number(req.params.page) : 1;
    if (!Number.isInteger(page) || page < 1) return res.status(404).type("text/plain").send("Not found");
    const origin = getOrigin(req);
    const offset = (page - 1) * 45000;
    const rows = kind === "keywords"
      ? await listSitemapKeywords(offset, 45000)
      : kind === "songs"
        ? await listSitemapSongs(offset, 45000)
        : kind === "artists"
          ? await listSitemapArtists(offset, 45000)
          : await listSitemapAlbums(offset, 45000);
    if (!rows.length) return res.status(404).type("text/plain").send("Not found");
    const prefix = kind === "keywords" ? "/s/" : kind === "songs" ? "/song/" : kind === "artists" ? "/artists/" : "/album/";
    const body = rows.map((row: any) => {
      const lastmod = row.updated_at ?? row.created_at;
      const mod = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "";
      return `<url><loc>${xmlEscape(`${origin}${prefix}${encodeURIComponent(row.slug)}`)}</loc>${mod}</url>`;
    }).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  };

  app.get("/sitemap-static.xml", (req, res) => {
    const origin = getOrigin(req);
    const urls = ["/", "/artists", "/albums", "/trending"];
    const body = urls.map(path => `<url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });


  app.get("/sitemap-keywords.xml", (req, res) => sendEntitySitemap(req, res, "keywords"));
  app.get("/sitemap-keywords-:page.xml", (req, res) => sendEntitySitemap(req, res, "keywords"));
  app.get("/sitemap-songs.xml", (req, res) => sendEntitySitemap(req, res, "songs"));
  app.get("/sitemap-songs-:page.xml", (req, res) => sendEntitySitemap(req, res, "songs"));
  app.get("/sitemap-artists.xml", (req, res) => sendEntitySitemap(req, res, "artists"));
  app.get("/sitemap-artists-:page.xml", (req, res) => sendEntitySitemap(req, res, "artists"));
  app.get("/sitemap-albums.xml", (req, res) => sendEntitySitemap(req, res, "albums"));
  app.get("/sitemap-albums-:page.xml", (req, res) => sendEntitySitemap(req, res, "albums"));

  registerStorageProxy(app);
  if (ENV.oAuthServerUrl) registerOAuthRoutes(app);
  app.use("/api/trpc", (req, res, next) => {
    if (req.method === "POST" && req.url.includes("adminLogin")) {
      const key = req.ip || "anonymous";
      if (!allowRequest(adminLoginWindow, key, 5, 15 * 60_000)) return res.status(429).json({ error: "Too many login attempts" });
    }
    next();
  }, createExpressMiddleware({ router: appRouter, createContext }));

  app.get("/admin", (_req, res, next) => { res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive"); next(); });

  app.get("/api/demo-download/:token", (req, res) => {
    const verified = verifyDemoDownloadToken(req.params.token);
    if (!verified) return res.status(410).json({ error: "This demo link has expired or is invalid." });
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="sm3ha-demo.txt"');
    return res.send(`SM3HA demonstration file\nToken: ${verified.opaqueToken}\nThis placeholder is authorized for demonstration only.`);
  });

  return app;
}
