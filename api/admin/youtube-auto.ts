import { getSupabaseAdmin } from "../../server/supabase";
import { runYouTubeAutoImport } from "../../server/youtube-auto-import";
import { sdk } from "../../server/_core/sdk";

function isAdmin(user: any) {
  return user?.role === "admin";
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === "on";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let user: any = null;
  try { user = await sdk.authenticateRequest(req); } catch { user = null; }
  if (!isAdmin(user)) return res.status(403).json({ error: "Admin access required" });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: "Supabase is not configured" });

  if (req.method === "GET") {
    const { data, error } = await supabase.from("site_settings").select("key,value").in("key", ["youtube_auto_enabled", "youtube_auto_queries", "youtube_auto_max_queries", "youtube_auto_videos_per_query"]);
    if (error) return res.status(500).json({ error: error.message });
    const settings = Object.fromEntries((data ?? []).map(row => [row.key, row.value]));
    return res.status(200).json({
      enabled: parseBoolean(settings.youtube_auto_enabled),
      queries: String(settings.youtube_auto_queries ?? "").split(/[\n,،]+/).map((q: string) => q.trim()).filter(Boolean),
      maxQueries: Number(settings.youtube_auto_max_queries ?? 5),
      videosPerQuery: Number(settings.youtube_auto_videos_per_query ?? 10),
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const rows = [
    { key: "youtube_auto_enabled", value: parseBoolean(body.enabled) ? "true" : "false" },
    { key: "youtube_auto_queries", value: Array.isArray(body.queries) ? body.queries.map((q: unknown) => String(q).trim()).filter(Boolean).slice(0, 20).join("\n") : "" },
    { key: "youtube_auto_max_queries", value: String(Math.min(Math.max(Number(body.maxQueries) || 5, 1), 10)) },
    { key: "youtube_auto_videos_per_query", value: String(Math.min(Math.max(Number(body.videosPerQuery) || 10, 1), 25)) },
  ];
  const { error } = await supabase.from("site_settings").upsert(rows.map(row => ({ ...row, updated_by: user.openId ?? null, updated_at: new Date().toISOString() })), { onConflict: "key" });
  if (error) return res.status(500).json({ error: error.message });

  if (body.runNow) {
    const result = await runYouTubeAutoImport();
    return res.status(200).json({ saved: true, result });
  }
  return res.status(200).json({ saved: true });
}
