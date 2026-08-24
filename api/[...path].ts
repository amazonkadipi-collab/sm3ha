// Build artifacts are generated before this entrypoint is type-checked on Vercel.
// @ts-ignore - generated JavaScript bundle has no source declaration file.
import { createApp } from "../dist/app.js";
// @ts-ignore - generated JavaScript bundle has no source declaration file.
import { serveStatic } from "../dist/static.js";

const app = createApp();
serveStatic(app);

export default function handler(req: any, res: any) {
  return app(req, res);
}
