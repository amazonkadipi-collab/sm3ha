import { createApp } from "../dist/app.js";

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
