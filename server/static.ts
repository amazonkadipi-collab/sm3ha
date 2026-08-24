import express from "express";
import fs from "node:fs";
import path from "node:path";

export function serveStatic(app: express.Express) {
  const publicPath = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicPath)) {
    console.error(`Could not find static directory: ${publicPath}`);
  }

  app.use(express.static(publicPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
