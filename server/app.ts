import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { verifyDemoDownloadToken } from "./download";

export function createApp() {
  const app = express();
  const requestWindow = new Map<string, { count: number; resetAt: number }>();

  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (req.path.startsWith("/api/")) {
      const key = req.ip || "anonymous";
      const now = Date.now();
      const current = requestWindow.get(key);
      const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
      entry.count += 1;
      requestWindow.set(key, entry);
      if (entry.count > 120) return res.status(429).json({ error: "Too many requests" });
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  app.get("/api/demo-download/:token", (req, res) => {
    const verified = verifyDemoDownloadToken(req.params.token);
    if (!verified) return res.status(410).json({ error: "This demo link has expired or is invalid." });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="naghmahub-demo.txt"');
    return res.send(`NaghmaHub demonstration file\nToken: ${verified.opaqueToken}\nThis placeholder is authorized for demonstration only.`);
  });

  return app;
}
