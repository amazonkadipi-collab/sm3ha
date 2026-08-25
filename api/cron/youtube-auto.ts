import { runYouTubeAutoImport } from "../../server/youtube-auto-import";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.CRON_SECRET;
  const authorization = String(req.headers?.authorization ?? "");
  if (secret && authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });
  if (!secret && process.env.NODE_ENV === "production") return res.status(503).json({ error: "CRON_SECRET is not configured" });

  try {
    const result = await runYouTubeAutoImport();
    return res.status(result.status === "failed" ? 502 : 200).json(result);
  } catch (error) {
    console.error("[YouTube auto-import] failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Auto-import failed" });
  }
}
