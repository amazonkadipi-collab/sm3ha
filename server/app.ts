import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { verifyDemoDownloadToken } from "./download";
import { COOKIE_NAME } from "@shared/const";

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
    if (window.size > 10_000) {
      for (const [storedKey, storedEntry] of window) if (storedEntry.resetAt <= now) window.delete(storedKey);
    }
    return entry.count <= limit;
  };

  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()" );

    const originalCookie = res.cookie.bind(res);
    res.cookie = ((name: string, value: unknown, options: any = {}) => {
      if (name === COOKIE_NAME) {
        return originalCookie(name, value, { ...options, sameSite: "lax", secure: true });
      }
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

  app.get("/robots.txt", (_req, res) => {
    const origin = process.env.PUBLIC_SITE_URL || "https://naghmahub.com";
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /media\nSitemap: ${origin}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const origin = process.env.PUBLIC_SITE_URL || "https://naghmahub.com";
    const urls = ["/", "/artists", "/albums", "/search"];
    const body = urls.map(path => `<url><loc>${origin}${path}</loc></url>`).join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    (req, res, next) => {
      if (req.method === "POST" && req.url.includes("adminLogin")) {
        const key = req.ip || "anonymous";
        if (!allowRequest(adminLoginWindow, key, 5, 15 * 60_000)) return res.status(429).json({ error: "Too many login attempts" });
      }
      next();
    },
    createExpressMiddleware({ router: appRouter, createContext }),
  );
  app.get("/api/demo-download/:token", (req, res) => {
    const verified = verifyDemoDownloadToken(req.params.token);
    if (!verified) return res.status(410).json({ error: "This demo link has expired or is invalid." });
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="naghmahub-demo.txt"');
    return res.send(`NaghmaHub demonstration file\nToken: ${verified.opaqueToken}\nThis placeholder is authorized for demonstration only.`);
  });

  return app;
}
