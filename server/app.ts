import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { verifyDemoDownloadToken } from "./download";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { countIndexableKeywords, listSitemapKeywords } from "./supabase";

const PUBLIC_ORIGIN = "https://sm3haa.vercel.app";
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
    const totalKeywords = await countIndexableKeywords();
    const pageSize = 45000;
    if (totalKeywords > pageSize) {
      const pages = Math.ceil(totalKeywords / pageSize);
      const sitemaps = Array.from({ length: pages }, (_, index) => `<sitemap><loc>${xmlEscape(`${origin}/sitemap-keywords-${index + 1}.xml`)}</loc></sitemap>`).join("");
      return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${xmlEscape(`${origin}/sitemap-static.xml`)}</loc></sitemap>${sitemaps}</sitemapindex>`);
    }
    const keywords = await listSitemapKeywords(0, pageSize);
    const urls = ["/", "/artists", "/albums", "/search"];
    const staticUrls = urls.map(path => `<url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`).join("");
    const keywordUrls = keywords.map(row => `<url><loc>${xmlEscape(`${origin}/s/${encodeURIComponent(row.slug)}`)}</loc><lastmod>${new Date(row.updated_at).toISOString()}</lastmod></url>`).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${keywordUrls}</urlset>`);
  });

  app.get("/sitemap-static.xml", (req, res) => {
    const origin = getOrigin(req);
    const urls = ["/", "/artists", "/albums", "/search"];
    const body = urls.map(path => `<url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });

  app.get("/sitemap-keywords-:page.xml", async (req, res) => {
    const page = Number(req.params.page);
    if (!Number.isInteger(page) || page < 1) return res.status(404).type("text/plain").send("Not found");
    const origin = getOrigin(req);
    const keywords = await listSitemapKeywords((page - 1) * 45000, 45000);
    if (!keywords.length) return res.status(404).type("text/plain").send("Not found");
    const body = keywords.map(row => `<url><loc>${xmlEscape(`${origin}/s/${encodeURIComponent(row.slug)}`)}</loc><lastmod>${new Date(row.updated_at).toISOString()}</lastmod></url>`).join("");
    return res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });

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
