import { createApp } from "../dist/app.js";
import { serveStatic } from "../dist/static.js";

const app = createApp();
serveStatic(app);

export default function handler(req: any, res: any) {
  return app(req, res);
}
