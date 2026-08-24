import { createApp } from "../server/_core/index";

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
